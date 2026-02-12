const { chromium } = require('playwright');

const SEEK_URL = 'https://nad.fun/tokens/0x3b52D032e9A9C064e38Bbe0f7c1C8814f05b7777';
const PRIVATE_KEY = '0x7ae86bad4547897767b4eff9e92811dd069a064dbe0e1d6522b1ef33fd316a5e';

async function buySeek() {
  console.log('Launching browser...');
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  
  const page = await context.newPage();
  
  console.log('Loading $SEEK token page...');
  await page.goto(SEEK_URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(3000);
  
  // Take screenshot to see what's there
  await page.screenshot({ path: 'videos/seek-buy-1.png' });
  console.log('Screenshot 1 saved');
  
  // Look for Connect Wallet button
  const connectBtn = await page.$('button:has-text("Connect")');
  if (connectBtn) {
    console.log('Found Connect button, clicking...');
    await connectBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'videos/seek-buy-2.png' });
  }
  
  // Look for any wallet options
  const walletOptions = await page.$$('button');
  console.log('Found', walletOptions.length, 'buttons');
  
  // Print button texts
  for (const btn of walletOptions.slice(0, 10)) {
    const text = await btn.textContent();
    console.log('Button:', text?.trim().slice(0, 50));
  }
  
  await page.screenshot({ path: 'videos/seek-buy-3.png' });
  
  await browser.close();
  console.log('Done - check screenshots');
}

buySeek().catch(console.error);
