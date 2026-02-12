// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/AgentRegistryV2Optimized.sol";

/**
 * @notice Gas-optimized deployment - should cost ~0.5 MON
 */
contract DeployOptimized is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);
        
        console.log("Deployer:", deployer);
        console.log("Balance:", deployer.balance);
        
        vm.startBroadcast(pk);
        
        // Deploy optimized registry
        AgentRegistryV2Optimized registry = new AgentRegistryV2Optimized();
        console.log("Registry:", address(registry));
        
        // Birth Genesis Agent with 0.05 MON
        uint256 id = registry.birthAgent{value: 0.05 ether}(
            "Scarfdrilo",
            "neon_jungle", 
            0.003 ether,  // entry fee
            75,           // reward %
            "ipfs://QmGenesisScarfdrilo"
        );
        
        console.log("Genesis Agent ID:", id);
        
        vm.stopBroadcast();
        
        console.log("");
        console.log("====== DEPLOYED ======");
        console.log("Registry:", address(registry));
        console.log("Genesis: Scarfdrilo #1");
        console.log("Creator:", deployer);
        console.log("======================");
    }
}
