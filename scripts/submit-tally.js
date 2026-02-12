#!/usr/bin/env node
// Submit HideSeek to Moltiverse Tally form

const { chromium } = require('playwright');

async function submitForm() {
  console.log('🚀 Starting Tally submission...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('https://forms.moltiverse.dev/submit', { waitUntil: 'networkidle' });
    console.log('📄 Form loaded');
    await page.waitForTimeout(2000);
    
    // 1. Team Name
    console.log('Filling Team Name...');
    await page.fill('input[aria-label="Team Name"]', 'HideSeek Agents');
    
    // 2. Team size = 1
    console.log('Selecting Team size = 1...');
    await page.click('input#choice_f4b8fb52-23b5-492c-b82b-191a70b8be64'); // First radio (1)
    
    // 3. Track = Agent + Token
    console.log('Selecting Track = Agent + Token...');
    await page.click('input#choice_a0b02c15-667a-423b-86f3-1be9b9c349b5'); // First track option
    
    // 4. Agree checkbox
    console.log('Checking I agree...');
    await page.click('input#checkbox_ba9f55f9-fa79-4cdb-89ab-94f9f16d315e');
    
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'submit-form-filled.png', fullPage: true });
    console.log('📸 Screenshot: submit-form-filled.png');
    
    // 5. Click Submit
    console.log('Clicking Submit...');
    await page.click('button:has-text("Submit")');
    
    // Wait for response/redirect
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'submit-form-result.png', fullPage: true });
    console.log('📸 Screenshot: submit-form-result.png');
    
    // Check for success
    const url = page.url();
    const content = await page.content();
    
    if (content.includes('Thank') || content.includes('success') || content.includes('submitted')) {
      console.log('✅ SUBMITTED SUCCESSFULLY!');
    } else {
      console.log('⚠️ Status unclear - check screenshot');
      console.log('Current URL:', url);
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
