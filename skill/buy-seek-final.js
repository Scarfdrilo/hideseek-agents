const { ethers } = require('ethers');

const RPC = 'https://rpc.monad.xyz';
const PRIVATE_KEY = '0x7ae86bad4547897767b4eff9e92811dd069a064dbe0e1d6522b1ef33fd316a5e';
const SEEK_TOKEN = '0x3b52D032e9A9C064e38Bbe0f7c1C8814f05b7777';
const ROUTER = '0x6F6B8F1a20703309951a5127c45B49b1CD981A22';

// Try the actual nad.fun router interface based on common patterns
const ROUTER_ABI = [
  'function buy(address token, address recipient, string orderType, uint256 minAmountOut, uint16 priceLimitPct) payable',
  'function buy(address token, uint256 minAmountOut, address recipient, uint256 deadline) payable returns (uint256)',
  'function buyTokens(address token, address to, uint256 minOut) payable',
  'function swap(address token, bool isBuy, uint256 amount, uint256 minOut) payable'
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log('Wallet:', wallet.address);
  const balance = await provider.getBalance(wallet.address);
  console.log('Balance:', ethers.formatEther(balance), 'MON');
  
  const amountToBuy = ethers.parseEther('250');
  const deadline = Math.floor(Date.now() / 1000) + 600; // 10 min
  
  // Try with lower gas limit to save gas on failures
  const gasLimit = 200000;
  
  const router = new ethers.Contract(ROUTER, ROUTER_ABI, wallet);
  
  // Try method 1: buy with deadline
  try {
    console.log('Trying buy(token, minOut, recipient, deadline)...');
    const tx = await router['buy(address,uint256,address,uint256)'](
      SEEK_TOKEN, 0, wallet.address, deadline,
      { value: amountToBuy, gasLimit }
    );
    console.log('TX:', tx.hash);
    const r = await tx.wait();
    console.log('SUCCESS! Gas:', r.gasUsed.toString());
    return;
  } catch(e) {
    console.log('Failed:', e.message?.slice(0,80));
  }
  
  // Try raw call with function selector 0x0924e219 (unknown but might be buy)
  try {
    console.log('Trying raw call 0x0924e219...');
    const data = '0x0924e219' + 
      SEEK_TOKEN.slice(2).padStart(64, '0') + 
      wallet.address.slice(2).padStart(64, '0') +
      '0'.padStart(64, '0'); // minOut = 0
    
    const tx = await wallet.sendTransaction({
      to: ROUTER,
      data: data,
      value: amountToBuy,
      gasLimit
    });
    console.log('TX:', tx.hash);
    const r = await tx.wait();
    console.log('SUCCESS! Gas:', r.gasUsed.toString());
    return;
  } catch(e) {
    console.log('Failed:', e.message?.slice(0,80));
  }
  
  // Try selector 0x52f07cf9
  try {
    console.log('Trying raw call 0x52f07cf9...');
    const data = '0x52f07cf9' + 
      SEEK_TOKEN.slice(2).padStart(64, '0') + 
      wallet.address.slice(2).padStart(64, '0') +
      '0'.padStart(64, '0');
    
    const tx = await wallet.sendTransaction({
      to: ROUTER,
      data: data,
      value: amountToBuy,
      gasLimit
    });
    console.log('TX:', tx.hash);
    const r = await tx.wait();
    console.log('SUCCESS! Gas:', r.gasUsed.toString());
  } catch(e) {
    console.log('Failed:', e.message?.slice(0,80));
  }
  
  console.log('\nNo method worked. Need to check nad.fun docs or UI.');
}

main().catch(console.error);
