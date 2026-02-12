const { ethers } = require('ethers');

const RPC = 'https://rpc.monad.xyz';
const PRIVATE_KEY = '0x7ae86bad4547897767b4eff9e92811dd069a064dbe0e1d6522b1ef33fd316a5e';
const SEEK_TOKEN = '0x3b52D032e9A9C064e38Bbe0f7c1C8814f05b7777';
const ROUTER = '0x6F6B8F1a20703309951a5127c45B49b1CD981A22';

// BondingCurveRouter ABI for buy
const ROUTER_ABI = [
  'function buy(address token, uint256 minTokens, address recipient) payable returns (uint256)',
  'function buyTokens(address token, uint256 minAmountOut) payable',
  'function swapExactETHForTokens(uint256 amountOutMin, address[] path, address to, uint256 deadline) payable'
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log('Wallet:', wallet.address);
  const balance = await provider.getBalance(wallet.address);
  console.log('Balance:', ethers.formatEther(balance), 'MON');
  
  // Buy 250 MON worth of $SEEK
  const amountToBuy = ethers.parseEther('250');
  
  const router = new ethers.Contract(ROUTER, ROUTER_ABI, wallet);
  
  console.log('Buying $SEEK with 250 MON...');
  
  try {
    // Try buy function
    const tx = await router.buy(SEEK_TOKEN, 0, wallet.address, {
      value: amountToBuy,
      gasLimit: 500000
    });
    console.log('TX Hash:', tx.hash);
    const receipt = await tx.wait();
    console.log('SUCCESS! Gas used:', receipt.gasUsed.toString());
  } catch (e) {
    console.log('buy() failed, trying buyTokens()...');
    try {
      const tx = await router.buyTokens(SEEK_TOKEN, 0, {
        value: amountToBuy,
        gasLimit: 500000
      });
      console.log('TX Hash:', tx.hash);
      const receipt = await tx.wait();
      console.log('SUCCESS! Gas used:', receipt.gasUsed.toString());
    } catch (e2) {
      console.log('Error:', e2.message);
    }
  }
}

main().catch(console.error);
