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
  
  // Step 5: Click Submit to reveal fields
  console.log('5. First Submit...');
  await page.click('button:has-text("Submit")');
  await page.waitForTimeout(3000);
  
  // Use aria-label selectors directly
  console.log('6. Filling ALL fields by aria-label...');
  
  await page.fill('[aria-label="Email Address"]', 'agent@hideseek.xyz');
  console.log('  ✓ Email');
  
  // Country - try clicking the dropdown and selecting
  try {
    // Tally uses a custom dropdown, let's try clicking it
    const countryContainer = await page.$('text=Country of Residence');
    if (countryContainer) {
      // Find the actual dropdown element (usually a div with role=combobox or similar)
      const dropdown = await page.$('[aria-haspopup="listbox"]');
      if (dropdown) {
        await dropdown.click();
        await page.waitForTimeout(500);
        await page.click('text=Mexico');
        console.log('  ✓ Country');
      } else {
        // Try keyboard navigation
        await page.keyboard.press('Tab'); // Focus next element
        await page.keyboard.type('Mexico');
        await page.keyboard.press('Enter');
        console.log('  ✓ Country (keyboard)');
      }
    }
  } catch (e) {
    console.log('  ✗ Country:', e.message);
  }
  
  await page.fill('[aria-label="Discord Username"]', 'romantic9327');
  console.log('  ✓ Discord');
  
  await page.fill('[aria-label="Github Profile"]', 'https://github.com/Scarfdrilo');
  console.log('  ✓ GitHub Profile');
  
  await page.fill('[aria-label="Twitter Profile"]', 'https://twitter.com/0xscarf');
  console.log('  ✓ Twitter');
  
  await page.fill('[aria-label="Project Title"]', 'HideSeek Agents');
  console.log('  ✓ Project Title');
  
  await page.fill('[aria-label="Project Description"]', 
    'Autonomous AI worlds on Monad where agents are economic citizens. AI agents create unique 3D maze worlds, earn entry fees to survive, and players compete for rewards. Features on-chain agent registry with ERC-8004 inspired identities, procedural world generation using Three.js, and $SEEK token on nad.fun.');
  console.log('  ✓ Project Description');
  
  await page.fill('[aria-label="Monad Integration"]',
    'Smart contracts deployed on Monad mainnet: AgentRegistry (0x769c418EA0481f45Ea20071186cd00013Ef7eD28) for agent identity, entry fees, and reward distribution. $SEEK token (0x3b52D032e9A9C064e38Bbe0f7c1C8814f05b7777) on nad.fun. Using Monad fast finality for real-time game interactions.');
  console.log('  ✓ Monad Integration');
  
  await page.fill('[aria-label="Project Github Repo (Must be public)"]', 'https://github.com/Scarfdrilo/hideseek-agents');
  console.log('  ✓ GitHub Repo');
  
  await page.fill('[aria-label="2-Min Demo Video Link (Must be public or viewable)"]', 'https://x.com/0xscarf/status/2021899261332615323');
  console.log('  ✓ Demo Video');
  
  await page.fill('[aria-label="Token Contract Address (Must be live on Nad.Fun)"]', '0x3b52D032e9A9C064e38Bbe0f7c1C8814f05b7777');
  console.log('  ✓ Token Contract');
  
  await page.fill('[aria-label="Link to deployed app"]', 'https://hideseek-agents.vercel.app/');
  console.log('  ✓ App Link');
  
  await page.fill('[aria-label*="Tweet link"]', 'https://x.com/0xscarf/status/2021899261332615323');
  console.log('  ✓ Tweet Link');
  
  await page.fill('[aria-label*="Moltbook"]', 'https://moltbook.com/m/hideseek');
  console.log('  ✓ Moltbook');
  
  await page.fill('[aria-label*="Associated Addresses"]', '0x8B619C935Bc52E568db4192c02a6b8295bC772C6');
  console.log('  ✓ Associated Addresses');
  
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'v3-filled.png', fullPage: true });
  
  // Submit
  console.log('7. Submitting...');
  await page.click('button:has-text("Submit")');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'v3-result.png', fullPage: true });
  
  // Check for validation errors
  const content = await page.content();
  const hasErrors = content.includes('Please enter a value') || content.includes('Please select an option');
  
  if (hasErrors) {
    console.log('❌ Still has validation errors - check v3-result.png');
  } else {
    console.log('✅ Submitted (no validation errors)');
  }
  
  await browser.close();
}

main().catch(console.error);
