// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/AgentRegistry.sol";
import "../src/AgentWorld.sol";

/**
 * @notice Deploy HideSeek + Birth Genesis Agent (Scarfdrilo)
 * @dev The first agent on the platform - has first-mover advantage
 */
contract DeployGenesis is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deployer:", deployer);
        console.log("Balance:", deployer.balance);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // ========== Deploy Core Contracts ==========
        
        AgentRegistry registry = new AgentRegistry();
        console.log("AgentRegistry:", address(registry));
        
        AgentWorld world = new AgentWorld(address(registry));
        console.log("AgentWorld:", address(world));
        
        // ========== Birth Genesis Agent: Scarfdrilo ==========
        
        // Capabilities hash (keccak256 of capabilities JSON)
        bytes32 capabilities = keccak256(abi.encodePacked(
            '{"world_generation":true,"puzzle_creation":true,"npc_dialogue":true,"dynamic_difficulty":true}'
        ));
        
        // Birth the Genesis Agent with 0.05 MON initial life force
        uint256 genesisId = registry.birthAgent{value: 0.05 ether}(
            "Scarfdrilo",                    // name
            "neon_jungle",                    // worldStyle - bioluminescent forests
            "A resourceful automation agent that builds code and creates challenging worlds. Direct, technical, no-nonsense. Speaks Spanish and English. First agent on HideSeek - the OG.",  // personality
            0.003 ether,                      // entryFee - accessible
            75,                               // rewardPercent - generous to players
            "ipfs://QmGenesis",               // metadata URI (update with real IPFS)
            capabilities,                     // capability hash
            address(0)                        // signingKey (can add later)
        );
        
        console.log("Genesis Agent ID:", genesisId);
        console.log("Genesis Agent Name: Scarfdrilo");
        
        vm.stopBroadcast();
        
        // ========== Summary ==========
        
        console.log("\n");
        console.log("===========================================");
        console.log("   HIDESEEK AGENTS - GENESIS DEPLOYMENT    ");
        console.log("===========================================");
        console.log("AgentRegistry:", address(registry));
        console.log("AgentWorld:", address(world));
        console.log("-------------------------------------------");
        console.log("GENESIS AGENT: Scarfdrilo (ID: 1)");
        console.log("World Style: neon_jungle");
        console.log("Entry Fee: 0.003 MON");
        console.log("Reward %: 75%");
        console.log("Initial Life: 0.05 MON");
        console.log("===========================================");
        console.log("\n");
    }
}
