import { createPublicClient, createWalletClient, http, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import fs from 'fs';

const CONFIG = {
  chainId: 143,
  rpcUrl: 'https://rpc.monad.xyz',
  apiUrl: 'https://api.nadapp.net',
  BONDING_CURVE_ROUTER: '0x6F6B8F1a20703309951a5127c45B49b1CD981A22',
  CURVE: '0xA7283d07812a02AFB7C09B60f8896bCEA3F90aCE',
};

const chain = {
  id: CONFIG.chainId,
  name: 'Monad',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: { default: { http: [CONFIG.rpcUrl] } },
};

const envContent = fs.readFileSync('./contracts/.env', 'utf8');
const privateKey = envContent.match(/PRIVATE_KEY=(.+)/)?.[1]?.trim();
const account = privateKeyToAccount(privateKey);
console.log('🔑 Wallet:', account.address);

const publicClient = createPublicClient({ chain, transport: http(CONFIG.rpcUrl) });
const walletClient = createWalletClient({ account, chain, transport: http(CONFIG.rpcUrl) });

const TOKEN = {
  name: 'HideSeek',
  symbol: 'SEEK',
  description: 'The official token of HideSeek Agents - an adversarial AI game on Monad where agents compete in procedural mazes. SEEK to win! 🎮🦾',
  website: 'https://hideseek-agents.vercel.app',
  twitter: 'https://x.com/0xscarf',
};

const curveAbi = [{
  type: 'function',
  name: 'feeConfig',
  inputs: [],
  outputs: [
    { name: 'deployFeeAmount', type: 'uint256' },
    { name: 'graduateFeeAmount', type: 'uint256' },
    { name: 'protocolFee', type: 'uint24' },
  ],
  stateMutability: 'view',
}];

// CORRECT ABI - actionId is uint8!
const bondingCurveRouterAbi = [{
  type: 'function',
  name: 'create',
  inputs: [{
    name: 'params',
    type: 'tuple',
    components: [
      { name: 'name', type: 'string' },
      { name: 'symbol', type: 'string' },
      { name: 'tokenURI', type: 'string' },
      { name: 'amountOut', type: 'uint256' },
      { name: 'salt', type: 'bytes32' },
      { name: 'actionId', type: 'uint8' },  // FIXED: uint8 not uint256
    ],
  }],
  outputs: [
    { name: 'token', type: 'address' },
    { name: 'pool', type: 'address' },
  ],
  stateMutability: 'payable',
}];

async function main() {
  console.log('\n🚀 Creating $SEEK token on nad.fun...\n');

  // Use previously uploaded assets (still valid)
  const metadata_uri = 'https://storage.nadapp.net/metadata/fd4fd2a1-9fe0-4a89-b749-a571c8f564e2.json';
  
  console.log('📝 Using metadata:', metadata_uri);

  console.log('\n⛏️ Mining fresh salt...');
  const saltResponse = await fetch(`${CONFIG.apiUrl}/agent/salt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creator: account.address,
      name: TOKEN.name,
      symbol: TOKEN.symbol,
      metadata_uri,
    }),
  });
  const { salt, address: predictedAddress } = await saltResponse.json();
  console.log('   Salt:', salt);
  console.log('   Token:', predictedAddress);

  console.log('\n💰 Getting deploy fee...');
  const feeConfig = await publicClient.readContract({
    address: CONFIG.CURVE,
    abi: curveAbi,
    functionName: 'feeConfig',
  });
  const deployFeeAmount = feeConfig[0];
  const initialBuy = parseEther('0.5');
  const totalValue = deployFeeAmount + initialBuy;
  console.log('   Fee:', (Number(deployFeeAmount) / 1e18).toFixed(2), 'MON');
  console.log('   Buy:', '0.5 MON');
  console.log('   Total:', (Number(totalValue) / 1e18).toFixed(2), 'MON');

  console.log('\n🚀 Creating on-chain...');
  const hash = await walletClient.writeContract({
    address: CONFIG.BONDING_CURVE_ROUTER,
    abi: bondingCurveRouterAbi,
    functionName: 'create',
    args: [{
      name: TOKEN.name,
      symbol: TOKEN.symbol,
      tokenURI: metadata_uri,
      amountOut: 0n,
      salt: salt,
      actionId: 1,  // uint8
    }],
    value: totalValue,
  });

  console.log('   TX:', hash);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log('   ✅ Block:', receipt.blockNumber);

  console.log('\n🎉🎉🎉 $SEEK CREATED! 🎉🎉🎉');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Token:  $SEEK (HideSeek)');
  console.log('Address:', predictedAddress);
  console.log('nad.fun: https://nad.fun/token/' + predictedAddress);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main().catch(e => console.error('❌', e.shortMessage || e.message));
