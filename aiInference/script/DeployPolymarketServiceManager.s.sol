// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import {Script} from "forge-std/Script.sol";
import {PolymarketServiceManager} from "../src/PolymarketServiceManager.sol";
import {IDelegationManager, IDelegationManagerTypes} from "eigenlayer-contracts/src/contracts/interfaces/IDelegationManager.sol";
import {ISignatureUtilsMixinTypes} from "@eigenlayer-contracts/src/contracts/interfaces/ISignatureUtilsMixin.sol";
import {IAVSDirectory} from "eigenlayer-contracts/src/contracts/interfaces/IAVSDirectory.sol";
import "forge-std/console.sol";

contract DeployPolymarketServiceManager is Script {
    // EigenLayer Core Contracts
    address internal constant AVS_DIRECTORY =
        0x055733000064333CaDDbC92763c58BF0192fFeBf;
    address internal constant DELEGATION_MANAGER =
        0xA44151489861Fe9e3055d95adC98FbD462B948e7;

    address internal deployer;
    address internal operator;
    PolymarketServiceManager serviceManager;

    function setUp() public virtual {
        deployer = vm.rememberKey(vm.envUint("PRIVATE_KEY"));
        operator = vm.rememberKey(vm.envUint("OPERATOR_PRIVATE_KEY1"));
        vm.label(deployer, "Deployer");
        vm.label(operator, "Operator");
        console.log("Deployer address:", deployer);
        console.log("Operator address:", operator);
    }

    function run() public {
        // Deploy ServiceManager
        vm.startBroadcast(deployer);
        serviceManager = new PolymarketServiceManager(AVS_DIRECTORY);
        console.log("PolymarketServiceManager deployed at:", address(serviceManager));
        vm.stopBroadcast();

        IDelegationManager delegationManager = IDelegationManager(
            DELEGATION_MANAGER
        );

        // Register operator
        vm.startBroadcast(operator);
        delegationManager.registerAsOperator(
            address(0), // initDelegationApprover (set to 0 for no approval required)
            0,         
            ""         
        );
        vm.stopBroadcast();

        // Create operator registration signature
        IAVSDirectory avsDirectory = IAVSDirectory(AVS_DIRECTORY);
        bytes32 salt = keccak256(abi.encodePacked(block.timestamp, operator));
        uint256 expiry = block.timestamp + 1 hours;

        bytes32 digestHash = avsDirectory.calculateOperatorAVSRegistrationDigestHash(
            operator,
            address(serviceManager),
            salt,
            expiry
        );

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(vm.envUint("OPERATOR_PRIVATE_KEY1"), digestHash);
        bytes memory signature = abi.encodePacked(r, s, v);

        ISignatureUtilsMixinTypes.SignatureWithSaltAndExpiry memory operatorSignature =
            ISignatureUtilsMixinTypes.SignatureWithSaltAndExpiry({
                signature: signature,
                salt: salt,
                expiry: expiry
            });

        // Register operator to AVS
        vm.startBroadcast(deployer);
        serviceManager.registerOperatorToAVS(operator, operatorSignature);
        console.log("Operator registered to AVS");
        vm.stopBroadcast();

        // Demo: Create various custom markets
        vm.startBroadcast(deployer);
        
        // 1. Binary Market (simplified)
        uint32 binaryMarketId = serviceManager.createBinaryMarket(
            "Will ETH reach $5000 by end of 2024?",
            "Market resolves to YES if ETH price reaches $5000 USD before Dec 31, 2024",
            30 days
        );
        console.log("Binary market created with ID:", binaryMarketId);
        
        // 2. Categorical Market - Presidential Election
        string[] memory candidates = new string[](4);
        candidates[0] = "Candidate A";
        candidates[1] = "Candidate B"; 
        candidates[2] = "Candidate C";
        candidates[3] = "Other";
        
        uint32 categoricalMarketId = serviceManager.createMarket(
            "Who will win the 2024 election?",
            "Market resolves based on official election results",
            PolymarketServiceManager.MarketType.CATEGORICAL,
            PolymarketServiceManager.ResolutionSource.CONSENSUS,
            candidates,
            180 days, // 6 months
            ""
        );
        console.log("Categorical market created with ID:", categoricalMarketId);
        
        // 3. Scalar Market - Temperature Range
        string[] memory tempRanges = new string[](5);
        tempRanges[0] = unicode"Below 0°C";
        tempRanges[1] = unicode"0-10°C";
        tempRanges[2] = unicode"10-20°C";
        tempRanges[3] = unicode"20-30°C";
        tempRanges[4] = unicode"Above 30°C";
        
        uint32 scalarMarketId = serviceManager.createMarket(
            "What will be the average temperature in NYC in July 2024?",
            "Market resolves based on official weather data from NOAA",
            PolymarketServiceManager.MarketType.SCALAR,
            PolymarketServiceManager.ResolutionSource.ORACLE,
            tempRanges,
            60 days,
            abi.encode("NOAA", "NYC", "July2024") // Custom oracle data
        );
        console.log("Scalar market created with ID:", scalarMarketId);
        
        vm.stopBroadcast();
    }
}