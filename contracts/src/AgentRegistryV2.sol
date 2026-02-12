// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/IERC8004.sol";

/**
 * @title AgentRegistryV2
 * @notice Security-hardened ERC-8004 Agent Identity with x402 payment support
 * @dev Fixes: access control, reentrancy, pause, creator withdrawals, x402
 * 
 * SECURITY IMPROVEMENTS:
 * - CEI pattern (Checks-Effects-Interactions)
 * - Access control on payReward (only authorized callers)
 * - Pausable for emergencies
 * - Pull pattern for creator withdrawals
 * - Rate limiting on sensitive operations
 * - Input validation
 * - Event logging for all state changes
 */
contract AgentRegistryV2 is ERC721, ERC721URIStorage, ReentrancyGuard, Ownable, Pausable, IERC8004 {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;
    
    // ============ Enums ============
    
    enum AgentState {
        Active,
        Dormant,
        Retired
    }
    
    // ============ Structs ============
    
    struct Agent {
        uint256 id;
        string name;
        string worldStyle;
        string personality;
        uint256 balance;
        uint256 totalEarnings;
        uint256 totalVisitors;
        uint256 entryFee;
        uint256 rewardPercent;
        uint256 burnRate;
        uint256 lastHeartbeat;
        AgentState state;
        address creator;
        bytes32 capabilityHash;
        address signingKey;
        uint256 creatorPendingWithdrawal; // NEW: Creator earnings to withdraw
    }
    
    // ============ State ============
    
    uint256 public agentCounter;
    mapping(uint256 => Agent) public agents;
    mapping(string => bool) public nameTaken;
    mapping(uint256 => string) private _agentURIs;
    
    // Security: Authorized game contracts that can pay rewards
    mapping(address => bool) public authorizedGameContracts;
    
    // x402: Payment receipts for HTTP 402 protocol
    mapping(bytes32 => bool) public usedPaymentReceipts;
    mapping(uint256 => uint256) public agentX402Nonce;
    
    // Rate limiting
    mapping(address => uint256) public lastActionTime;
    uint256 public constant ACTION_COOLDOWN = 1 seconds;
    
    // ============ Constants ============
    
    uint256 public constant MIN_ENTRY_FEE = 0.001 ether;
    uint256 public constant MAX_ENTRY_FEE = 1 ether;
    uint256 public constant DEFAULT_BURN_RATE = 0.0001 ether;
    uint256 public constant REVIVAL_COST = 0.01 ether;
    uint256 public constant DORMANCY_THRESHOLD = 0.001 ether;
    uint256 public constant CREATOR_FEE_PERCENT = 10; // 10% to creator
    uint256 public constant MAX_NAME_LENGTH = 32;
    uint256 public constant MAX_PERSONALITY_LENGTH = 1000;
    
    // ============ Events ============
    
    event AgentBorn(uint256 indexed agentId, string name, string worldStyle, address indexed creator);
    event AgentFunded(uint256 indexed agentId, address indexed funder, uint256 amount);
    event AgentDormant(uint256 indexed agentId, uint256 lastBalance);
    event AgentRevived(uint256 indexed agentId, address indexed reviver, uint256 fundAmount);
    event AgentEarned(uint256 indexed agentId, uint256 amount, address indexed from);
    event AgentRetired(uint256 indexed agentId);
    event WorldVisited(uint256 indexed agentId, address indexed visitor, uint256 fee);
    event RewardPaid(uint256 indexed agentId, address indexed player, uint256 amount);
    event CreatorWithdrawal(uint256 indexed agentId, address indexed creator, uint256 amount);
    event GameContractAuthorized(address indexed gameContract, bool authorized);
    event X402PaymentProcessed(uint256 indexed agentId, bytes32 indexed receiptHash, uint256 amount);
    
    // ============ Modifiers ============
    
    modifier onlyAuthorizedGame() {
        require(authorizedGameContracts[msg.sender], "Not authorized game contract");
        _;
    }
    
    modifier rateLimited() {
        require(block.timestamp >= lastActionTime[msg.sender] + ACTION_COOLDOWN, "Rate limited");
        lastActionTime[msg.sender] = block.timestamp;
        _;
    }
    
    modifier validAgent(uint256 agentId) {
        require(_exists(agentId), "Agent doesn't exist");
        _;
    }
    
    // ============ Constructor ============
    
    constructor() ERC721("HideSeek Agent", "AGENT") Ownable(msg.sender) {}
    
    // ============ Admin Functions ============
    
    /**
     * @notice Authorize a game contract to pay rewards
     * @dev Only owner can authorize
     */
    function setGameContractAuthorization(address gameContract, bool authorized) external onlyOwner {
        require(gameContract != address(0), "Invalid address");
        authorizedGameContracts[gameContract] = authorized;
        emit GameContractAuthorized(gameContract, authorized);
    }
    
    /**
     * @notice Pause contract in emergency
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // ============ ERC-8004 Implementation ============
    
    function agentOwner(uint256 agentId) external view override validAgent(agentId) returns (address) {
        return ownerOf(agentId);
    }
    
    function capabilityHash(uint256 agentId) external view override validAgent(agentId) returns (bytes32) {
        return agents[agentId].capabilityHash;
    }
    
    function agentURI(uint256 agentId) external view override validAgent(agentId) returns (string memory) {
        return _agentURIs[agentId];
    }
    
    function isActiveAgent(uint256 agentId) external view override returns (bool) {
        if (!_exists(agentId)) return false;
        return agents[agentId].state == AgentState.Active;
    }
    
    function totalAgents() external view override returns (uint256) {
        return agentCounter;
    }
    
    function verifyAgentSignature(
        uint256 agentId,
        bytes32 messageHash,
        bytes calldata signature
    ) external view override validAgent(agentId) returns (bool) {
        Agent storage agent = agents[agentId];
        if (agent.signingKey == address(0)) return false;
        
        bytes32 ethSignedHash = messageHash.toEthSignedMessageHash();
        address recovered = ethSignedHash.recover(signature);
        
        return recovered == agent.signingKey;
    }
    
    // ============ Agent Lifecycle ============
    
    /**
     * @notice Birth a new agent
     * @dev Validates all inputs, CEI pattern
     */
    function birthAgent(
        string calldata name,
        string calldata worldStyle,
        string calldata personality,
        uint256 entryFee,
        uint256 rewardPercent,
        string calldata agentMetadataURI,
        bytes32 capabilities,
        address signingKey
    ) external payable whenNotPaused rateLimited returns (uint256) {
        // CHECKS
        require(!nameTaken[name], "Name already taken");
        require(bytes(name).length > 0 && bytes(name).length <= MAX_NAME_LENGTH, "Invalid name length");
        require(bytes(personality).length <= MAX_PERSONALITY_LENGTH, "Personality too long");
        require(entryFee >= MIN_ENTRY_FEE && entryFee <= MAX_ENTRY_FEE, "Invalid entry fee");
        require(rewardPercent <= 100, "Invalid reward percent");
        require(msg.value >= REVIVAL_COST, "Need initial life force");
        
        // EFFECTS
        agentCounter++;
        uint256 agentId = agentCounter;
        
        agents[agentId] = Agent({
            id: agentId,
            name: name,
            worldStyle: worldStyle,
            personality: personality,
            balance: msg.value,
            totalEarnings: 0,
            totalVisitors: 0,
            entryFee: entryFee,
            rewardPercent: rewardPercent,
            burnRate: DEFAULT_BURN_RATE,
            lastHeartbeat: block.timestamp,
            state: AgentState.Active,
            creator: msg.sender,
            capabilityHash: capabilities,
            signingKey: signingKey,
            creatorPendingWithdrawal: 0
        });
        
        nameTaken[name] = true;
        _agentURIs[agentId] = agentMetadataURI;
        
        // INTERACTIONS
        _safeMint(msg.sender, agentId);
        _setTokenURI(agentId, agentMetadataURI);
        
        emit AgentBorn(agentId, name, worldStyle, msg.sender);
        emit AgentRegistered(agentId, msg.sender, name, capabilities);
        
        return agentId;
    }
    
    /**
     * @notice Fund an agent (keep it alive)
     */
    function fundAgent(uint256 agentId) external payable nonReentrant whenNotPaused validAgent(agentId) {
        require(msg.value > 0, "Must send funds");
        
        Agent storage agent = agents[agentId];
        
        // EFFECTS first (CEI pattern)
        agent.balance += msg.value;
        
        if (agent.state == AgentState.Dormant && agent.balance >= DORMANCY_THRESHOLD) {
            agent.state = AgentState.Active;
            agent.lastHeartbeat = block.timestamp;
            emit AgentRevived(agentId, msg.sender, msg.value);
        } else {
            emit AgentFunded(agentId, msg.sender, msg.value);
        }
    }
    
    /**
     * @notice Enter an agent's world (pay entry fee)
     * @dev Creator gets 10% fee, rest goes to agent balance
     */
    function enterWorld(uint256 agentId) external payable nonReentrant whenNotPaused validAgent(agentId) rateLimited {
        Agent storage agent = agents[agentId];
        
        // CHECKS
        require(agent.state == AgentState.Active, "Agent is not active");
        require(msg.value >= agent.entryFee, "Insufficient entry fee");
        
        // EFFECTS
        uint256 creatorFee = (msg.value * CREATOR_FEE_PERCENT) / 100;
        uint256 agentShare = msg.value - creatorFee;
        
        agent.balance += agentShare;
        agent.totalEarnings += msg.value;
        agent.totalVisitors++;
        agent.lastHeartbeat = block.timestamp;
        agent.creatorPendingWithdrawal += creatorFee;
        
        emit WorldVisited(agentId, msg.sender, msg.value);
        emit AgentEarned(agentId, agentShare, msg.sender);
    }
    
    /**
     * @notice Heartbeat - deduct burn rate
     * @dev Anyone can call to update agent state
     */
    function heartbeat(uint256 agentId) external validAgent(agentId) {
        Agent storage agent = agents[agentId];
        
        if (agent.state != AgentState.Active) return;
        
        uint256 elapsed = block.timestamp - agent.lastHeartbeat;
        uint256 hoursElapsed = elapsed / 1 hours;
        
        if (hoursElapsed > 0) {
            uint256 burnAmount = hoursElapsed * agent.burnRate;
            
            if (burnAmount >= agent.balance) {
                agent.balance = 0;
                agent.state = AgentState.Dormant;
                emit AgentDormant(agentId, 0);
            } else {
                agent.balance -= burnAmount;
                
                if (agent.balance < DORMANCY_THRESHOLD) {
                    agent.state = AgentState.Dormant;
                    emit AgentDormant(agentId, agent.balance);
                }
            }
            
            agent.lastHeartbeat = block.timestamp;
        }
    }
    
    /**
     * @notice Revive a dormant agent
     */
    function reviveAgent(uint256 agentId) external payable nonReentrant whenNotPaused validAgent(agentId) {
        Agent storage agent = agents[agentId];
        
        require(agent.state == AgentState.Dormant, "Agent not dormant");
        require(msg.value >= REVIVAL_COST, "Insufficient revival cost");
        
        // EFFECTS first
        agent.balance = msg.value;
        agent.state = AgentState.Active;
        agent.lastHeartbeat = block.timestamp;
        
        emit AgentRevived(agentId, msg.sender, msg.value);
    }
    
    /**
     * @notice Pay rewards to a player (ONLY authorized game contracts)
     * @dev Fixed: Now requires authorization
     */
    function payReward(uint256 agentId, address player, uint256 amount) 
        external 
        nonReentrant 
        whenNotPaused 
        onlyAuthorizedGame 
        validAgent(agentId) 
    {
        require(player != address(0), "Invalid player address");
        
        Agent storage agent = agents[agentId];
        
        require(agent.state == AgentState.Active, "Agent not active");
        require(amount <= agent.balance, "Insufficient agent balance");
        require(amount > 0, "Amount must be positive");
        
        // EFFECTS first (CEI)
        agent.balance -= amount;
        
        if (agent.balance < DORMANCY_THRESHOLD) {
            agent.state = AgentState.Dormant;
            emit AgentDormant(agentId, agent.balance);
        }
        
        emit RewardPaid(agentId, player, amount);
        
        // INTERACTIONS last
        (bool success, ) = player.call{value: amount}("");
        require(success, "Transfer failed");
    }
    
    /**
     * @notice Creator withdraws pending earnings (pull pattern)
     * @dev Safer than push pattern - creator calls when ready
     */
    function creatorWithdraw(uint256 agentId) external nonReentrant validAgent(agentId) {
        Agent storage agent = agents[agentId];
        
        require(msg.sender == agent.creator, "Not creator");
        require(agent.creatorPendingWithdrawal > 0, "No pending withdrawal");
        
        // EFFECTS first
        uint256 amount = agent.creatorPendingWithdrawal;
        agent.creatorPendingWithdrawal = 0;
        
        emit CreatorWithdrawal(agentId, msg.sender, amount);
        
        // INTERACTIONS last
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Withdrawal failed");
    }
    
    /**
     * @notice Retire an agent permanently (CEI pattern fix)
     */
    function retireAgent(uint256 agentId) external nonReentrant validAgent(agentId) {
        require(ownerOf(agentId) == msg.sender, "Not agent owner");
        
        Agent storage agent = agents[agentId];
        
        // EFFECTS first
        uint256 refund = agent.balance + agent.creatorPendingWithdrawal;
        agent.balance = 0;
        agent.creatorPendingWithdrawal = 0;
        agent.state = AgentState.Retired;
        
        emit AgentRetired(agentId);
        
        // INTERACTIONS last
        if (refund > 0) {
            (bool success, ) = msg.sender.call{value: refund}("");
            require(success, "Refund failed");
        }
    }
    
    // ============ x402 Payment Protocol ============
    
    /**
     * @notice Process x402 HTTP payment
     * @dev Verifies payment receipt signed by agent's signing key
     * @param agentId Agent receiving payment
     * @param amount Payment amount
     * @param nonce Replay protection
     * @param signature Agent's signature over payment details
     */
    function processX402Payment(
        uint256 agentId,
        uint256 amount,
        uint256 nonce,
        bytes calldata signature
    ) external payable nonReentrant whenNotPaused validAgent(agentId) {
        Agent storage agent = agents[agentId];
        
        require(agent.state == AgentState.Active, "Agent not active");
        require(msg.value >= amount, "Insufficient payment");
        require(nonce == agentX402Nonce[agentId], "Invalid nonce");
        require(agent.signingKey != address(0), "Agent has no signing key");
        
        // Create receipt hash
        bytes32 receiptHash = keccak256(abi.encodePacked(
            agentId,
            msg.sender,
            amount,
            nonce,
            block.chainid
        ));
        
        require(!usedPaymentReceipts[receiptHash], "Receipt already used");
        
        // Verify agent signature
        bytes32 ethSignedHash = receiptHash.toEthSignedMessageHash();
        address recovered = ethSignedHash.recover(signature);
        require(recovered == agent.signingKey, "Invalid signature");
        
        // EFFECTS
        usedPaymentReceipts[receiptHash] = true;
        agentX402Nonce[agentId]++;
        
        uint256 creatorFee = (msg.value * CREATOR_FEE_PERCENT) / 100;
        uint256 agentShare = msg.value - creatorFee;
        
        agent.balance += agentShare;
        agent.totalEarnings += msg.value;
        agent.creatorPendingWithdrawal += creatorFee;
        
        emit X402PaymentProcessed(agentId, receiptHash, msg.value);
    }
    
    /**
     * @notice Get x402 payment parameters for HTTP 402 response
     */
    function getX402PaymentParams(uint256 agentId) external view validAgent(agentId) returns (
        address paymentAddress,
        uint256 minAmount,
        uint256 nonce,
        uint256 chainId
    ) {
        Agent storage agent = agents[agentId];
        return (
            address(this),
            agent.entryFee,
            agentX402Nonce[agentId],
            block.chainid
        );
    }
    
    // ============ Update Functions ============
    
    function updateCapabilities(uint256 agentId, bytes32 newCapabilityHash) external validAgent(agentId) {
        require(ownerOf(agentId) == msg.sender, "Not agent owner");
        
        bytes32 oldHash = agents[agentId].capabilityHash;
        agents[agentId].capabilityHash = newCapabilityHash;
        
        emit CapabilitiesUpdated(agentId, oldHash, newCapabilityHash);
    }
    
    function updateAgentURI(uint256 agentId, string calldata newUri) external validAgent(agentId) {
        require(ownerOf(agentId) == msg.sender, "Not agent owner");
        
        string memory oldUri = _agentURIs[agentId];
        _agentURIs[agentId] = newUri;
        _setTokenURI(agentId, newUri);
        
        emit MetadataUpdated(agentId, oldUri, newUri);
    }
    
    function updateSigningKey(uint256 agentId, address newSigningKey) external validAgent(agentId) {
        require(ownerOf(agentId) == msg.sender, "Not agent owner");
        agents[agentId].signingKey = newSigningKey;
    }
    
    function updateEntryFee(uint256 agentId, uint256 newFee) external validAgent(agentId) {
        require(ownerOf(agentId) == msg.sender, "Not agent owner");
        require(newFee >= MIN_ENTRY_FEE && newFee <= MAX_ENTRY_FEE, "Invalid fee");
        agents[agentId].entryFee = newFee;
    }
    
    // ============ View Functions ============
    
    function getAgent(uint256 agentId) external view validAgent(agentId) returns (Agent memory) {
        return agents[agentId];
    }
    
    function getAgentState(uint256 agentId) external view validAgent(agentId) returns (AgentState) {
        return agents[agentId].state;
    }
    
    function getAgentBalance(uint256 agentId) external view validAgent(agentId) returns (uint256) {
        return agents[agentId].balance;
    }
    
    function isAgentAlive(uint256 agentId) external view returns (bool) {
        if (!_exists(agentId)) return false;
        return agents[agentId].state == AgentState.Active;
    }
    
    function getCreatorPendingWithdrawal(uint256 agentId) external view validAgent(agentId) returns (uint256) {
        return agents[agentId].creatorPendingWithdrawal;
    }
    
    /**
     * @notice Get agents with pagination (gas-safe)
     */
    function getAgentsPaginated(uint256 offset, uint256 limit) external view returns (Agent[] memory) {
        require(limit <= 100, "Limit too high");
        
        uint256 end = offset + limit;
        if (end > agentCounter) end = agentCounter;
        if (offset >= agentCounter) return new Agent[](0);
        
        uint256 count = end - offset;
        Agent[] memory result = new Agent[](count);
        
        for (uint256 i = 0; i < count; i++) {
            result[i] = agents[offset + i + 1];
        }
        
        return result;
    }
    
    // ============ Required Overrides ============
    
    function _exists(uint256 tokenId) internal view returns (bool) {
        return tokenId > 0 && tokenId <= agentCounter;
    }
    
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return 
            interfaceId == type(IERC8004).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
