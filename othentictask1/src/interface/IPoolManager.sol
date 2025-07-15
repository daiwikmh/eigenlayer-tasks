// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IPoolManager {
    // Minimal interface for hook integration
    function updateDynamicLPFee(bytes32 poolId, uint24 fee) external;
}