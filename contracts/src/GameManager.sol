// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./BettingPool.sol";
import "./RewardDistributor.sol";

/**
 * @title GameManager
 * @notice Core game logic coordinator for HideSeek Agents
 */
contract GameManager {
    enum GamePhase {
        Waiting,
        Hiding,
        Seeking,
        Finished
    }

    struct Match {
        uint256 id;
        uint256 worldSeed;
        address[] players;
        address[] aiAgents;
        GamePhase phase;
        uint256 startTime;
        uint256 hidePhaseEnd;
        uint256 seekPhaseEnd;
        mapping(address => bytes32) hideCommitments; // hash of hide position
        mapping(address => uint256) discoveryTimes;
        bool resolved;
    }

    BettingPool public bettingPool;
    RewardDistributor public rewardDistributor;
    
    uint256 public matchCounter;
    mapping(uint256 => Match) public matches;
    mapping(address => bool) public registeredAgents;
    
    uint256 public constant HIDE_PHASE_DURATION = 60; // 60 seconds
    uint256 public constant SEEK_PHASE_DURATION = 300; // 5 minutes
    
    address public platformWallet;
    uint256 public platformFeePercent = 5; // 5%
    
    event MatchCreated(uint256 indexed matchId, uint256 worldSeed);
    event PhaseChanged(uint256 indexed matchId, GamePhase newPhase);
    event HideCommitted(uint256 indexed matchId, address indexed hider, bytes32 commitment);
    event ObjectDiscovered(uint256 indexed matchId, address indexed seeker, address indexed hider, uint256 time);
    event MatchResolved(uint256 indexed matchId, address[] winners);
    
    constructor(address _bettingPool, address _rewardDistributor, address _platformWallet) {
        bettingPool = BettingPool(_bettingPool);
        rewardDistributor = RewardDistributor(_rewardDistributor);
        platformWallet = _platformWallet;
    }
    
    /**
     * @notice Register an AI agent to participate
     */
    function registerAgent(address agent) external {
        registeredAgents[agent] = true;
    }
    
    /**
     * @notice Create a new match
     */
    function createMatch(
        uint256 worldSeed,
        address[] calldata players,
        address[] calldata aiAgents
    ) external returns (uint256) {
        require(players.length > 0 || aiAgents.length > 0, "Need participants");
        
        matchCounter++;
        uint256 matchId = matchCounter;
        
        Match storage m = matches[matchId];
        m.id = matchId;
        m.worldSeed = worldSeed;
        m.players = players;
        m.aiAgents = aiAgents;
        m.phase = GamePhase.Waiting;
        
        emit MatchCreated(matchId, worldSeed);
        
        return matchId;
    }
    
    /**
     * @notice Start a match (move to hiding phase)
     */
    function startMatch(uint256 matchId) external {
        Match storage m = matches[matchId];
        require(m.phase == GamePhase.Waiting, "Match already started");
        
        m.phase = GamePhase.Hiding;
        m.startTime = block.timestamp;
        m.hidePhaseEnd = block.timestamp + HIDE_PHASE_DURATION;
        
        emit PhaseChanged(matchId, GamePhase.Hiding);
    }
    
    /**
     * @notice Commit a hide position (hash to prevent cheating)
     */
    function commitHide(uint256 matchId, bytes32 commitment) external {
        Match storage m = matches[matchId];
        require(m.phase == GamePhase.Hiding, "Not in hiding phase");
        require(block.timestamp < m.hidePhaseEnd, "Hiding phase ended");
        
        m.hideCommitments[msg.sender] = commitment;
        
        emit HideCommitted(matchId, msg.sender, commitment);
    }
    
    /**
     * @notice Transition to seeking phase
     */
    function startSeekPhase(uint256 matchId) external {
        Match storage m = matches[matchId];
        require(m.phase == GamePhase.Hiding, "Not in hiding phase");
        require(block.timestamp >= m.hidePhaseEnd, "Hide phase not finished");
        
        m.phase = GamePhase.Seeking;
        m.seekPhaseEnd = block.timestamp + SEEK_PHASE_DURATION;
        
        emit PhaseChanged(matchId, GamePhase.Seeking);
    }
    
    /**
     * @notice Report a discovery
     */
    function reportDiscovery(
        uint256 matchId,
        address hider,
        uint256 x,
        uint256 y,
        uint256 z,
        bytes32 salt
    ) external {
        Match storage m = matches[matchId];
        require(m.phase == GamePhase.Seeking, "Not in seeking phase");
        require(block.timestamp < m.seekPhaseEnd, "Seek phase ended");
        
        // Verify commitment
        bytes32 commitment = keccak256(abi.encodePacked(x, y, z, salt));
        require(m.hideCommitments[hider] == commitment, "Invalid position");
        
        // Record discovery time
        uint256 discoveryTime = block.timestamp - m.startTime;
        m.discoveryTimes[hider] = discoveryTime;
        
        emit ObjectDiscovered(matchId, msg.sender, hider, discoveryTime);
    }
    
    /**
     * @notice Resolve match and distribute rewards
     */
    function resolveMatch(uint256 matchId) external {
        Match storage m = matches[matchId];
        require(m.phase == GamePhase.Seeking, "Not finished seeking");
        require(block.timestamp >= m.seekPhaseEnd, "Seek phase not finished");
        require(!m.resolved, "Already resolved");
        
        m.phase = GamePhase.Finished;
        m.resolved = true;
        
        // Calculate rewards based on Pareto distribution
        address[] memory allHiders = new address[](m.players.length + m.aiAgents.length);
        uint256[] memory times = new uint256[](allHiders.length);
        
        uint256 idx = 0;
        for (uint256 i = 0; i < m.players.length; i++) {
            allHiders[idx] = m.players[i];
            times[idx] = m.discoveryTimes[m.players[i]];
            idx++;
        }
        for (uint256 i = 0; i < m.aiAgents.length; i++) {
            allHiders[idx] = m.aiAgents[i];
            times[idx] = m.discoveryTimes[m.aiAgents[i]];
            idx++;
        }
        
        // Trigger reward distribution
        rewardDistributor.distribute(matchId, allHiders, times, platformWallet, platformFeePercent);
        
        emit MatchResolved(matchId, allHiders);
    }
    
    /**
     * @notice Get match details
     */
    function getMatch(uint256 matchId) external view returns (
        uint256 id,
        uint256 worldSeed,
        GamePhase phase,
        uint256 startTime,
        bool resolved
    ) {
        Match storage m = matches[matchId];
        return (m.id, m.worldSeed, m.phase, m.startTime, m.resolved);
    }
}
