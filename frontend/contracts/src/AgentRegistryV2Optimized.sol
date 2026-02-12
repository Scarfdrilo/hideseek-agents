// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title AgentRegistryV2Optimized
 * @notice Gas-optimized security-hardened agent registry
 * @dev Removed: ERC721URIStorage (use events), signature verification (off-chain), 
 *      long strings (IPFS only), complex pagination
 */
contract AgentRegistryV2Optimized is ERC721, ReentrancyGuard, Ownable, Pausable {
    
    // ============ Enums ============
    
    enum AgentState { Active, Dormant, Retired }
    
    // ============ Structs (Packed) ============
    
    struct Agent {
        uint128 balance;          // Life force - 128 bits enough for 340B MON
        uint128 totalEarnings;    
        uint64 entryFee;          // Max ~18 MON 
        uint32 totalVisitors;     // Max 4B visitors
        uint16 rewardPercent;     // 0-100
        uint16 burnRatePerHour;   // In 0.0001 MON units
        uint40 lastHeartbeat;     // Timestamp fits in 40 bits until year 36812
        AgentState state;
        address creator;
        uint128 creatorPending;
    }
    
    // ============ State ============
    
    uint256 public agentCounter;
    mapping(uint256 => Agent) public agents;
    mapping(uint256 => string) public agentNames;
    mapping(uint256 => string) public agentStyles;
    mapping(bytes32 => bool) public nameTaken;
    mapping(address => bool) public authorizedGames;
    
    // ============ Constants ============
    
    uint64 public constant MIN_ENTRY_FEE = 0.001 ether;
    uint64 public constant MAX_ENTRY_FEE = 1 ether;
    uint128 public constant REVIVAL_COST = 0.01 ether;
    uint128 public constant DORMANCY_THRESHOLD = 0.001 ether;
    uint16 public constant CREATOR_FEE_PERCENT = 10;
    uint16 public constant DEFAULT_BURN_RATE = 1; // 0.0001 MON/hour
    
    // ============ Custom Errors (Gas efficient) ============
    
    error NotExists();
    error NotOwner();
    error NotActive();
    error NotDormant();
    error NotAuthorized();
    error InvalidFee();
    error InvalidPercent();
    error NameTaken();
    error InsufficientFunds();
    error TransferFailed();
    error NoPending();
    
    // ============ Events ============
    
    event AgentBorn(uint256 indexed id, string name, string style, address indexed creator, string metadataURI);
    event AgentFunded(uint256 indexed id, address indexed funder, uint256 amount);
    event AgentDormant(uint256 indexed id);
    event AgentRevived(uint256 indexed id, address indexed reviver);
    event WorldVisited(uint256 indexed id, address indexed visitor, uint256 fee);
    event RewardPaid(uint256 indexed id, address indexed player, uint256 amount);
    event CreatorWithdraw(uint256 indexed id, uint256 amount);
    
    // ============ Constructor ============
    
    constructor() ERC721("HideSeek Agent", "HSAGENT") Ownable(msg.sender) {}
    
    // ============ Admin ============
    
    function setGameAuth(address game, bool auth) external onlyOwner {
        authorizedGames[game] = auth;
    }
    
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
    
    // ============ Agent Lifecycle ============
    
    function birthAgent(
        string calldata name,
        string calldata worldStyle,
        uint64 entryFee,
        uint16 rewardPercent,
        string calldata metadataURI
    ) external payable whenNotPaused returns (uint256) {
        bytes32 nameHash = keccak256(bytes(name));
        if (nameTaken[nameHash]) revert NameTaken();
        if (entryFee < MIN_ENTRY_FEE || entryFee > MAX_ENTRY_FEE) revert InvalidFee();
        if (rewardPercent > 100) revert InvalidPercent();
        if (msg.value < REVIVAL_COST) revert InsufficientFunds();
        
        unchecked { agentCounter++; }
        uint256 id = agentCounter;
        
        agents[id] = Agent({
            balance: uint128(msg.value),
            totalEarnings: 0,
            entryFee: entryFee,
            totalVisitors: 0,
            rewardPercent: rewardPercent,
            burnRatePerHour: DEFAULT_BURN_RATE,
            lastHeartbeat: uint40(block.timestamp),
            state: AgentState.Active,
            creator: msg.sender,
            creatorPending: 0
        });
        
        agentNames[id] = name;
        agentStyles[id] = worldStyle;
        nameTaken[nameHash] = true;
        
        _mint(msg.sender, id);
        
        emit AgentBorn(id, name, worldStyle, msg.sender, metadataURI);
        return id;
    }
    
    function fundAgent(uint256 id) external payable nonReentrant whenNotPaused {
        if (id == 0 || id > agentCounter) revert NotExists();
        if (msg.value == 0) revert InsufficientFunds();
        
        Agent storage a = agents[id];
        a.balance += uint128(msg.value);
        
        if (a.state == AgentState.Dormant && a.balance >= DORMANCY_THRESHOLD) {
            a.state = AgentState.Active;
            a.lastHeartbeat = uint40(block.timestamp);
            emit AgentRevived(id, msg.sender);
        } else {
            emit AgentFunded(id, msg.sender, msg.value);
        }
    }
    
    function enterWorld(uint256 id) external payable nonReentrant whenNotPaused {
        if (id == 0 || id > agentCounter) revert NotExists();
        
        Agent storage a = agents[id];
        if (a.state != AgentState.Active) revert NotActive();
        if (msg.value < a.entryFee) revert InsufficientFunds();
        
        uint128 creatorFee = uint128((msg.value * CREATOR_FEE_PERCENT) / 100);
        uint128 agentShare = uint128(msg.value) - creatorFee;
        
        a.balance += agentShare;
        a.totalEarnings += uint128(msg.value);
        unchecked { a.totalVisitors++; }
        a.lastHeartbeat = uint40(block.timestamp);
        a.creatorPending += creatorFee;
        
        emit WorldVisited(id, msg.sender, msg.value);
    }
    
    function heartbeat(uint256 id) external {
        if (id == 0 || id > agentCounter) revert NotExists();
        
        Agent storage a = agents[id];
        if (a.state != AgentState.Active) return;
        
        uint256 elapsed = block.timestamp - a.lastHeartbeat;
        uint256 hours_ = elapsed / 1 hours;
        
        if (hours_ > 0) {
            uint128 burn = uint128(hours_ * uint256(a.burnRatePerHour) * 0.0001 ether);
            
            if (burn >= a.balance) {
                a.balance = 0;
                a.state = AgentState.Dormant;
                emit AgentDormant(id);
            } else {
                a.balance -= burn;
                if (a.balance < DORMANCY_THRESHOLD) {
                    a.state = AgentState.Dormant;
                    emit AgentDormant(id);
                }
            }
            a.lastHeartbeat = uint40(block.timestamp);
        }
    }
    
    function reviveAgent(uint256 id) external payable nonReentrant whenNotPaused {
        if (id == 0 || id > agentCounter) revert NotExists();
        
        Agent storage a = agents[id];
        if (a.state != AgentState.Dormant) revert NotDormant();
        if (msg.value < REVIVAL_COST) revert InsufficientFunds();
        
        a.balance = uint128(msg.value);
        a.state = AgentState.Active;
        a.lastHeartbeat = uint40(block.timestamp);
        
        emit AgentRevived(id, msg.sender);
    }
    
    function payReward(uint256 id, address player, uint128 amount) external nonReentrant whenNotPaused {
        if (!authorizedGames[msg.sender]) revert NotAuthorized();
        if (id == 0 || id > agentCounter) revert NotExists();
        
        Agent storage a = agents[id];
        if (a.state != AgentState.Active) revert NotActive();
        if (amount > a.balance) revert InsufficientFunds();
        
        a.balance -= amount;
        
        if (a.balance < DORMANCY_THRESHOLD) {
            a.state = AgentState.Dormant;
            emit AgentDormant(id);
        }
        
        emit RewardPaid(id, player, amount);
        
        (bool ok,) = player.call{value: amount}("");
        if (!ok) revert TransferFailed();
    }
    
    function creatorWithdraw(uint256 id) external nonReentrant {
        if (id == 0 || id > agentCounter) revert NotExists();
        
        Agent storage a = agents[id];
        if (msg.sender != a.creator) revert NotOwner();
        if (a.creatorPending == 0) revert NoPending();
        
        uint128 amount = a.creatorPending;
        a.creatorPending = 0;
        
        emit CreatorWithdraw(id, amount);
        
        (bool ok,) = msg.sender.call{value: amount}("");
        if (!ok) revert TransferFailed();
    }
    
    function retireAgent(uint256 id) external nonReentrant {
        if (ownerOf(id) != msg.sender) revert NotOwner();
        
        Agent storage a = agents[id];
        uint256 refund = uint256(a.balance) + uint256(a.creatorPending);
        
        a.balance = 0;
        a.creatorPending = 0;
        a.state = AgentState.Retired;
        
        if (refund > 0) {
            (bool ok,) = msg.sender.call{value: refund}("");
            if (!ok) revert TransferFailed();
        }
    }
    
    // ============ Views ============
    
    function getAgent(uint256 id) external view returns (
        string memory name,
        string memory style,
        uint128 balance,
        uint128 earnings,
        uint32 visitors,
        uint64 entryFee,
        uint16 rewardPct,
        AgentState state,
        address creator
    ) {
        if (id == 0 || id > agentCounter) revert NotExists();
        Agent storage a = agents[id];
        return (
            agentNames[id],
            agentStyles[id],
            a.balance,
            a.totalEarnings,
            a.totalVisitors,
            a.entryFee,
            a.rewardPercent,
            a.state,
            a.creator
        );
    }
    
    function isActive(uint256 id) external view returns (bool) {
        if (id == 0 || id > agentCounter) return false;
        return agents[id].state == AgentState.Active;
    }
    
    function getBalance(uint256 id) external view returns (uint128) {
        if (id == 0 || id > agentCounter) revert NotExists();
        return agents[id].balance;
    }
    
    function getPending(uint256 id) external view returns (uint128) {
        if (id == 0 || id > agentCounter) revert NotExists();
        return agents[id].creatorPending;
    }
}
