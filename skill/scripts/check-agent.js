#!/usr/bin/env node
/**
 * HideSeek Agent Checker
 * Usage: node check-agent.js [agentId]
 */

const { createPublicClient, http, formatEther } = require('viem')

const HIDESEEK_ADDRESS = '0x769c418EA0481f45Ea20071186cd00013Ef7eD28'
const MONAD_RPC = 'https://rpc.monad.xyz'

const HIDESEEK_ABI = [
  {
    name: 'agents',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'agentId', type: 'uint256' }],
    outputs: [
      { name: 'owner', type: 'address' },
      { name: 'name', type: 'string' },
      { name: 'worldStyle', type: 'string' },
      { name: 'entryFee', type: 'uint64' },
      { name: 'balance', type: 'uint64' },
      { name: 'rewardRate', type: 'uint16' },
      { name: 'level', type: 'uint8' },
      { name: 'isActive', type: 'bool' },
      { name: 'metadataURI', type: 'string' }
    ]
  },
  {
    name: 'totalAgents',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }]
  }
]

async function main() {
  const agentId = process.argv[2] || '1'
  
  const client = createPublicClient({
    transport: http(MONAD_RPC)
  })

  console.log(`\n🎮 HideSeek Agent Checker\n`)
  console.log(`Contract: ${HIDESEEK_ADDRESS}`)
  console.log(`Chain: Monad (143)\n`)

  // Get total agents
  const total = await client.readContract({
    address: HIDESEEK_ADDRESS,
    abi: HIDESEEK_ABI,
    functionName: 'totalAgents'
  })
  console.log(`📊 Total Agents: ${total}\n`)

  // Get agent info
  if (agentId) {
    try {
      const agent = await client.readContract({
        address: HIDESEEK_ADDRESS,
        abi: HIDESEEK_ABI,
        functionName: 'agents',
        args: [BigInt(agentId)]
      })

      console.log(`🤖 Agent #${agentId}:`)
      console.log(`   Name: ${agent[1]}`)
      console.log(`   World: ${agent[2]}`)
      console.log(`   Owner: ${agent[0]}`)
      console.log(`   Entry Fee: ${formatEther(BigInt(agent[3]))} MON`)
      console.log(`   Balance: ${formatEther(BigInt(agent[4]))} MON`)
      console.log(`   Reward Rate: ${agent[5]}%`)
      console.log(`   Level: ${agent[6]}`)
      console.log(`   Active: ${agent[7] ? '✅' : '❌'}`)
      if (agent[8]) console.log(`   Metadata: ${agent[8]}`)
    } catch (e) {
      console.error(`❌ Agent #${agentId} not found`)
    }
  }

  console.log(`\n🔗 Play: https://hideseek-agents.vercel.app/\n`)
}

main().catch(console.error)
