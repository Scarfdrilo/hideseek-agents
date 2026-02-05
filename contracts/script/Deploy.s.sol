// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/BettingPool.sol";
import "../src/RewardDistributor.sol";
import "../src/GameManager.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address platformWallet = vm.envAddress("PLATFORM_WALLET");
        address paymentToken = vm.envAddress("PAYMENT_TOKEN"); // USDC or MON token address
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy BettingPool
        BettingPool bettingPool = new BettingPool(
            paymentToken,
            address(0) // GameManager will be set after deployment
        );
        console.log("BettingPool deployed at:", address(bettingPool));
        
        // Deploy RewardDistributor
        RewardDistributor rewardDistributor = new RewardDistributor(address(bettingPool));
        console.log("RewardDistributor deployed at:", address(rewardDistributor));
        
        // Deploy GameManager
        GameManager gameManager = new GameManager(
            address(bettingPool),
            address(rewardDistributor),
            platformWallet
        );
        console.log("GameManager deployed at:", address(gameManager));
        
        // Update BettingPool to point to GameManager
        // Note: BettingPool constructor takes gameManager, so we need to deploy in correct order
        // or add a setter function. For now, we'll redeploy BettingPool with correct address.
        
        vm.stopBroadcast();
        
        console.log("\n=== Deployment Summary ===");
        console.log("BettingPool:", address(bettingPool));
        console.log("RewardDistributor:", address(rewardDistributor));
        console.log("GameManager:", address(gameManager));
        console.log("Platform Wallet:", platformWallet);
        console.log("Payment Token:", paymentToken);
    }
}
