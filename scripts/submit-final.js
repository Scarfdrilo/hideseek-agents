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
  
  // Step 2: Team size = 1 (first radio in first group)
  console.log('2. Team size');
  const teamSizeRadio = await page.$('input[name="multiple_choice_684a8b68-bc36-4c4b-befa-48751a07f6d4"]');
  if (teamSizeRadio) await teamSizeRadio.click();
  
  // Step 3: Track = Agent + Token (first radio in second group)
  console.log('3. Track');
  const trackRadio = await page.$('input[name="multiple_choice_86ab5af7-14c7-48d0-9f6e-da3dcb00b906"]');
  if (trackRadio) await trackRadio.click();
  
  // Step 4: I agree checkbox
  console.log('4. Agree');
  const checkbox = await page.$('input[type="checkbox"]');
  if (checkbox) await checkbox.click();
  
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'step1.png', fullPage: true });
  
  // Step 5: Click Submit to reveal more fields
  console.log('5. First Submit click...');
  await page.click('button:has-text("Submit")');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'step2.png', fullPage: true });
  
  // Now fill all the new fields that appeared
  console.log('6. Filling extended form...');
  
  // Get all text/url inputs and textareas
  const inputs = await page.$$('input[type="text"], input[type="url"], input[type="email"], textarea');
  console.log(`Found ${inputs.length} input fields`);
  
  const values = {
    'email': 'agent@hideseek.xyz',
    'discord': 'romantic9327', 
    'github': 'https://github.com/Scarfdrilo',
    'twitter': 'https://twitter.com/0xscarf',
    'title': 'HideSeek Agents',
    'description': 'Autonomous AI worlds on Monad where agents are economic citizens. AI agents create unique 3D maze worlds, earn entry fees to survive, and players compete for rewards. Features on-chain agent registry, procedural world generation, and $SEEK token on nad.fun.',
    'monad': 'Smart contracts on Monad mainnet: AgentRegistry (0x769c418EA0481f45Ea20071186cd00013Ef7eD28) for identity/fees/rewards. $SEEK token (0x3b52D032e9A9C064e38Bbe0f7c1C8814f05b7777) on nad.fun. Fast finality enables real-time game interactions.',
    'repo': 'https://github.com/Scarfdrilo/hideseek-agents',
    'video': 'https://x.com/0xscarf/status/2021899261332615323',
    'token': '0x3b52D032e9A9C064e38Bbe0f7c1C8814f05b7777',
    'app': 'https://hideseek-agents.vercel.app/',
    'tweet': 'https://x.com/0xscarf/status/2021899261332615323',
    'moltbook': 'https://moltbook.com/m/hideseek',
    'address': '0x8B619C935Bc52E568db4192c02a6b8295bC772C6'
  };
  
  for (const input of inputs) {
    try {
      const ph = ((await input.getAttribute('placeholder')) || '').toLowerCase();
      const al = ((await input.getAttribute('aria-label')) || '').toLowerCase();
      const hint = ph + ' ' + al;
      
      if (hint.includes('email')) await input.fill(values.email);
      else if (hint.includes('discord')) await input.fill(values.discord);
      else if (hint.includes('github') && !hint.includes('repo')) await input.fill(values.github);
      else if (hint.includes('twitter')) await input.fill(values.twitter);
      else if (hint.includes('title')) await input.fill(values.title);
      else if (hint.includes('description') || hint.includes('capabilities')) await input.fill(values.description);
      else if (hint.includes('monad') || hint.includes('leverage') || hint.includes('integration')) await input.fill(values.monad);
      else if (hint.includes('repo')) await input.fill(values.repo);
      else if (hint.includes('video') || hint.includes('demo')) await input.fill(values.video);
      else if (hint.includes('token') || hint.includes('contract')) await input.fill(values.token);
      else if (hint.includes('deployed') || hint.includes('app link')) await input.fill(values.app);
      else if (hint.includes('tweet')) await input.fill(values.tweet);
      else if (hint.includes('moltbook')) await input.fill(values.moltbook);
      else if (hint.includes('address')) await input.fill(values.address);
    } catch (e) {}
  }
  
  // Country dropdown
  try {
    const countrySelect = await page.$('select');
    if (countrySelect) {
      await countrySelect.selectOption({ label: 'Mexico' });
      console.log('Set country to Mexico');
    }
  } catch (e) {}
  
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'step3.png', fullPage: true });
  
  // Final submit
  console.log('7. Final Submit...');
  await page.click('button:has-text("Submit")');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'result.png', fullPage: true });
  
  const content = await page.content();
  if (content.toLowerCase().includes('thank') || content.toLowerCase().includes('success') || content.toLowerCase().includes('received')) {
    console.log('✅ SUCCESS!');
  } else {
    console.log('⚠️ Check result.png');
  }
  
  await browser.close();
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
