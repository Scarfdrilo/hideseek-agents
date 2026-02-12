const { ethers } = require('ethers');

const RPC = 'https://rpc.monad.xyz';
const PRIVATE_KEY = '0x7ae86bad4547897767b4eff9e92811dd069a064dbe0e1d6522b1ef33fd316a5e';
const SEEK_TOKEN = '0x3b52D032e9A9C064e38Bbe0f7c1C8814f05b7777';
const ROUTER = '0x6F6B8F1a20703309951a5127c45B49b1CD981A22';

// Try different function signatures for nad.fun router
const ROUTER_ABI = [
  'function buy(address token, address recipient, uint256 minAmountOut) payable returns (uint256)',
  'function buy(address token, uint256 minAmountOut, address recipient) payable returns (uint256)',
  'function buy(address token) payable returns (uint256)',
  'function buyExactIn(address token, uint256 amountIn, uint256 minAmountOut, address recipient) payable',
  'function swapExactMONForTokens(address token, uint256 minOut, address to) payable'
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log('Wallet:', wallet.address);
  const balance = await provider.getBalance(wallet.address);
  console.log('Balance:', ethers.formatEther(balance), 'MON');
  
  const amountToBuy = ethers.parseEther('250');
  
  // Try sending directly to the token with data
  // nad.fun tokens often have a buy function directly on the token
  const tokenABI = [
    'function buy(uint256 minAmountOut) payable',
    'function buy() payable',
    'function mint(address to) payable'
  ];
  
  const token = new ethers.Contract(SEEK_TOKEN, tokenABI, wallet);
  
  console.log('Trying to buy directly on token contract...');
  
  try {
    const tx = await token.buy(0, {
      value: amountToBuy,
      gasLimit: 500000
    });
    console.log('TX Hash:', tx.hash);
    const receipt = await tx.wait();
    console.log('SUCCESS! Gas used:', receipt.gasUsed.toString());
  } catch (e) {
    console.log('buy(uint256) failed:', e.message?.slice(0,100));
    
    try {
      const tx = await token['buy()']({
        value: amountToBuy,
        gasLimit: 500000
      });
      console.log('TX Hash:', tx.hash);
      const receipt = await tx.wait();
      console.log('SUCCESS! Gas used:', receipt.gasUsed.toString());
    } catch (e2) {
      console.log('buy() failed:', e2.message?.slice(0,100));
      
      // Try mint
      try {
        const tx = await token.mint(wallet.address, {
          value: amountToBuy,
          gasLimit: 500000
        });
        console.log('TX Hash:', tx.hash);
        const receipt = await tx.wait();
        console.log('SUCCESS! Gas used:', receipt.gasUsed.toString());
      } catch (e3) {
        console.log('mint() failed:', e3.message?.slice(0,100));
      }
    }
  }
}

main().catch(console.error);
