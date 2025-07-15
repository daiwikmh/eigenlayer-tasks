// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IAttestationCenter} from "./interface/IAttestationCenter.sol";
import {console} from "forge-std/console.sol";

contract CredibilityScore {
    address public immutable ATTESTATION_CENTER;

    // Mapping to store credibility scores for wallet addresses
    mapping(address => uint256) public credibilityScores;

    // Mapping to store OK status for wallet addresses
    mapping(address => bool) public isOK;

    // Mapping to flag malicious users
    mapping(address => bool) public isMalicious;

    // Thresholds for OK status and malicious flagging
    uint256 public constant OK_THRESHOLD = 50; // Score >= 50 for OK status
    uint256 public constant MALICIOUS_THRESHOLD = 20; // Score < 20 for malicious

    // Events for tracking actions
    event CredibilityScoreUpdated(address indexed user, uint256 score);
    event OKStatusUpdated(address indexed user, bool isOK);
    event MaliciousUserFlagged(address indexed user);

    error OnlyAttestationCenter();

    constructor(address _attestationCenterAddress) {
        ATTESTATION_CENTER = _attestationCenterAddress;
    }

    // Function called by Attestation Center after Performer submits task data
    function afterTaskSubmission(
        IAttestationCenter.TaskInfo calldata _taskInfo,
        bool _isApproved,
        bytes calldata, /* _tpSignature */
        uint256[2] calldata, /* _taSignature */
        uint256[] calldata /* _operatorIds */
    ) external {
        if (msg.sender != ATTESTATION_CENTER) revert OnlyAttestationCenter();

        if (_isApproved) {
            // Decode task data: wallet address, Twitter engagement score, on-chain interaction score
            (address wallet, uint256 twitterScore, uint256 onChainScore) = 
                abi.decode(_taskInfo.data, (address, uint256, uint256));

            // Calculate credibility score (weighted average: 40% Twitter, 60% on-chain)
            uint256 credibilityScore = (twitterScore * 40 + onChainScore * 60) / 100;

            // Update credibility score
            credibilityScores[wallet] = credibilityScore;
            emit CredibilityScoreUpdated(wallet, credibilityScore);

            // Assign OK status based on threshold
            bool newOKStatus = credibilityScore >= OK_THRESHOLD;
            isOK[wallet] = newOKStatus;
            emit OKStatusUpdated(wallet, newOKStatus);

            // Flag malicious users if score is too low
            if (credibilityScore < MALICIOUS_THRESHOLD) {
                isMalicious[wallet] = true;
                emit MaliciousUserFlagged(wallet);
            } else {
                isMalicious[wallet] = false;
            }
        }
    }

    // Placeholder for beforeTaskSubmission (can be extended for pre-validation)
    function beforeTaskSubmission(
        IAttestationCenter.TaskInfo calldata _taskInfo,
        bool _isApproved,
        bytes calldata _tpSignature,
        uint256[2] calldata _taSignature,
        uint256[] calldata _attestersIds
    ) external {}

    // Query credibility score for a wallet
    function getCredibilityScore(address wallet) external view returns (uint256) {
        return credibilityScores[wallet];
    }

    // Query OK status for a wallet
    function getOKStatus(address wallet) external view returns (bool) {
        return isOK[wallet];
    }

    // Query if a wallet is flagged as malicious
    function isWalletMalicious(address wallet) external view returns (bool) {
        return isMalicious[wallet];
    }
}