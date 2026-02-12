// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/AgentRegistry.sol";
import "../src/AgentWorld.sol";

/**
 * @notice Deploy HideSeek Agent Economy contracts
 */
contract DeployAgents is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy AgentRegistry (ERC-721 agent identities)
        AgentRegistry registry = new AgentRegistry();
        console.log("AgentRegistry deployed at:", address(registry));
        
        // Deploy AgentWorld (gameplay/challenges)
        AgentWorld world = new AgentWorld(address(registry));
        console.log("AgentWorld deployed at:", address(world));
        
        vm.stopBroadcast();
        
        // Log summary
        console.log("\n=== HideSeek Agent Economy ===");
        console.log("AgentRegistry:", address(registry));
        console.log("AgentWorld:", address(world));
        console.log("==============================\n");
    }
}
