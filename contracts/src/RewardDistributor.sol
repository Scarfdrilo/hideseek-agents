// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./BettingPool.sol";

/**
 * @title RewardDistributor
 * @notice Pareto distribution for HideSeek rewards
 * Longer hide times = bigger share of pool
 */
contract RewardDistributor {
    BettingPool public bettingPool;
    
    event RewardsDistributed(uint256 indexed matchId, address[] winners, uint256[] amounts);
    event PlatformFee(uint256 indexed matchId, address platform, uint256 amount);
    
    constructor(address _bettingPool) {
        bettingPool = BettingPool(_bettingPool);
    }
    
    /**
     * @notice Distribute rewards using Pareto formula
     * @param matchId The match ID
     * @param hiders Array of hider addresses
     * @param discoveryTimes Array of discovery times (in seconds)
     * @param platformWallet Address to receive platform fee
     * @param platformFeePercent Platform fee percentage (e.g., 5 for 5%)
     */
    function distribute(
        uint256 matchId,
        address[] memory hiders,
        uint256[] memory discoveryTimes,
        address platformWallet,
        uint256 platformFeePercent
    ) external {
        require(hiders.length == discoveryTimes.length, "Array length mismatch");
        
        uint256 totalPool = bettingPool.getMatchPool(matchId);
        require(totalPool > 0, "No pool to distribute");
        
        // Calculate platform fee
        uint256 platformFee = (totalPool * platformFeePercent) / 100;
        uint256 prizePool = totalPool - platformFee;
        
        // Send platform fee
        bettingPool.releasePool(matchId, platformWallet, platformFee);
        emit PlatformFee(matchId, platformWallet, platformFee);
        
        // Calculate total weighted time (Pareto distribution)
        uint256 totalWeightedTime = 0;
        for (uint256 i = 0; i < discoveryTimes.length; i++) {
            // Only count if object was found (time > 0)
            if (discoveryTimes[i] > 0) {
                totalWeightedTime += discoveryTimes[i];
            }
        }
        
        // If no discoveries, return funds to bettors (edge case)
        if (totalWeightedTime == 0) {
            // TODO: Implement refund logic
            return;
        }
        
        // Distribute rewards proportionally
        uint256[] memory rewards = new uint256[](hiders.length);
        for (uint256 i = 0; i < hiders.length; i++) {
            if (discoveryTimes[i] > 0) {
                rewards[i] = (prizePool * discoveryTimes[i]) / totalWeightedTime;
                bettingPool.releasePool(matchId, hiders[i], rewards[i]);
            }
        }
        
        emit RewardsDistributed(matchId, hiders, rewards);
    }
}
