// SPDX-License-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IAttestationCenter} from "./interface/IAttestationCenter.sol";

contract MockAttestationCenter {
    address public credibilityScoreContract;

    constructor(address _credibilityScoreContract) {
        credibilityScoreContract = _credibilityScoreContract;
    }

    function setCredibilityScoreContract(address _credibilityScoreContract) external {
        credibilityScoreContract = _credibilityScoreContract;
    }

    function submitTask(
        IAttestationCenter.TaskInfo calldata taskInfo,
        bool isApproved,
        bytes calldata tpSignature,
        uint256[2] calldata taSignature,
        uint256[] calldata operatorIds
    ) external {
        (bool success, ) = credibilityScoreContract.call(
            abi.encodeWithSignature(
                "afterTaskSubmission((bytes),bool,bytes,uint256[2],uint256[])",
                taskInfo,
                isApproved,
                tpSignature,
                taSignature,
                operatorIds
            )
        );
        require(success, "Task submission failed");
    }

    function submitTestTask(
        address wallet,
        uint256 twitterScore,
        uint256 onChainScore,
        bool isApproved
    ) external {
        IAttestationCenter.TaskInfo memory taskInfo = IAttestationCenter.TaskInfo({
            data: abi.encode(wallet, twitterScore, onChainScore)
        });
        uint256[2] memory taSignature = [uint256(0), uint256(0)];
        uint256[] memory operatorIds = new uint256[](0);
        this.submitTask(taskInfo, isApproved, "", taSignature, operatorIds);
    }
}