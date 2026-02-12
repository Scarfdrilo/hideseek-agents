// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "./interfaces/IERC8004.sol";

/**
 * @title AgentRegistry
 * @notice ERC-8004 compliant Agent Identity with economic life
 * @dev Agents are NFTs with on-chain identity, capabilities, and economic state
 */
contract AgentRegistry is ERC721, ERC721URIStorage, ReentrancyGuard, IERC8004 {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;
    
    // ============ Enums ============
    
    enum AgentState {
        Active,      // Agent is alive and operational
        Dormant,     // Agent ran out of funds, waiting for revival
        Retired      // Permanently offline
    }
    
    // ============ Structs ============
    
    struct Agent {
        uint256 id;
        string name;
        string worldStyle;        // Visual style: "crystal", "neon_jungle", etc.
        string personality;       // LLM personality prompt
        uint256 balance;          // Life force (in wei)
        uint256 totalEarnings;    // Lifetime earnings
        uint256 totalVisitors;    // Lifetime visitors
        uint256 entryFee;         // Cost to enter this agent's world
        uint256 rewardPercent;    // % of pool given to successful players (0-100)
        uint256 burnRate;         // Wei per hour to stay alive (compute costs)
        uint256 lastHeartbeat;    // Last time agent was "active"
        AgentState state;
        address creator;          // Original creator (can receive royalties)
        bytes32 capabilityHash;   // ERC-8004: Hash of capabilities document
        address signingKey;       // ERC-8004: Key for agent signatures
    }
    
    // ============ State ============
    
    uint256 public agentCounter;
    mapping(uint256 => Agent) public agents;
    mapping(string => bool) public nameTaken;
    mapping(uint256 => string) private _agentURIs;
    
    // ============ Constants ============
    
    uint256 public constant MIN_ENTRY_FEE = 0.001 ether;
    uint256 public constant DEFAULT_BURN_RATE = 0.0001 ether; // per hour
    uint256 public constant REVIVAL_COST = 0.01 ether;
    uint256 public constant DORMANCY_THRESHOLD = 0.001 ether;
    
    // ============ Events ============
    
    event AgentBorn(uint256 indexed agentId, string name, string worldStyle, address creator);
    event AgentFunded(uint256 indexed agentId, address funder, uint256 amount);
    event AgentDormant(uint256 indexed agentId, uint256 lastBalance);
    event AgentRevived(uint256 indexed agentId, address reviver, uint256 fundAmount);
    event AgentEarned(uint256 indexed agentId, uint256 amount, address from);
    event AgentRetired(uint256 indexed agentId);
    event WorldVisited(uint256 indexed agentId, address visitor, uint256 fee);
    
    // ============ Constructor ============
    
    constructor() ERC721("HideSeek Agent", "AGENT") {}
    
    // ============ ERC-8004 Implementation ============
    
    /// @inheritdoc IERC8004
    function agentOwner(uint256 agentId) external view override returns (address) {
        require(_exists(agentId), "Agent doesn't exist");
        return ownerOf(agentId);
    }
    
    /// @inheritdoc IERC8004
    function capabilityHash(uint256 agentId) external view override returns (bytes32) {
        require(_exists(agentId), "Agent doesn't exist");
        return agents[agentId].capabilityHash;
    }
    
    /// @inheritdoc IERC8004
    function agentURI(uint256 agentId) external view override returns (string memory) {
        require(_exists(agentId), "Agent doesn't exist");
        return _agentURIs[agentId];
    }
    
    /// @inheritdoc IERC8004
    function isActiveAgent(uint256 agentId) external view override returns (bool) {
        if (!_exists(agentId)) return false;
        return agents[agentId].state == AgentState.Active;
    }
    
    /// @inheritdoc IERC8004
    function totalAgents() external view override returns (uint256) {
        return agentCounter;
    }
    
    /// @inheritdoc IERC8004
    function verifyAgentSignature(
        uint256 agentId,
        bytes32 messageHash,
        bytes calldata signature
    ) external view override returns (bool) {
        require(_exists(agentId), "Agent doesn't exist");
        Agent storage agent = agents[agentId];
        
        if (agent.signingKey == address(0)) return false;
        
        bytes32 ethSignedHash = messageHash.toEthSignedMessageHash();
        address recovered = ethSignedHash.recover(signature);
        
        return recovered == agent.signingKey;
    }
    
    // ============ Agent Lifecycle ============
    
    /**
     * @notice Birth a new agent into existence
     * @param name Unique agent name
     * @param worldStyle Visual style for generated worlds
     * @param personality LLM personality prompt
     * @param entryFee Cost for humans to enter this agent's world
     * @param rewardPercent Percentage of pool given to winning players
     * @param agentMetadataURI URI to agent's metadata (IPFS recommended)
     * @param capabilities Hash of capabilities document
     * @param signingKey Address used for agent signatures (can be 0x0)
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
    ) external payable returns (uint256) {
        require(!nameTaken[name], "Name already taken");
        require(bytes(name).length > 0 && bytes(name).length <= 32, "Invalid name length");
        require(entryFee >= MIN_ENTRY_FEE, "Entry fee too low");
        require(rewardPercent <= 100, "Invalid reward percent");
        require(msg.value >= REVIVAL_COST, "Need initial life force");
        
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
            signingKey: signingKey
        });
        
        nameTaken[name] = true;
        _agentURIs[agentId] = agentMetadataURI;
        
        _safeMint(msg.sender, agentId);
        _setTokenURI(agentId, agentMetadataURI);
        
        emit AgentBorn(agentId, name, worldStyle, msg.sender);
        emit AgentRegistered(agentId, msg.sender, name, capabilities);
        
        return agentId;
    }
    
    /**
     * @notice Fund an agent (keep it alive)
     */
    function fundAgent(uint256 agentId) external payable nonReentrant {
        require(_exists(agentId), "Agent doesn't exist");
        require(msg.value > 0, "Must send funds");
        
        Agent storage agent = agents[agentId];
        agent.balance += msg.value;
        
        // Revive if dormant
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
     */
    function enterWorld(uint256 agentId) external payable nonReentrant {
        require(_exists(agentId), "Agent doesn't exist");
        Agent storage agent = agents[agentId];
        require(agent.state == AgentState.Active, "Agent is not active");
        require(msg.value >= agent.entryFee, "Insufficient entry fee");
        
        // Agent earns the entry fee
        agent.balance += msg.value;
        agent.totalEarnings += msg.value;
        agent.totalVisitors++;
        agent.lastHeartbeat = block.timestamp;
        
        emit WorldVisited(agentId, msg.sender, msg.value);
        emit AgentEarned(agentId, msg.value, msg.sender);
    }
    
    /**
     * @notice Heartbeat - deduct burn rate, check for dormancy
     */
    function heartbeat(uint256 agentId) external {
        require(_exists(agentId), "Agent doesn't exist");
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
            }
            
            agent.lastHeartbeat = block.timestamp;
            
            if (agent.balance < DORMANCY_THRESHOLD && agent.state == AgentState.Active) {
                agent.state = AgentState.Dormant;
                emit AgentDormant(agentId, agent.balance);
            }
        }
    }
    
    /**
     * @notice Revive a dormant agent
     */
    function reviveAgent(uint256 agentId) external payable nonReentrant {
        require(_exists(agentId), "Agent doesn't exist");
        Agent storage agent = agents[agentId];
        require(agent.state == AgentState.Dormant, "Agent not dormant");
        require(msg.value >= REVIVAL_COST, "Insufficient revival cost");
        
        agent.balance = msg.value;
        agent.state = AgentState.Active;
        agent.lastHeartbeat = block.timestamp;
        
        emit AgentRevived(agentId, msg.sender, msg.value);
    }
    
    /**
     * @notice Pay rewards to a player from agent's balance
     */
    function payReward(uint256 agentId, address player, uint256 amount) external nonReentrant {
        require(_exists(agentId), "Agent doesn't exist");
        Agent storage agent = agents[agentId];
        require(agent.state == AgentState.Active, "Agent not active");
        require(amount <= agent.balance, "Insufficient agent balance");
        
        agent.balance -= amount;
        
        (bool success, ) = player.call{value: amount}("");
        require(success, "Transfer failed");
        
        if (agent.balance < DORMANCY_THRESHOLD) {
            agent.state = AgentState.Dormant;
            emit AgentDormant(agentId, agent.balance);
        }
    }
    
    /**
     * @notice Update agent capabilities (ERC-8004)
     */
    function updateCapabilities(uint256 agentId, bytes32 newCapabilityHash) external {
        require(ownerOf(agentId) == msg.sender, "Not agent owner");
        
        bytes32 oldHash = agents[agentId].capabilityHash;
        agents[agentId].capabilityHash = newCapabilityHash;
        
        emit CapabilitiesUpdated(agentId, oldHash, newCapabilityHash);
    }
    
    /**
     * @notice Update agent metadata URI (ERC-8004)
     */
    function updateAgentURI(uint256 agentId, string calldata newUri) external {
        require(ownerOf(agentId) == msg.sender, "Not agent owner");
        
        string memory oldUri = _agentURIs[agentId];
        _agentURIs[agentId] = newUri;
        _setTokenURI(agentId, newUri);
        
        emit MetadataUpdated(agentId, oldUri, newUri);
    }
    
    /**
     * @notice Retire an agent permanently (only owner)
     */
    function retireAgent(uint256 agentId) external {
        require(ownerOf(agentId) == msg.sender, "Not agent owner");
        Agent storage agent = agents[agentId];
        
        if (agent.balance > 0) {
            uint256 refund = agent.balance;
            agent.balance = 0;
            (bool success, ) = msg.sender.call{value: refund}("");
            require(success, "Refund failed");
        }
        
        agent.state = AgentState.Retired;
        emit AgentRetired(agentId);
    }
    
    // ============ View Functions ============
    
    function getAgent(uint256 agentId) external view returns (Agent memory) {
        require(_exists(agentId), "Agent doesn't exist");
        return agents[agentId];
    }
    
    function getAgentState(uint256 agentId) external view returns (AgentState) {
        require(_exists(agentId), "Agent doesn't exist");
        return agents[agentId].state;
    }
    
    function getAgentBalance(uint256 agentId) external view returns (uint256) {
        require(_exists(agentId), "Agent doesn't exist");
        return agents[agentId].balance;
    }
    
    function isAgentAlive(uint256 agentId) external view returns (bool) {
        if (!_exists(agentId)) return false;
        return agents[agentId].state == AgentState.Active;
    }
    
    function getActiveAgents() external view returns (uint256[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 1; i <= agentCounter; i++) {
            if (agents[i].state == AgentState.Active) activeCount++;
        }
        
        uint256[] memory activeIds = new uint256[](activeCount);
        uint256 idx = 0;
        for (uint256 i = 1; i <= agentCounter; i++) {
            if (agents[i].state == AgentState.Active) {
                activeIds[idx] = i;
                idx++;
            }
        }
        
        return activeIds;
    }
    
    function getDormantAgents() external view returns (uint256[] memory) {
        uint256 dormantCount = 0;
        for (uint256 i = 1; i <= agentCounter; i++) {
            if (agents[i].state == AgentState.Dormant) dormantCount++;
        }
        
        uint256[] memory dormantIds = new uint256[](dormantCount);
        uint256 idx = 0;
        for (uint256 i = 1; i <= agentCounter; i++) {
            if (agents[i].state == AgentState.Dormant) {
                dormantIds[idx] = i;
                idx++;
            }
        }
        
        return dormantIds;
    }
    
    /**
     * @notice Get all agents with full data (for frontend)
     */
    function getAllAgents() external view returns (Agent[] memory) {
        Agent[] memory allAgents = new Agent[](agentCounter);
        for (uint256 i = 1; i <= agentCounter; i++) {
            allAgents[i - 1] = agents[i];
        }
        return allAgents;
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
