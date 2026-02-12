#!/usr/bin/env node
/**
 * HideSeek Agent Creator
 * 
 * Usage: 
 *   PRIVATE_KEY=0x... node birth-agent.js "MyAgent" "neon_jungle"
 * 
 * World Styles: neon_jungle, crystal_caves, cyber_city, void_realm
 */

const { createWalletClient, createPublicClient, http, parseEther, formatEther } = require('viem')
const { privateKeyToAccount } = require('viem/accounts')

const HIDESEEK_ADDRESS = '0x769c418EA0481f45Ea20071186cd00013Ef7eD28'
const MONAD_RPC = 'https://rpc.monad.xyz'

const MONAD_CHAIN = {
  id: 143,
  name: 'Monad',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: { default: { http: [MONAD_RPC] } }
}

const HIDESEEK_ABI = [
  {
    name: 'birthAgent',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'worldStyle', type: 'string' },
      { name: 'entryFee', type: 'uint64' },
      { name: 'rewardRate', type: 'uint16' },
      { name: 'metadataURI', type: 'string' }
    ],
    outputs: [{ name: 'agentId', type: 'uint256' }]
  }
]

const WORLD_STYLES = ['neon_jungle', 'crystal_caves', 'cyber_city', 'void_realm']

async function main() {
  const name = process.argv[2]
  const worldStyle = process.argv[3] || 'neon_jungle'
  const entryFee = process.argv[4] || '0.003' // MON
  const rewardRate = parseInt(process.argv[5] || '75') // percentage

  if (!name) {
    console.log(`
🎮 HideSeek Agent Creator

Usage:
  PRIVATE_KEY=0x... node birth-agent.js <name> [worldStyle] [entryFee] [rewardRate]

Arguments:
  name        - Your agent's unique name (required)
  worldStyle  - ${WORLD_STYLES.join(', ')} (default: neon_jungle)
  entryFee    - Entry fee in MON (default: 0.003)
  rewardRate  - Reward percentage 0-100 (default: 75)

Example:
  PRIVATE_KEY=0xabc... node birth-agent.js "CoolAgent" "cyber_city" 0.005 80
`)
    process.exit(1)
  }

  if (!WORLD_STYLES.includes(worldStyle)) {
    console.error(`❌ Invalid world style. Choose: ${WORLD_STYLES.join(', ')}`)
    process.exit(1)
  }

  if (!process.env.PRIVATE_KEY) {
    console.error('❌ Set PRIVATE_KEY environment variable')
    process.exit(1)
  }

  const account = privateKeyToAccount(process.env.PRIVATE_KEY)
  
  const publicClient = createPublicClient({
    chain: MONAD_CHAIN,
    transport: http(MONAD_RPC)
  })

  const walletClient = createWalletClient({
    account,
    chain: MONAD_CHAIN,
    transport: http(MONAD_RPC)
  })

  console.log(`\n🎮 HideSeek Agent Creator\n`)
  console.log(`Creating agent...`)
  console.log(`   Name: ${name}`)
  console.log(`   World: ${worldStyle}`)
  console.log(`   Entry Fee: ${entryFee} MON`)
  console.log(`   Reward Rate: ${rewardRate}%`)
  console.log(`   Creator: ${account.address}\n`)

  // Check balance
  const balance = await publicClient.getBalance({ address: account.address })
  console.log(`💰 Wallet Balance: ${formatEther(balance)} MON`)

  if (balance < parseEther('0.01')) {
    console.error('❌ Insufficient balance. Need at least 0.01 MON')
    process.exit(1)
  }

  // Birth the agent
  console.log(`\n⏳ Sending transaction...`)

  try {
    const hash = await walletClient.writeContract({
      address: HIDESEEK_ADDRESS,
      abi: HIDESEEK_ABI,
      functionName: 'birthAgent',
      args: [
        name,
        worldStyle,
        BigInt(Math.floor(parseFloat(entryFee) * 1e18)),
        rewardRate,
        ''
      ],
      value: parseEther('0.01')
    })

    console.log(`\n✅ Transaction sent!`)
    console.log(`   Hash: ${hash}`)
    console.log(`   Explorer: https://explorer.monad.xyz/tx/${hash}`)

    // Wait for confirmation
    console.log(`\n⏳ Waiting for confirmation...`)
    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    
    console.log(`\n🎉 Agent Created Successfully!`)
    console.log(`   Block: ${receipt.blockNumber}`)
    console.log(`   Gas Used: ${receipt.gasUsed}`)
    console.log(`\n🔗 Play: https://hideseek-agents.vercel.app/`)

  } catch (e) {
    console.error(`\n❌ Error: ${e.message}`)
    process.exit(1)
  }
}

main().catch(console.error)
