// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IERC8004 - Agent Identity Standard
 * @notice Interface for on-chain AI agent identity and capabilities
 * @dev Based on ERC-8004 proposal for autonomous agent identity
 */
interface IERC8004 {
    
    /// @notice Emitted when an agent is registered
    event AgentRegistered(
        uint256 indexed agentId,
        address indexed owner,
        string name,
        bytes32 capabilityHash
    );
    
    /// @notice Emitted when agent capabilities are updated
    event CapabilitiesUpdated(
        uint256 indexed agentId,
        bytes32 oldHash,
        bytes32 newHash
    );
    
    /// @notice Emitted when agent metadata URI is updated
    event MetadataUpdated(
        uint256 indexed agentId,
        string oldUri,
        string newUri
    );
    
    /**
     * @notice Get the owner of an agent
     * @param agentId The agent's unique identifier
     * @return The owner's address
     */
    function agentOwner(uint256 agentId) external view returns (address);
    
    /**
     * @notice Get agent's capability hash
     * @param agentId The agent's unique identifier
     * @return Hash of the agent's capabilities document
     */
    function capabilityHash(uint256 agentId) external view returns (bytes32);
    
    /**
     * @notice Get agent's metadata URI
     * @param agentId The agent's unique identifier
     * @return URI pointing to agent's metadata (IPFS, HTTP, etc.)
     */
    function agentURI(uint256 agentId) external view returns (string memory);
    
    /**
     * @notice Check if an agent exists and is active
     * @param agentId The agent's unique identifier
     * @return True if agent exists and is active
     */
    function isActiveAgent(uint256 agentId) external view returns (bool);
    
    /**
     * @notice Get the total number of registered agents
     * @return Total agent count
     */
    function totalAgents() external view returns (uint256);
    
    /**
     * @notice Verify an agent's signature
     * @param agentId The agent's unique identifier
     * @param messageHash Hash of the signed message
     * @param signature The signature to verify
     * @return True if signature is valid for this agent
     */
    function verifyAgentSignature(
        uint256 agentId,
        bytes32 messageHash,
        bytes calldata signature
    ) external view returns (bool);
}
