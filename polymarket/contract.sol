pragma solidity ^0.8.26;

import {ISignatureUtilsMixin} from "@eigenlayer-contracts/src/contracts/interfaces/ISignatureUtilsMixin.sol";
import {IAVSDirectory} from "@eigenlayer-contracts/src/contracts/interfaces/IAVSDirectory.sol";
import {ECDSA} from "solady/utils/ECDSA.sol";
import "forge-std/console.sol";

contract PolymarketServiceManager {
    using ECDSA for bytes32;

    // State
    address public immutable avsDirectory;
    uint32 public latestMarketId;
    uint32 public latestResolutionTaskNum;
    mapping(address => bool) public operatorRegistered;
    mapping(uint32 => bytes32) public allResolutionTaskHashes;
    mapping(address => mapping(uint32 => bytes)) public allResolutionResponses;
    mapping(uint32 => Market) public markets;
    mapping(uint32 => mapping(address => Position)) public userPositions;

    // Events
    event MarketCreated(uint32 indexed marketId, string question, MarketType marketType, string[] outcomes);
    event BetPlaced(uint32 indexed marketId, address indexed user, uint256 outcomeIndex, uint256 amount, uint256 shares);
    event NewResolutionTask(uint32 indexed taskIndex, uint32 indexed marketId, ResolutionTask task);
    event MarketResolved(uint32 indexed marketId, uint256 winningOutcome, uint32 taskIndex, address operator);

    // Enums
    enum MarketType {
        BINARY,          // YES/NO outcomes
        CATEGORICAL,     // Multiple choice (A, B, C, D)
        SCALAR,          // Numerical range (price between X and Y)
        CONDITIONAL      // If-then scenarios
    }

    enum ResolutionSource {
        ORACLE,          // External data feed
        CONSENSUS,       // Operator majority vote
        MANUAL,          // Designated resolver
        AUTOMATIC        // Smart contract logic
    }

    // Types
    struct Market {
        string question;
        string description;
        MarketType marketType;
        ResolutionSource resolutionSource;
        uint256 endTime;
        uint256 resolutionTime;
        bool resolved;
        string[] outcomes;           // Flexible outcomes array
        uint256 winningOutcome;      // Index of winning outcome
        mapping(uint256 => uint256) outcomeShares;  // outcome index => total shares
        uint256 totalPool;
        uint32 marketCreatedBlock;
        bytes customData;            // Additional market-specific data
    }

    struct Position {
        mapping(uint256 => uint256) outcomeShares;  // outcome index => user shares
        uint256 totalInvested;
    }

    struct ResolutionTask {
        uint32 marketId;
        string question;
        string description;
        MarketType marketType;
        string[] possibleOutcomes;
        ResolutionSource resolutionSource;
        bytes resolutionCriteria;    // Custom resolution logic
        uint32 taskCreatedBlock;
    }

    // Modifiers
    modifier onlyOperator() {
        require(operatorRegistered[msg.sender], "Operator must be the caller");
        _;
    }

    modifier marketExists(uint32 marketId) {
        require(marketId < latestMarketId, "Market does not exist");
        _;
    }

    modifier marketActive(uint32 marketId) {
        Market storage market = markets[marketId];
        require(block.timestamp < market.endTime, "Market has ended");
        require(!market.resolved, "Market is already resolved");
        _;
    }

    modifier marketEnded(uint32 marketId) {
        Market storage market = markets[marketId];
        require(block.timestamp >= market.endTime, "Market has not ended yet");
        require(!market.resolved, "Market is already resolved");
        _;
    }

    // Constructor
    constructor(address _avsDirectory) {
        avsDirectory = _avsDirectory;
    }

    // Register Operator
    function registerOperatorToAVS(
        address operator,
        ISignatureUtilsMixin.SignatureWithSaltAndExpiry memory operatorSignature
    ) external {
        console.log("==> Called registerOperatorToAVS");
        console.log("  - Operator: %s", operator);
        console.log("  - AVSDirectory: %s", avsDirectory);

        try IAVSDirectory(avsDirectory).registerOperatorToAVS(operator, operatorSignature) {
            console.log("==> AVSDirectory.registerOperatorToAVS succeeded");
            operatorRegistered[operator] = true;
        } catch Error(string memory reason) {
            console.log("!!! Revert reason: %s", reason);
            revert(reason);
        } catch (bytes memory lowLevelData) {
            console.log("!!! Low-level revert. No string reason.");
            revert("Low-level revert in registerOperatorToAVS");
        }
    }

    // Deregister Operator
    function deregisterOperatorFromAVS(address operator) external onlyOperator {
        require(msg.sender == operator);
        IAVSDirectory(avsDirectory).deregisterOperatorFromAVS(operator);
        operatorRegistered[operator] = false;
    }

    // Create Custom Market
    function createMarket(
        string memory question,
        string memory description,
        MarketType marketType,
        ResolutionSource resolutionSource,
        string[] memory outcomes,
        uint256 duration,
        bytes memory customData
    ) external returns (uint32) {
        require(duration > 0, "Duration must be greater than 0");
        require(outcomes.length >= 2, "Must have at least 2 outcomes");
        require(outcomes.length <= 10, "Too many outcomes (max 10)");

        Market storage newMarket = markets[latestMarketId];
        newMarket.question = question;
        newMarket.description = description;
        newMarket.marketType = marketType;
        newMarket.resolutionSource = resolutionSource;
        newMarket.endTime = block.timestamp + duration;
        newMarket.resolutionTime = newMarket.endTime + 1 days;
        newMarket.resolved = false;
        newMarket.outcomes = outcomes;
        newMarket.totalPool = 0;
        newMarket.marketCreatedBlock = uint32(block.number);
        newMarket.customData = customData;

        emit MarketCreated(latestMarketId, question, marketType, outcomes);
        
        uint32 currentMarketId = latestMarketId;
        latestMarketId++;
        return currentMarketId;
    }

    // Create Binary Market (simplified interface)
    function createBinaryMarket(
        string memory question,
        string memory description,
        uint256 duration
    ) external returns (uint32) {
        string[] memory outcomes = new string[](2);
        outcomes[0] = "YES";
        outcomes[1] = "NO";
        
        return this.createMarket(
            question,
            description,
            MarketType.BINARY,
            ResolutionSource.CONSENSUS,
            outcomes,
            duration,
            ""
        );
    }

    // Place Bet
    function placeBet(
        uint32 marketId,
        uint256 outcomeIndex
    ) external payable marketExists(marketId) marketActive(marketId) {
        require(msg.value > 0, "Bet amount must be greater than 0");

        Market storage market = markets[marketId];
        require(outcomeIndex < market.outcomes.length, "Invalid outcome index");
        
        Position storage position = userPositions[marketId][msg.sender];

        uint256 shares = calculateShares(marketId, outcomeIndex, msg.value);
        
        market.outcomeShares[outcomeIndex] += shares;
        position.outcomeShares[outcomeIndex] += shares;
        market.totalPool += msg.value;
        position.totalInvested += msg.value;

        emit BetPlaced(marketId, msg.sender, outcomeIndex, msg.value, shares);
    }

    // Calculate shares using automated market maker formula
    function calculateShares(
        uint32 marketId,
        uint256 outcomeIndex,
        uint256 amount
    ) public view returns (uint256) {
        Market storage market = markets[marketId];
        
        if (market.totalPool == 0) {
            return amount; // Initial liquidity
        }

        uint256 currentShares = market.outcomeShares[outcomeIndex];
        uint256 totalAllShares = 0;
        
        // Calculate total shares across all outcomes
        for (uint256 i = 0; i < market.outcomes.length; i++) {
            totalAllShares += market.outcomeShares[i];
        }
        
        // Simple constant product formula adapted for multiple outcomes
        if (totalAllShares == 0) {
            return amount;
        }
        
        return (amount * (currentShares + 1e18)) / (totalAllShares + amount + 1e18);
    }

    // Create Resolution Task
    function createResolutionTask(
        uint32 marketId,
        bytes memory resolutionCriteria
    ) external marketExists(marketId) marketEnded(marketId) returns (ResolutionTask memory) {
        Market storage market = markets[marketId];
        require(block.timestamp >= market.resolutionTime, "Resolution period has not started");

        ResolutionTask memory newTask;
        newTask.marketId = marketId;
        newTask.question = market.question;
        newTask.description = market.description;
        newTask.marketType = market.marketType;
        newTask.possibleOutcomes = market.outcomes;
        newTask.resolutionSource = market.resolutionSource;
        newTask.resolutionCriteria = resolutionCriteria;
        newTask.taskCreatedBlock = uint32(block.number);

        allResolutionTaskHashes[latestResolutionTaskNum] = keccak256(abi.encode(newTask));
        emit NewResolutionTask(latestResolutionTaskNum, marketId, newTask);
        latestResolutionTaskNum++;

        return newTask;
    }

    // Resolve Market
    function resolveMarket(
        ResolutionTask calldata task,
        uint32 referenceTaskIndex,
        uint256 winningOutcomeIndex,
        bytes memory signature
    ) external onlyOperator {
        require(
            keccak256(abi.encode(task)) == allResolutionTaskHashes[referenceTaskIndex],
            "supplied task does not match the one recorded in the contract"
        );
        require(
            allResolutionResponses[msg.sender][referenceTaskIndex].length == 0,
            "Operator has already responded to the task"
        );

        Market storage market = markets[task.marketId];
        require(!market.resolved, "Market is already resolved");
        require(winningOutcomeIndex < market.outcomes.length, "Invalid outcome index");

        // Verify signature
        bytes32 messageHash = keccak256(
            abi.encodePacked(winningOutcomeIndex, task.marketId, task.question)
        );
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        if (ethSignedMessageHash.recover(signature) != msg.sender) {
            revert("Invalid signature");
        }

        // Resolve market
        market.resolved = true;
        market.winningOutcome = winningOutcomeIndex;

        // Store response
        allResolutionResponses[msg.sender][referenceTaskIndex] = signature;

        emit MarketResolved(task.marketId, winningOutcomeIndex, referenceTaskIndex, msg.sender);
    }

    // Claim Winnings
    function claimWinnings(uint32 marketId) external marketExists(marketId) {
        Market storage market = markets[marketId];
        require(market.resolved, "Market is not resolved yet");

        Position storage position = userPositions[marketId][msg.sender];
        uint256 winningShares = position.outcomeShares[market.winningOutcome];
        require(winningShares > 0, "No winning shares to claim");

        uint256 totalWinningShares = market.outcomeShares[market.winningOutcome];
        require(totalWinningShares > 0, "No winning shares exist");
        
        uint256 payout = (winningShares * market.totalPool) / totalWinningShares;

        // Reset all positions for this user
        for (uint256 i = 0; i < market.outcomes.length; i++) {
            position.outcomeShares[i] = 0;
        }
        position.totalInvested = 0;

        payable(msg.sender).transfer(payout);
    }

    // Get Market Basic Info (due to mapping limitations)
    function getMarketInfo(uint32 marketId) external view returns (
        string memory question,
        string memory description,
        MarketType marketType,
        ResolutionSource resolutionSource,
        uint256 endTime,
        uint256 resolutionTime,
        bool resolved,
        uint256 winningOutcome,
        uint256 totalPool,
        string[] memory outcomes
    ) {
        Market storage market = markets[marketId];
        return (
            market.question,
            market.description,
            market.marketType,
            market.resolutionSource,
            market.endTime,
            market.resolutionTime,
            market.resolved,
            market.winningOutcome,
            market.totalPool,
            market.outcomes
        );
    }

    // Get User Position for specific outcome
    function getUserShares(uint32 marketId, address user, uint256 outcomeIndex) external view returns (uint256) {
        return userPositions[marketId][user].outcomeShares[outcomeIndex];
    }

    // Get User Total Investment
    function getUserTotalInvestment(uint32 marketId, address user) external view returns (uint256) {
        return userPositions[marketId][user].totalInvested;
    }

    // Get Outcome Shares
    function getOutcomeShares(uint32 marketId, uint256 outcomeIndex) external view returns (uint256) {
        return markets[marketId].outcomeShares[outcomeIndex];
    }

    // Get Market Odds for all outcomes
    function getMarketOdds(uint32 marketId) external view returns (uint256[] memory odds) {
        Market storage market = markets[marketId];
        odds = new uint256[](market.outcomes.length);
        
        uint256 totalShares = 0;
        for (uint256 i = 0; i < market.outcomes.length; i++) {
            totalShares += market.outcomeShares[i];
        }
        
        if (totalShares == 0) {
            // Equal odds for all outcomes initially
            uint256 equalOdds = 10000 / market.outcomes.length;
            for (uint256 i = 0; i < market.outcomes.length; i++) {
                odds[i] = equalOdds;
            }
        } else {
            for (uint256 i = 0; i < market.outcomes.length; i++) {
                odds[i] = (market.outcomeShares[i] * 10000) / totalShares;
            }
        }
        
        return odds;
    }
}