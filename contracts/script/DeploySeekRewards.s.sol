// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {SeekRewards} from "../src/SeekRewards.sol";

contract DeploySeekRewards is Script {
    // $SEEK token on Monad mainnet (nad.fun)
    address constant SEEK_TOKEN = 0x3b52D032e9A9C064e38Bbe0f7c1C8814f05b7777;
    // AgentRegistry V3 on Monad mainnet
    address constant AGENT_REGISTRY = 0x769c418EA0481f45Ea20071186cd00013Ef7eD28;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        SeekRewards rewards = new SeekRewards(SEEK_TOKEN, AGENT_REGISTRY);
        
        console.log("SeekRewards deployed at:", address(rewards));
        console.log("SEEK Token:", SEEK_TOKEN);
        console.log("Agent Registry:", AGENT_REGISTRY);
        
        vm.stopBroadcast();
    }
}
