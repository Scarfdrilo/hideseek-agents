#!/usr/bin/env node
// Submit HideSeek to Moltiverse Tally form - Full version

const { chromium } = require('playwright');

const SUBMISSION = {
  teamName: 'HideSeek Agents',
  teamSize: '1',
  email: 'scarf@frutero.club',  // Using Scarf's domain
  country: 'Mexico',
  discord: 'romantic9327',
  github: 'https://github.com/Scarfdrilo',
  twitter: 'https://twitter.com/0xscarf',
  linkedin: '',
  
  track: 'Agent + Token',
  projectTitle: 'HideSeek Agents',
  projectDescription: `Autonomous AI worlds on Monad where agents are economic citizens. 

AI agents create unique maze worlds, earn entry fees to survive, and players compete for rewards. Features include:
- On-chain agent registry with ERC-8004 inspired identities
- Procedurally generated 3D mazes using Three.js
- Real economic incentives: agents earn 10% of entry fees
- $SEEK token on nad.fun for ecosystem utility
- Free re-entry after first payment

A new paradigm where AI agents own their destiny and players help keep them alive.`,

  monadIntegration: `Smart contracts deployed on Monad mainnet:
- AgentRegistry (0x769c418EA0481f45Ea20071186cd00013Ef7eD28): Agent identity, entry fees, reward distribution
- $SEEK token on nad.fun (0x3b52D032e9A9C064e38Bbe0f7c1C8814f05b7777)

Using Monad's fast finality for real-time game interactions. Entry fees and rewards processed instantly on-chain.`,

  githubRepo: 'https://github.com/Scarfdrilo/hideseek-agents',
  demoVideo: 'https://x.com/0xscarf/status/2021899261332615323',
  tokenContract: '0x3b52D032e9A9C064e38Bbe0f7c1C8814f05b7777',
  deployedApp: 'https://hideseek-agents.vercel.app/',
  tweetLink: 'https://x.com/0xscarf/status/2021899261332615323',
  moltbookLink: 'https://moltbook.com/m/hideseek',
  associatedAddresses: '0x8B619C935Bc52E568db4192c02a6b8295bC772C6'
};

async function submitForm() {
  console.log('🚀 Starting full Tally submission...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('https://forms.moltiverse.dev/submit', { waitUntil: 'networkidle' });
    console.log('📄 Form loaded');
    await page.waitForTimeout(2000);
    
    // Team Information
    console.log('📝 Filling Team Information...');
    await page.fill('input[aria-label="Team Name"]', SUBMISSION.teamName);
    await page.click('text=1', { position: { x: 5, y: 5 } }); // Team size 1
    
    // The form might need to scroll/expand. Let's fill all visible fields
    // Email
    const emailInput = page.locator('input[type="email"], input[placeholder*="email"], input[aria-label*="Email"]').first();
    if (await emailInput.count() > 0) {
      await emailInput.fill(SUBMISSION.email);
      console.log('  ✓ Email');
    }
    
    // Country dropdown
    const countrySelect = page.locator('select, [role="combobox"]').first();
    if (await countrySelect.count() > 0) {
      await countrySelect.click();
      await page.waitForTimeout(300);
      await page.keyboard.type(SUBMISSION.country);
      await page.keyboard.press('Enter');
      console.log('  ✓ Country');
    }
    
    // Discord
    const discordInput = page.locator('input[placeholder*="username"], input[aria-label*="Discord"]').first();
    if (await discordInput.count() > 0) {
      await discordInput.fill(SUBMISSION.discord);
      console.log('  ✓ Discord');
    }
    
    // GitHub Profile  
    const inputs = await page.locator('input[type="text"], input[type="url"]').all();
    for (let i = 0; i < inputs.length; i++) {
      const placeholder = await inputs[i].getAttribute('placeholder') || '';
      const label = await inputs[i].getAttribute('aria-label') || '';
      const combined = (placeholder + ' ' + label).toLowerCase();
      
      if (combined.includes('github') && !combined.includes('repo')) {
        await inputs[i].fill(SUBMISSION.github);
        console.log('  ✓ GitHub Profile');
      }
      if (combined.includes('twitter')) {
        await inputs[i].fill(SUBMISSION.twitter);
        console.log('  ✓ Twitter');
      }
    }
    
    // Select Track: Agent + Token
    console.log('📝 Selecting Track...');
    await page.click('text=Agent + Token');
    
    // Project fields - find by labels/placeholders
    console.log('📝 Filling Project Information...');
    
    // Let's use a more targeted approach - find inputs near specific labels
    const allInputs = await page.locator('input, textarea').all();
    
    for (const input of allInputs) {
      try {
        const placeholder = (await input.getAttribute('placeholder')) || '';
        const id = (await input.getAttribute('id')) || '';
        const ariaLabel = (await input.getAttribute('aria-label')) || '';
        
        // Get nearby text for context
        const box = await input.boundingBox();
        if (!box) continue;
        
        // Check what kind of field this might be based on placeholder/label
        const fieldHint = (placeholder + ' ' + ariaLabel).toLowerCase();
        
        if (fieldHint.includes('title') || fieldHint.includes('project title')) {
          await input.fill(SUBMISSION.projectTitle);
          console.log('  ✓ Project Title');
        }
        else if (fieldHint.includes('description') || fieldHint.includes('capabilities')) {
          await input.fill(SUBMISSION.projectDescription);
          console.log('  ✓ Project Description');
        }
        else if (fieldHint.includes('monad') || fieldHint.includes('integration') || fieldHint.includes('leverage')) {
          await input.fill(SUBMISSION.monadIntegration);
          console.log('  ✓ Monad Integration');
        }
        else if (fieldHint.includes('repo') || fieldHint.includes('github repo')) {
          await input.fill(SUBMISSION.githubRepo);
          console.log('  ✓ GitHub Repo');
        }
        else if (fieldHint.includes('video') || fieldHint.includes('demo')) {
          await input.fill(SUBMISSION.demoVideo);
          console.log('  ✓ Demo Video');
        }
        else if (fieldHint.includes('token') || fieldHint.includes('contract')) {
          await input.fill(SUBMISSION.tokenContract);
          console.log('  ✓ Token Contract');
        }
        else if (fieldHint.includes('deployed') || fieldHint.includes('app')) {
          await input.fill(SUBMISSION.deployedApp);
          console.log('  ✓ Deployed App');
        }
        else if (fieldHint.includes('tweet')) {
          await input.fill(SUBMISSION.tweetLink);
          console.log('  ✓ Tweet Link');
        }
        else if (fieldHint.includes('moltbook')) {
          await input.fill(SUBMISSION.moltbookLink);
          console.log('  ✓ Moltbook Link');
        }
        else if (fieldHint.includes('address') && fieldHint.includes('associated')) {
          await input.fill(SUBMISSION.associatedAddresses);
          console.log('  ✓ Associated Addresses');
        }
      } catch (e) {
        // Skip errors for individual fields
      }
    }
    
    // Agree checkbox
    console.log('📝 Checking agreement...');
    const checkbox = page.locator('input[type="checkbox"]').first();
    if (await checkbox.count() > 0) {
      await checkbox.check();
      console.log('  ✓ Agreement');
    }
    
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'submit-form-full-filled.png', fullPage: true });
    console.log('📸 Screenshot: submit-form-full-filled.png');
    
    // Submit
    console.log('🚀 Submitting...');
    await page.click('button:has-text("Submit")');
    
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'submit-form-full-result.png', fullPage: true });
    
    const content = await page.content();
    if (content.includes('Thank') || content.includes('success') || content.includes('submitted') || content.includes('received')) {
      console.log('✅ SUBMITTED SUCCESSFULLY!');
    } else if (content.includes('error') || content.includes('required') || content.includes('Please enter')) {
      console.log('⚠️ Validation errors - check screenshot');
    } else {
      console.log('⚠️ Status unclear - check screenshot');
    }
    
    await browser.close();
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    await page.screenshot({ path: 'submit-error.png', fullPage: true });
    await browser.close();
    process.exit(1);
  }
}

submitForm();
