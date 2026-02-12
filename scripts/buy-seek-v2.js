const { chromium } = require('playwright');

async function buySeek() {
  console.log('Starting...');
  
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  
  await page.goto('https://nad.fun/tokens/0x3b52D032e9A9C064e38Bbe0f7c1C8814f05b7777', { 
    waitUntil: 'domcontentloaded', 
    timeout: 30000 
  });
  await page.waitForTimeout(5000);
  
  // Get page content
  const content = await page.content();
  console.log('Page loaded. Looking for buy button...');
  
  // Screenshot
  await page.screenshot({ path: 'videos/nadfun-seek.png', fullPage: false });
  
  // Try to find Buy tab/button
  const buyBtn = await page.$('button:has-text("Buy")');
  const tradeBtn = await page.$('button:has-text("Trade")');
  const swapBtn = await page.$('button:has-text("Swap")');
  
  if (buyBtn) console.log('Found Buy button');
  if (tradeBtn) console.log('Found Trade button');
  if (swapBtn) console.log('Found Swap button');
  
  // Get all visible text to understand the page
  const text = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button, a, h1, h2, h3, p'))
      .map(el => el.textContent?.trim())
      .filter(t => t && t.length < 100)
      .slice(0, 30)
      .join('\n');
  });
  console.log('Page elements:\n', text);
  
  await browser.close();
}

buySeek().catch(e => console.log('Error:', e.message));
