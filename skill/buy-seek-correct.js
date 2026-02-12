const { createPublicClient, createWalletClient, http, parseEther, encodeFunctionData } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');

const PRIVATE_KEY = '0x7ae86bad4547897767b4eff9e92811dd069a064dbe0e1d6522b1ef33fd316a5e';
const SEEK_TOKEN = '0x3b52D032e9A9C064e38Bbe0f7c1C8814f05b7777';
const LENS = '0x7e78A8DE94f21804F7a17F4E8BF9EC2c872187ea';
const RPC = 'https://monad-mainnet.drpc.org';

const chain = {
  id: 143,
  name: 'Monad',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: { default: { http: [RPC] } },
};

const lensAbi = [{
  type: 'function',
  name: 'getAmountOut',
  inputs: [
    { name: '_token', type: 'address' },
    { name: '_amountIn', type: 'uint256' },
    { name: '_isBuy', type: 'bool' },
  ],
  outputs: [
    { name: 'router', type: 'address' },
    { name: 'amountOut', type: 'uint256' },
  ],
  stateMutability: 'view',
}];

const routerAbi = [{
  type: 'function',
  name: 'buy',
  inputs: [{
    name: 'params',
    type: 'tuple',
    components: [
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'token', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' },
    ],
  }],
  outputs: [],
  stateMutability: 'payable',
}];

async function buySeek() {
  const account = privateKeyToAccount(PRIVATE_KEY);
  
  const publicClient = createPublicClient({
    chain,
    transport: http(RPC),
  });
  
  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(RPC),
  });
  
  console.log('Wallet:', account.address);
  
  const balance = await publicClient.getBalance({ address: account.address });
  console.log('Balance:', (Number(balance) / 1e18).toFixed(4), 'MON');
  
  const monAmount = '250';
  const amountIn = parseEther(monAmount);
  
  // 1. Get quote from LENS
  console.log('Getting quote for', monAmount, 'MON...');
  const [router, amountOut] = await publicClient.readContract({
    address: LENS,
    abi: lensAbi,
    functionName: 'getAmountOut',
    args: [SEEK_TOKEN, amountIn, true],
  });
  
  console.log('Router:', router);
  console.log('Expected $SEEK:', (Number(amountOut) / 1e18).toFixed(2));
  
  // 2. Calculate slippage (2%)
  const amountOutMin = (amountOut * 98n) / 100n;
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 300);
  
  console.log('Min $SEEK (2% slippage):', (Number(amountOutMin) / 1e18).toFixed(2));
  
  // 3. Execute buy
  console.log('Buying...');
  
  const hash = await walletClient.writeContract({
    address: router,
    abi: routerAbi,
    functionName: 'buy',
    args: [{
      amountOutMin,
      token: SEEK_TOKEN,
      to: account.address,
      deadline,
    }],
    value: amountIn,
  });
  
  console.log('TX Hash:', hash);
  
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log('Status:', receipt.status);
  console.log('Gas used:', receipt.gasUsed.toString());
  
  if (receipt.status === 'success') {
    console.log('✅ SUCCESS! Bought $SEEK with 250 MON');
  } else {
    console.log('❌ Transaction failed');
  }
}

buySeek().catch(e => console.log('Error:', e.message));
