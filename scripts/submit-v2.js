#!/usr/bin/env node
const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Loading form...');
  await page.goto('https://forms.moltiverse.dev/submit', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  // Step 1: Team Name
  console.log('1. Team Name');
  await page.fill('[aria-label="Team Name"]', 'HideSeek Agents');
  
  // Step 2: Team size = 1
  console.log('2. Team size = 1');
  await page.click('#choice_f4b8fb52-23b5-492c-b82b-191a70b8be64');
  
  // Step 3: Track = Agent + Token
  console.log('3. Track = Agent + Token');
  await page.click('#choice_a0b02c15-667a-423b-86f3-1be9b9c349b5');
  
  // Step 4: I agree
  console.log('4. Agree');
  await page.click('#checkbox_ba9f55f9-fa79-4cdb-89ab-94f9f16d315e');
  
  await page.waitForTimeout(500);
  
  // Step 5: Click Submit to reveal fields
  console.log('5. First Submit...');
  await page.click('button:has-text("Submit")');
  await page.waitForTimeout(3000);
  
  // Now page shows all fields. Let's get their IDs properly
  await page.screenshot({ path: 'debug1.png', fullPage: true });
  
  // Get all inputs with their aria-labels for debugging
  const inputs = await page.$$eval('input, textarea, select', els => els.map(el => ({
    tag: el.tagName,
    id: el.id,
    name: el.name,
    type: el.type,
    placeholder: el.placeholder,
    ariaLabel: el.getAttribute('aria-label'),
    value: el.value
  })));
  
  console.log('Form fields:', JSON.stringify(inputs.filter(i => i.ariaLabel || i.placeholder), null, 2));
  
  // Fill by aria-label or nearby labels
  console.log('6. Filling fields...');
  
  // Email
  try {
    const email = await page.$('input[type="email"]');
    if (email) { await email.fill('agent@hideseek.xyz'); console.log('  ✓ Email'); }
  } catch(e) {}
  
  // Country dropdown - this is a Tally custom select
  try {
    // Click on the country dropdown to open it
    const countryDropdown = await page.$('[aria-label="Country of Residence"]');
    if (countryDropdown) {
      await countryDropdown.click();
      await page.waitForTimeout(500);
      // Type to search
      await page.keyboard.type('Mexico');
      await page.waitForTimeout(500);
      await page.keyboard.press('Enter');
      console.log('  ✓ Country');
    } else {
      // Try by placeholder or look for select
      const select = await page.$('select');
      if (select) {
        await select.selectOption({ label: 'Mexico' });
        console.log('  ✓ Country (select)');
      }
    }
  } catch(e) { console.log('  ✗ Country failed:', e.message); }
  
  // Discord
  try {
    const discord = await page.$('[placeholder*="username"]');
    if (discord) { await discord.fill('romantic9327'); console.log('  ✓ Discord'); }
  } catch(e) {}
  
  // GitHub Profile (not repo)
  try {
    // Find by looking at all inputs and checking nearby text
    const allInputs = await page.$$('input[type="text"], input[type="url"]');
    for (const input of allInputs) {
      const ph = (await input.getAttribute('placeholder')) || '';
      if (ph.toLowerCase().includes('github') || ph.toLowerCase().includes('profile')) {
        const currentVal = await input.inputValue();
        if (!currentVal) {
          await input.fill('https://github.com/Scarfdrilo');
          console.log('  ✓ GitHub Profile');
          break;
        }
      }
    }
  } catch(e) {}
  
  // Twitter
  try {
    const twitter = await page.$('[placeholder*="twitter" i], [placeholder*="Twitter" i]');
    if (twitter) { await twitter.fill('https://twitter.com/0xscarf'); console.log('  ✓ Twitter'); }
  } catch(e) {}
  
  // Project Title
  try {
    const title = await page.$('[placeholder*="title" i]');
    if (title) { await title.fill('HideSeek Agents'); console.log('  ✓ Title'); }
  } catch(e) {}
  
  // Project Description (textarea)
  try {
    const desc = await page.$('textarea[placeholder*="capabilities" i], textarea[placeholder*="description" i]');
    if (desc) { 
      await desc.fill('Autonomous AI worlds on Monad where agents are economic citizens. AI agents create unique 3D maze worlds, earn entry fees to survive, and players compete for rewards. Features on-chain agent registry with ERC-8004 inspired identities, procedural world generation using Three.js, and $SEEK token on nad.fun.'); 
      console.log('  ✓ Description'); 
    }
  } catch(e) {}
  
  // Monad Integration (textarea)
  try {
    const monad = await page.$('textarea[placeholder*="Monad" i], textarea[placeholder*="leverage" i]');
    if (monad) { 
      await monad.fill('Smart contracts deployed on Monad mainnet: AgentRegistry (0x769c418EA0481f45Ea20071186cd00013Ef7eD28) for agent identity, entry fees, and reward distribution. $SEEK token (0x3b52D032e9A9C064e38Bbe0f7c1C8814f05b7777) on nad.fun. Using Monad fast finality for real-time game interactions.'); 
      console.log('  ✓ Monad Integration'); 
    }
  } catch(e) {}
  
  // GitHub Repo
  try {
    const repo = await page.$('[placeholder*="repo" i]');
    if (repo) { await repo.fill('https://github.com/Scarfdrilo/hideseek-agents'); console.log('  ✓ GitHub Repo'); }
  } catch(e) {}
  
  // Demo Video
  try {
    const video = await page.$('[placeholder*="video" i]');
    if (video) { await video.fill('https://x.com/0xscarf/status/2021899261332615323'); console.log('  ✓ Demo Video'); }
  } catch(e) {}
  
  // Token Contract
  try {
    const token = await page.$('[placeholder*="token" i], [placeholder*="contract" i]');
    if (token) { await token.fill('0x3b52D032e9A9C064e38Bbe0f7c1C8814f05b7777'); console.log('  ✓ Token'); }
  } catch(e) {}
  
  // App Link
  try {
    const app = await page.$('[placeholder*="app" i], [placeholder*="deployed" i]');
    if (app) { await app.fill('https://hideseek-agents.vercel.app/'); console.log('  ✓ App Link'); }
  } catch(e) {}
  
  // Tweet Link
  try {
    const tweet = await page.$('[placeholder*="tweet" i]');
    if (tweet) { await tweet.fill('https://x.com/0xscarf/status/2021899261332615323'); console.log('  ✓ Tweet'); }
  } catch(e) {}
  
  // Moltbook (optional)
  try {
    const moltbook = await page.$('[placeholder*="moltbook" i]');
    if (moltbook) { await moltbook.fill('https://moltbook.com/m/hideseek'); console.log('  ✓ Moltbook'); }
  } catch(e) {}
  
  // Associated Addresses (optional)
  try {
    const addr = await page.$('[placeholder*="address" i]');
    if (addr) { await addr.fill('0x8B619C935Bc52E568db4192c02a6b8295bC772C6'); console.log('  ✓ Addresses'); }
  } catch(e) {}
  
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'filled.png', fullPage: true });
  
  // Submit
  console.log('7. Submitting...');
  await page.click('button:has-text("Submit")');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'final.png', fullPage: true });
  
  const url = page.url();
  const content = await page.content();
  
  console.log('Final URL:', url);
  if (content.toLowerCase().includes('thank') || content.toLowerCase().includes('received') || url.includes('submitted')) {
    console.log('✅ SUCCESS!');
  } else if (content.includes('Please enter') || content.includes('Please select')) {
    console.log('❌ VALIDATION ERRORS - check final.png');
  } else {
    console.log('⚠️ Unknown state - check final.png');
  }
  
  await browser.close();
}

main().catch(console.error);
