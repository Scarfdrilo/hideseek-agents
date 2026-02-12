const { chromium } = require('playwright');

async function submitForm() {
  console.log('Starting submission...');
  
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('https://forms.moltiverse.dev/submit', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2000);
  
  // 1. Team Name
  console.log('1. Filling Team Name...');
  await page.fill('input[placeholder=""]', 'Scarfdrilo');
  await page.waitForTimeout(500);
  
  // Find team name input more specifically
  const teamNameInput = await page.$('input');
  if (teamNameInput) {
    await teamNameInput.fill('Scarfdrilo');
  }
  
  // 2. Team size = 1
  console.log('2. Selecting Team Size = 1...');
  await page.click('text="1"');
  await page.waitForTimeout(500);
  
  // 3. Track = Agent + Token
  console.log('3. Selecting Agent + Token track...');
  await page.click('text="Agent + Token"');
  await page.waitForTimeout(1500);
  
  // Screenshot after track selection
  await page.screenshot({ path: 'videos/submit-track.png', fullPage: true });
  
  // 4. Now more fields should appear, scroll down and fill them
  console.log('4. Looking for additional fields...');
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(1000);
  
  // Get all visible inputs
  const allInputs = await page.$$eval('input, textarea', els => 
    els.map(e => ({ placeholder: e.placeholder, type: e.type, name: e.name }))
  );
  console.log('Inputs found:', JSON.stringify(allInputs, null, 2));
  
  // Try to fill token address
  const tokenInput = await page.$('input[placeholder*="0x"], input[placeholder*="token"], input[placeholder*="address"]');
  if (tokenInput) {
    await tokenInput.fill('0x3b52d032e9a9c064e38bbe0f7c1c8814f05b7777');
    console.log('Filled token address');
  }
  
  // Scroll and screenshot
  await page.evaluate(() => window.scrollTo(0, 1000));
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'videos/submit-fields.png', fullPage: true });
  
  await browser.close();
  console.log('Done. Check screenshots.');
}

submitForm().catch(e => console.log('Error:', e.message));
