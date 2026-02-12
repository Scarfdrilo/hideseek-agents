// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SeekRewards
 * @notice Distributes $SEEK tokens to HideSeek players
 * @dev Integrates with AgentRegistry to reward world explorers
 */
contract SeekRewards is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // ============ State ============
    
    IERC20 public immutable seekToken;
    address public agentRegistry;
    
    uint256 public rewardPerVisit = 10 ether; // 10 $SEEK per world visit
    uint256 public rewardPerAgent = 100 ether; // 100 $SEEK for creating agent
    uint256 public totalDistributed;
    
    mapping(address => uint256) public userRewards;
    mapping(address => uint256) public claimedRewards;
    mapping(uint256 => mapping(address => bool)) public visitRewarded; // agentId => visitor => rewarded
    mapping(uint256 => bool) public agentRewarded; // agentId => creator rewarded
    
    // ============ Events ============
    
    event VisitRewarded(uint256 indexed agentId, address indexed visitor, uint256 amount);
    event AgentCreationRewarded(uint256 indexed agentId, address indexed creator, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event RewardsDeposited(address indexed depositor, uint256 amount);
    event RewardRatesUpdated(uint256 perVisit, uint256 perAgent);
    
    // ============ Errors ============
    
    error ZeroAddress();
    error AlreadyRewarded();
    error NothingToClaim();
    error InsufficientBalance();
    
    // ============ Constructor ============
    
    constructor(address _seekToken, address _agentRegistry) Ownable(msg.sender) {
        if (_seekToken == address(0) || _agentRegistry == address(0)) revert ZeroAddress();
        seekToken = IERC20(_seekToken);
        agentRegistry = _agentRegistry;
    }
    
    // ============ Admin ============
    
    function setRewardRates(uint256 _perVisit, uint256 _perAgent) external onlyOwner {
        rewardPerVisit = _perVisit;
        rewardPerAgent = _perAgent;
        emit RewardRatesUpdated(_perVisit, _perAgent);
    }
    
    function setAgentRegistry(address _registry) external onlyOwner {
        if (_registry == address(0)) revert ZeroAddress();
        agentRegistry = _registry;
    }
    
    function depositRewards(uint256 amount) external {
        seekToken.safeTransferFrom(msg.sender, address(this), amount);
        emit RewardsDeposited(msg.sender, amount);
    }
    
    function withdrawExcess(uint256 amount) external onlyOwner {
        seekToken.safeTransfer(msg.sender, amount);
    }
    
    // ============ Reward Distribution ============
    
    /**
     * @notice Call after visiting a world to earn $SEEK
     * @param agentId The agent/world that was visited
     */
    function claimVisitReward(uint256 agentId) external nonReentrant {
        if (visitRewarded[agentId][msg.sender]) revert AlreadyRewarded();
        
        // Verify visitor has actually visited (paid entry)
        (bool hasPaid) = _checkVisited(agentId, msg.sender);
        require(hasPaid, "Must visit world first");
        
        visitRewarded[agentId][msg.sender] = true;
        userRewards[msg.sender] += rewardPerVisit;
        totalDistributed += rewardPerVisit;
        
        emit VisitRewarded(agentId, msg.sender, rewardPerVisit);
    }
    
    /**
     * @notice Call after creating an agent to earn $SEEK
     * @param agentId The agent that was created
     */
    function claimAgentReward(uint256 agentId) external nonReentrant {
        if (agentRewarded[agentId]) revert AlreadyRewarded();
        
        // Verify caller is the agent creator
        address creator = _getAgentCreator(agentId);
        require(creator == msg.sender, "Not agent creator");
        
        agentRewarded[agentId] = true;
        userRewards[msg.sender] += rewardPerAgent;
        totalDistributed += rewardPerAgent;
        
        emit AgentCreationRewarded(agentId, msg.sender, rewardPerAgent);
    }
    
    /**
     * @notice Claim accumulated $SEEK rewards
     */
    function claimRewards() external nonReentrant {
        uint256 pending = userRewards[msg.sender] - claimedRewards[msg.sender];
        if (pending == 0) revert NothingToClaim();
        if (seekToken.balanceOf(address(this)) < pending) revert InsufficientBalance();
        
        claimedRewards[msg.sender] = userRewards[msg.sender];
        seekToken.safeTransfer(msg.sender, pending);
        
        emit RewardsClaimed(msg.sender, pending);
    }
    
    // ============ Views ============
    
    function pendingRewards(address user) external view returns (uint256) {
        return userRewards[user] - claimedRewards[user];
    }
    
    function rewardBalance() external view returns (uint256) {
        return seekToken.balanceOf(address(this));
    }
    
    // ============ Internal ============
    
    function _checkVisited(uint256 agentId, address visitor) internal view returns (bool) {
        // Call hasVisited on AgentRegistry
        (bool success, bytes memory data) = agentRegistry.staticcall(
            abi.encodeWithSignature("hasVisited(uint256,address)", agentId, visitor)
        );
        if (!success) return false;
        return abi.decode(data, (bool));
    }
    
    function _getAgentCreator(uint256 agentId) internal view returns (address) {
        // Call agents mapping on AgentRegistry to get creator
        (bool success, bytes memory data) = agentRegistry.staticcall(
            abi.encodeWithSignature("agents(uint256)", agentId)
        );
        require(success, "Failed to get agent");
        
        // Agent struct: balance, totalEarnings, entryFee, totalVisitors, rewardPercent, 
        //               burnRatePerHour, lastHeartbeat, state, creator, creatorPending
        // creator is at position 8 (0-indexed)
        (,,,,,,,, address creator,) = abi.decode(data, 
            (uint128, uint128, uint64, uint32, uint16, uint16, uint40, uint8, address, uint128));
        return creator;
    }
}
