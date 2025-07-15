// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IAttestationCenter {
    struct TaskInfo {
        bytes data; // Encoded data (e.g., wallet address, Twitter score, on-chain score)
    }

    function submitTask(
        TaskInfo calldata taskInfo,
        bool isApproved,
        bytes calldata tpSignature,
        uint256[2] calldata taSignature,
        uint256[] calldata operatorIds
    ) external;
}