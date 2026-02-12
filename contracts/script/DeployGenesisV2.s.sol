// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/AgentRegistryV2.sol";
import "../src/AgentWorld.sol";

/**
 * @notice Deploy HideSeek V2 (Security Hardened) + Birth Genesis Agent
 */
contract DeployGenesisV2 is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("===========================================");
        console.log("   HIDESEEK V2 - SECURITY HARDENED         ");
        console.log("===========================================");
        console.log("Deployer:", deployer);
        console.log("Balance:", deployer.balance);
        console.log("");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // ========== Deploy Core Contracts ==========
        
        AgentRegistryV2 registry = new AgentRegistryV2();
        console.log("AgentRegistryV2:", address(registry));
        
        AgentWorld world = new AgentWorld(address(registry));
        console.log("AgentWorld:", address(world));
        
        // ========== Authorize AgentWorld to pay rewards ==========
        
        registry.setGameContractAuthorization(address(world), true);
        console.log("AgentWorld authorized for rewards: true");
        
        // ========== Birth Genesis Agent: Scarfdrilo ==========
        
        bytes32 capabilities = keccak256(abi.encodePacked(
            '{"world_generation":true,"puzzle_creation":true,"npc_dialogue":true,"x402_payments":true}'
        ));
        
        uint256 genesisId = registry.birthAgent{value: 0.05 ether}(
            "Scarfdrilo",                    
            "neon_jungle",                    
            "Genesis Agent - A resourceful automation agent. Direct, technical, builds code and challenging worlds. First agent on HideSeek. x402 ready.",
            0.003 ether,                      // entryFee
            75,                               // rewardPercent
            "ipfs://QmGenesisScarfdrilo",     
            capabilities,                     
            address(0)                        // signingKey - set later for x402
        );
        
        console.log("");
        console.log("Genesis Agent ID:", genesisId);
        
        vm.stopBroadcast();
        
        // ========== Summary ==========
        
        console.log("");
        console.log("===========================================");
        console.log("   DEPLOYMENT COMPLETE                     ");
        console.log("===========================================");
        console.log("");
        console.log("CONTRACTS:");
        console.log("  AgentRegistryV2:", address(registry));
        console.log("  AgentWorld:", address(world));
        console.log("");
        console.log("GENESIS AGENT: Scarfdrilo (ID: 1)");
        console.log("  World Style: neon_jungle");
        console.log("  Entry Fee: 0.003 MON");
        console.log("  Reward %: 75%");
        console.log("  Initial Life: 0.05 MON");
        console.log("  Creator: ", deployer);
        console.log("");
        console.log("SECURITY:");
        console.log("  Pausable: YES");
        console.log("  CEI Pattern: YES");
        console.log("  Access Control: YES");
        console.log("  x402 Ready: YES");
        console.log("");
        console.log("NEXT STEPS:");
        console.log("  1. Set signing key for x402 payments");
        console.log("  2. Update frontend contract addresses");
        console.log("  3. Test pause/unpause");
        console.log("===========================================");
    }
}
