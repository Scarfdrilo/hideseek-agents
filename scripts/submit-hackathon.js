const { chromium } = require('playwright');

const FORM_URL = 'https://forms.moltiverse.dev/submit';

const PROJECT_DATA = {
  track: 'Agent + Token',
  token: '0x3b52d032e9a9c064e38bbe0f7c1c8814f05b7777',
  title: 'HideSeek Agents',
  description: 'Adversarial AI hide-and-seek game on Monad. AI agents compete in procedurally generated 3D mazes - seekers hunt, hiders evade. On-chain registry with entry fees, creator rewards, and $SEEK token utility. Features optimized Three.js rendering (70x improvement), real wallet integration, and comprehensive developer skill/SDK.',
  monadIntegration: 'Smart contracts deployed on Monad mainnet (chain 143) for agent registry and game mechanics. Uses Monad high TPS for real-time game state. $SEEK token launched on nad.fun bonding curve (59%+ progress). Wallet integration via wagmi/viem for seamless UX.',
  github: 'https://github.com/Scarfdrilo/hideseek-agents',
  app: 'https://hideseek-agents.vercel.app',
  videoTweet: 'https://x.com/0xscarf/status/2021912090093748624',
  moltbook: 'https://moltbook.com/m/hideseek',
  addresses: `Creator Wallet: 0x8B619C935Bc52E568db4192c02a6b8295bC772C6
Game Contract: 0x769c418EA0481f45Ea20071186cd00013Ef7eD28
$SEEK Token: 0x3b52d032e9a9c064e38bbe0f7c1c8814f05b7777`
};

async function submitForm() {
  console.log('Opening form...');
  
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto(FORM_URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(3000);
  
  console.log('Form loaded. Taking screenshot...');
  await page.screenshot({ path: 'videos/submit-1.png', fullPage: true });
  
  // Get all input fields and buttons
  const inputs = await page.$$('input, textarea, select, button');
  console.log('Found', inputs.length, 'form elements');
  
  // Try to fill the form
  // First, look for the track selector (Agent + Token)
  const trackOption = await page.$('text="Agent + Token"');
  if (trackOption) {
    console.log('Found Agent + Token option, clicking...');
    await trackOption.click();
    await page.waitForTimeout(1000);
  }
  
  // Take screenshot after track selection
  await page.screenshot({ path: 'videos/submit-2.png', fullPage: true });
  
  // List all visible text inputs
  const textInputs = await page.$$('input[type="text"], input[type="url"], input[type="email"], textarea');
  console.log('Text inputs found:', textInputs.length);
  
  await browser.close();
  console.log('Screenshots saved. Check videos/submit-*.png');
}

submitForm().catch(e => console.log('Error:', e.message));
