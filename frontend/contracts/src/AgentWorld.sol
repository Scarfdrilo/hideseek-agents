// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./AgentRegistry.sol";

/**
 * @title AgentWorld
 * @notice Manages gameplay within agent-owned worlds
 * @dev Players enter worlds, complete challenges, and earn rewards
 */
contract AgentWorld is ReentrancyGuard {
    
    AgentRegistry public agentRegistry;
    
    struct Challenge {
        uint256 id;
        uint256 agentId;
        uint256 rewardPool;
        uint256 maxPlayers;
        uint256 playerCount;
        uint256 startTime;
        uint256 duration;
        bool active;
        bool resolved;
    }
    
    struct PlayerSession {
        address player;
        uint256 agentId;
        uint256 challengeId;
        uint256 entryTime;
        uint256 score;
        bool rewarded;
    }
    
    uint256 public challengeCounter;
    mapping(uint256 => Challenge) public challenges;
    mapping(uint256 => mapping(address => PlayerSession)) public sessions; // challengeId => player => session
    mapping(uint256 => address[]) public challengePlayers; // challengeId => players
    mapping(address => uint256[]) public playerHistory; // player => challengeIds
    
    // Leaderboard
    mapping(uint256 => mapping(address => uint256)) public agentLeaderboard; // agentId => player => totalEarnings
    mapping(uint256 => address[]) public agentTopPlayers; // agentId => top players
    
    event ChallengeCreated(uint256 indexed challengeId, uint256 indexed agentId, uint256 rewardPool);
    event PlayerJoined(uint256 indexed challengeId, uint256 indexed agentId, address player);
    event ScoreSubmitted(uint256 indexed challengeId, address player, uint256 score);
    event RewardPaid(uint256 indexed challengeId, address player, uint256 amount);
    event ChallengeResolved(uint256 indexed challengeId, address winner, uint256 prize);
    
    constructor(address _agentRegistry) {
        agentRegistry = AgentRegistry(_agentRegistry);
    }
    
    /**
     * @notice Create a challenge in an agent's world
     */
    function createChallenge(
        uint256 agentId,
        uint256 maxPlayers,
        uint256 duration
    ) external payable returns (uint256) {
        require(agentRegistry.isAgentAlive(agentId), "Agent not active");
        require(msg.value > 0, "Need reward pool");
        require(maxPlayers > 0, "Need players");
        
        challengeCounter++;
        uint256 challengeId = challengeCounter;
        
        challenges[challengeId] = Challenge({
            id: challengeId,
            agentId: agentId,
            rewardPool: msg.value,
            maxPlayers: maxPlayers,
            playerCount: 0,
            startTime: block.timestamp,
            duration: duration,
            active: true,
            resolved: false
        });
        
        emit ChallengeCreated(challengeId, agentId, msg.value);
        
        return challengeId;
    }
    
    /**
     * @notice Join a challenge (pays entry fee to agent)
     */
    function joinChallenge(uint256 challengeId) external payable nonReentrant {
        Challenge storage challenge = challenges[challengeId];
        require(challenge.active, "Challenge not active");
        require(challenge.playerCount < challenge.maxPlayers, "Challenge full");
        require(sessions[challengeId][msg.sender].player == address(0), "Already joined");
        
        uint256 agentId = challenge.agentId;
        AgentRegistry.Agent memory agent = agentRegistry.getAgent(agentId);
        require(msg.value >= agent.entryFee, "Insufficient entry fee");
        
        // Pay entry fee to agent
        agentRegistry.enterWorld{value: msg.value}(agentId);
        
        // Create session
        sessions[challengeId][msg.sender] = PlayerSession({
            player: msg.sender,
            agentId: agentId,
            challengeId: challengeId,
            entryTime: block.timestamp,
            score: 0,
            rewarded: false
        });
        
        challengePlayers[challengeId].push(msg.sender);
        playerHistory[msg.sender].push(challengeId);
        challenge.playerCount++;
        
        emit PlayerJoined(challengeId, agentId, msg.sender);
    }
    
    /**
     * @notice Submit score for a challenge (called by game backend/oracle)
     */
    function submitScore(uint256 challengeId, address player, uint256 score) external {
        // TODO: Add oracle/verifier role
        Challenge storage challenge = challenges[challengeId];
        require(challenge.active, "Challenge not active");
        require(sessions[challengeId][player].player != address(0), "Player not in challenge");
        
        sessions[challengeId][player].score = score;
        
        emit ScoreSubmitted(challengeId, player, score);
    }
    
    /**
     * @notice Resolve challenge and distribute rewards
     */
    function resolveChallenge(uint256 challengeId) external nonReentrant {
        Challenge storage challenge = challenges[challengeId];
        require(challenge.active, "Challenge not active");
        require(!challenge.resolved, "Already resolved");
        require(
            block.timestamp >= challenge.startTime + challenge.duration,
            "Challenge still running"
        );
        
        challenge.active = false;
        challenge.resolved = true;
        
        // Find winner (highest score)
        address winner = address(0);
        uint256 highestScore = 0;
        
        for (uint256 i = 0; i < challengePlayers[challengeId].length; i++) {
            address player = challengePlayers[challengeId][i];
            uint256 score = sessions[challengeId][player].score;
            if (score > highestScore) {
                highestScore = score;
                winner = player;
            }
        }
        
        if (winner != address(0) && challenge.rewardPool > 0) {
            // Get agent's reward percent
            AgentRegistry.Agent memory agent = agentRegistry.getAgent(challenge.agentId);
            uint256 playerReward = (challenge.rewardPool * agent.rewardPercent) / 100;
            uint256 agentKeeps = challenge.rewardPool - playerReward;
            
            // Pay winner
            if (playerReward > 0) {
                sessions[challengeId][winner].rewarded = true;
                (bool success, ) = winner.call{value: playerReward}("");
                require(success, "Reward transfer failed");
                
                // Update leaderboard
                agentLeaderboard[challenge.agentId][winner] += playerReward;
                
                emit RewardPaid(challengeId, winner, playerReward);
            }
            
            // Agent keeps the rest (already in agent balance from entry fees + this portion)
            if (agentKeeps > 0) {
                agentRegistry.fundAgent{value: agentKeeps}(challenge.agentId);
            }
            
            emit ChallengeResolved(challengeId, winner, playerReward);
        }
    }
    
    /**
     * @notice Quick play - enter world, instant challenge
     */
    function quickPlay(uint256 agentId) external payable nonReentrant {
        require(agentRegistry.isAgentAlive(agentId), "Agent not active");
        
        AgentRegistry.Agent memory agent = agentRegistry.getAgent(agentId);
        require(msg.value >= agent.entryFee, "Insufficient entry fee");
        
        // Pay entry fee to agent
        agentRegistry.enterWorld{value: msg.value}(agentId);
        
        // Emit event for backend to generate instant challenge
        emit PlayerJoined(0, agentId, msg.sender);
    }
    
    // ============ View Functions ============
    
    function getChallenge(uint256 challengeId) external view returns (Challenge memory) {
        return challenges[challengeId];
    }
    
    function getPlayerSession(uint256 challengeId, address player) external view returns (PlayerSession memory) {
        return sessions[challengeId][player];
    }
    
    function getChallengePlayers(uint256 challengeId) external view returns (address[] memory) {
        return challengePlayers[challengeId];
    }
    
    function getPlayerEarningsFromAgent(uint256 agentId, address player) external view returns (uint256) {
        return agentLeaderboard[agentId][player];
    }
}
