// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract WorkflowLog {
    event ActionLog(bytes32 indexed studentHash, string action, uint256 timestamp);

    function logAction(string memory studentId, string memory action) public {
        bytes32 studentHash = keccak256(abi.encodePacked(studentId));
        emit ActionLog(studentHash, action, block.timestamp);
    }
}
