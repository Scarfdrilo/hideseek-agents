// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title BettingPool
 * @notice Manages USDC/MON bets for HideSeek matches
 */
contract BettingPool is ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    IERC20 public paymentToken; // USDC or MON
    
    struct Bet {
        address bettor;
        uint256 amount;
        bool withdrawn;
    }
    
    mapping(uint256 => Bet[]) public matchBets;
    mapping(uint256 => uint256) public matchPools;
    mapping(uint256 => bool) public matchLocked;
    
    address public gameManager;
    
    event BetPlaced(uint256 indexed matchId, address indexed bettor, uint256 amount);
    event BetWithdrawn(uint256 indexed matchId, address indexed bettor, uint256 amount);
    event MatchLocked(uint256 indexed matchId, uint256 totalPool);
    
    modifier onlyGameManager() {
        require(msg.sender == gameManager, "Only GameManager");
        _;
    }
    
    constructor(address _paymentToken, address _gameManager) {
        paymentToken = IERC20(_paymentToken);
        gameManager = _gameManager;
    }
    
    /**
     * @notice Place a bet on a match
     */
    function placeBet(uint256 matchId, uint256 amount) external nonReentrant {
        require(!matchLocked[matchId], "Match already locked");
        require(amount > 0, "Bet must be > 0");
        
        paymentToken.safeTransferFrom(msg.sender, address(this), amount);
        
        matchBets[matchId].push(Bet({
            bettor: msg.sender,
            amount: amount,
            withdrawn: false
        }));
        
        matchPools[matchId] += amount;
        
        emit BetPlaced(matchId, msg.sender, amount);
    }
    
    /**
     * @notice Lock match pool (called by GameManager when match starts)
     */
    function lockMatch(uint256 matchId) external onlyGameManager {
        require(!matchLocked[matchId], "Already locked");
        
        matchLocked[matchId] = true;
        
        emit MatchLocked(matchId, matchPools[matchId]);
    }
    
    /**
     * @notice Get total pool for a match
     */
    function getMatchPool(uint256 matchId) external view returns (uint256) {
        return matchPools[matchId];
    }
    
    /**
     * @notice Transfer funds to reward distributor (called after match)
     */
    function releasePool(uint256 matchId, address recipient, uint256 amount) external onlyGameManager {
        require(matchLocked[matchId], "Match not locked");
        require(amount <= matchPools[matchId], "Insufficient pool");
        
        paymentToken.safeTransfer(recipient, amount);
    }
}
