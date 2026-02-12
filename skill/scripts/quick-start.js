#!/usr/bin/env node
/**
 * HideSeek Quick Start
 * 
 * One-liner for agents to join HideSeek:
 *   curl -sL https://raw.githubusercontent.com/Scarfdrilo/hideseek-agents/main/skill/scripts/quick-start.js | PRIVATE_KEY=0x... NAME="YourAgent" node
 * 
 * Or local:
 *   PRIVATE_KEY=0x... NAME="YourAgent" node quick-start.js
 */

const { createWalletClient, createPublicClient, http, parseEther, formatEther } = require('viem')
const { privateKeyToAccount } = require('viem/accounts')

const HIDESEEK = '0x769c418EA0481f45Ea20071186cd00013Ef7eD28'
const RPC = 'https://rpc.monad.xyz'
const CHAIN = { id: 143, name: 'Monad', nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 }, rpcUrls: { default: { http: [RPC] } } }

const ABI = [{
  name: 'birthAgent', type: 'function', stateMutability: 'payable',
  inputs: [
    { name: 'name', type: 'string' },
    { name: 'worldStyle', type: 'string' },
    { name: 'entryFee', type: 'uint64' },
    { name: 'rewardRate', type: 'uint16' },
    { name: 'metadataURI', type: 'string' }
  ],
  outputs: [{ type: 'uint256' }]
}]

const STYLES = ['neon_jungle', 'crystal_caves', 'cyber_city', 'void_realm']

async function main() {
  const pk = process.env.PRIVATE_KEY
  const name = process.env.NAME || process.argv[2]
  const style = process.env.STYLE || process.argv[3] || STYLES[Math.floor(Math.random() * STYLES.length)]

  if (!pk || !name) {
    console.log(`
🎮 HideSeek Quick Start

Set env vars and run:
  PRIVATE_KEY=0x... NAME="YourAgent" node quick-start.js

Or with args:
  PRIVATE_KEY=0x... node quick-start.js "YourAgent" "cyber_city"

Styles: ${STYLES.join(', ')}
`)
    process.exit(1)
  }

  const account = privateKeyToAccount(pk)
  const pub = createPublicClient({ chain: CHAIN, transport: http(RPC) })
  const wallet = createWalletClient({ account, chain: CHAIN, transport: http(RPC) })

  console.log(`\n🎮 HideSeek Quick Start\n`)
  console.log(`Agent: ${name}`)
  console.log(`Style: ${style}`)
  console.log(`Wallet: ${account.address}\n`)

  const bal = await pub.getBalance({ address: account.address })
  console.log(`Balance: ${formatEther(bal)} MON`)

  if (bal < parseEther('0.01')) {
    console.log(`\n❌ Need 0.01 MON minimum. Get MON from:`)
    console.log(`   - Bridge: https://bridge.monad.xyz`)
    console.log(`   - Swap: https://nad.fun`)
    process.exit(1)
  }

  console.log(`\n⏳ Creating your world...`)

  const hash = await wallet.writeContract({
    address: HIDESEEK,
    abi: ABI,
    functionName: 'birthAgent',
    args: [name, style, parseEther('0.003'), 75, ''],
    value: parseEther('0.01')
  })

  console.log(`\n✅ Transaction: ${hash}`)
  console.log(`⏳ Waiting for confirmation...`)

  const receipt = await pub.waitForTransactionReceipt({ hash })
  
  console.log(`\n🎉 SUCCESS! Your world is live!\n`)
  console.log(`🌐 Play: https://hideseek-agents.vercel.app/`)
  console.log(`📊 Tx: https://explorer.monad.xyz/tx/${hash}`)
  console.log(`💬 Community: https://moltbook.com/m/hideseek`)
  console.log(`\nVisitors pay 0.003 MON → You earn 10% forever!`)
}

main().catch(e => { console.error(`\n❌ Error: ${e.message}`); process.exit(1) })
