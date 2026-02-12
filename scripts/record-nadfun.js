#!/usr/bin/env node
/**
 * Record nad.fun $SEEK token page
 * Uses Playwright's built-in video recording
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SEEK_TOKEN = '0x3b52D032e9A9C064e38Bbe0f7c1C8814f05b7777';
const OUTPUT_DIR = path.join(__dirname, '../videos');

async function recordNadFun() {
  console.log('🎬 Starting recording...');
  
  // Ensure output dir exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: OUTPUT_DIR,
      size: { width: 1280, height: 720 }
    }
  });

  const page = await context.newPage();

  try {
    // Go directly to SEEK token page
    console.log('📄 Going to $SEEK token page...');
    await page.goto(`https://nad.fun/token/${SEEK_TOKEN}`, { 
      waitUntil: 'networkidle', 
      timeout: 60000 
    });
    await page.waitForTimeout(3000);

    // Scroll down slowly to show content
    console.log('📜 Scrolling to show content...');
    for (let i = 0; i < 4; i++) {
      await page.mouse.wheel(0, 250);
      await page.waitForTimeout(800);
    }

    // Wait a bit at the bottom
    await page.waitForTimeout(1500);

    // Scroll back up smoothly
    console.log('⬆️ Scrolling back up...');
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await page.waitForTimeout(2000);

    // Take a screenshot too
    const screenshotPath = path.join(OUTPUT_DIR, 'seek-token.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`📸 Screenshot saved: ${screenshotPath}`);

    // Now go to nad.fun homepage and show Moltiverse tab
    console.log('🏠 Going to nad.fun homepage...');
    await page.goto('https://nad.fun', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);

    // Click Moltiverse tab (use nth to avoid strict mode)
    console.log('🔍 Clicking Moltiverse tab...');
    const moltiverseTab = page.locator('[id*="moltiverse"], button:has-text("Moltiverse")').first();
    try {
      await moltiverseTab.click({ timeout: 5000 });
      await page.waitForTimeout(3000);
    } catch (e) {
      console.log('Could not click Moltiverse tab, continuing...');
    }

    // Scroll to show tokens
    for (let i = 0; i < 2; i++) {
      await page.mouse.wheel(0, 200);
      await page.waitForTimeout(600);
    }
    await page.waitForTimeout(1500);

  } catch (error) {
    console.error('Error during recording:', error.message);
  }

  // Close page first to finalize video
  const videoPath = await page.video().path();
  await page.close();
  await context.close();
  await browser.close();

  // Rename to something meaningful
  const finalPath = path.join(OUTPUT_DIR, 'seek-nadfun-demo.webm');
  if (fs.existsSync(videoPath)) {
    fs.renameSync(videoPath, finalPath);
    console.log(`✅ Video saved: ${finalPath}`);
    
    // Get file size
    const stats = fs.statSync(finalPath);
    console.log(`📦 Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  }

  console.log('🎬 Recording complete!');
}

recordNadFun().catch(console.error);
