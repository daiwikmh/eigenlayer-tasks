// SPDX-License-License-Identifier: UNLICENSED
pragma solidity >=0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {CredibilityScore} from "../src/CredibilityScore.sol";

contract DeployCredibilityScoreL1 is Script {
    function setUp() public {}

    function run() public {
        vm.startBroadcast();
        address l1MessageHandler = 0x9ac9409ae6E372201DF6B29f19a140bf4A26161a;
        CredibilityScore credibilityScore = new CredibilityScore(l1MessageHandler);
        console.log("CredibilityScore deployed at:", address(credibilityScore));
        vm.stopBroadcast();
    }
}