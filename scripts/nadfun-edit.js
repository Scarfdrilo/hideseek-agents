#!/usr/bin/env node
const { chromium } = require('playwright');
const { Wallet } = require('ethers');
const path = require('path');
const fs = require('fs');

const PRIVATE_KEY = '0x7ae86bad4547897767b4eff9e92811dd069a064dbe0e1d6522b1ef33fd316a5e';
const SEEK_TOKEN = '0x3b52D032e9A9C064e38Bbe0f7c1C8814f05b7777';

async function main() {
  const wallet = new Wallet(PRIVATE_KEY);
  console.log(`🔑 Wallet: ${wallet.address}`);
  
  const browser = await chromium.launch({ headless: true });
  const videosDir = path.join(__dirname, '../videos');
  fs.mkdirSync(videosDir, { recursive: true });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    recordVideo: { dir: videosDir, size: { width: 1280, height: 900 } }
  });

  const page = await context.newPage();
  
  await page.exposeFunction('__signPersonal', async (message) => {
    console.log('📝 Signing...');
    return await wallet.signMessage(message);
  });

  await context.addInitScript(`
    const WALLET_ADDRESS = '${wallet.address}';
    window.ethereum = {
      isMetaMask: true,
      selectedAddress: WALLET_ADDRESS,
      chainId: '0x8f',
      networkVersion: '143',
      _events: {},
      request: async function({ method, params }) {
        switch(method) {
          case 'eth_requestAccounts':
          case 'eth_accounts':
            return [WALLET_ADDRESS];
          case 'eth_chainId':
            return '0x8f';
          case 'net_version':
            return '143';
          case 'wallet_switchEthereumChain':
            return null;
          case 'personal_sign': {
            const message = params[0];
            let msgToSign = message;
            if (message.startsWith('0x')) {
              try {
                msgToSign = new TextDecoder().decode(
                  new Uint8Array(message.slice(2).match(/.{1,2}/g).map(byte => parseInt(byte, 16)))
                );
              } catch(e) { msgToSign = message; }
            }
            return await window.__signPersonal(msgToSign);
          }
          case 'eth_getBalance':
            return '0x8AC7230489E80000';
          default:
            return null;
        }
      },
      on: function(e, h) { this._events[e] = this._events[e] || []; this._events[e].push(h); },
      removeListener: function() {},
    };
    window.web3 = { currentProvider: window.ethereum };
  `);

  try {
    // Go directly to working URL
    console.log('📄 Going to $SEEK token page (correct URL)...');
    await page.goto(`https://nad.fun/tokens/${SEEK_TOKEN}`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);
    
    // Connect and accept ToS if needed
    const connectBtn = page.locator('button:has-text("Connect")').first();
    if (await connectBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await connectBtn.click({ force: true });
      await page.waitForTimeout(3000);
    }
    
    const agreeBtn = page.locator('button:has-text("Agree and Continue")');
    if (await agreeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await agreeBtn.click({ force: true });
      await page.waitForTimeout(2000);
    }
    await page.keyboard.press('Escape');
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(videosDir, 'edit1-loaded.png') });
    console.log('📸 Page loaded');
    
    // Scroll down to see all content
    console.log('📜 Scrolling to see all options...');
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(videosDir, 'edit2-scroll1.png') });
    
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(videosDir, 'edit3-scroll2.png') });
    
    // Scroll back up
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);
    
    // Look for edit or settings elements
    console.log('🔍 Looking for edit options...');
    
    const pageText = await page.textContent('body');
    console.log(`Page contains "Edit": ${pageText.includes('Edit')}`);
    console.log(`Page contains "Settings": ${pageText.includes('Settings')}`);
    console.log(`Page contains "Moltiverse": ${pageText.includes('Moltiverse')}`);
    console.log(`Page contains "Join": ${pageText.includes('Join')}`);
    console.log(`Page contains "hackathon": ${pageText.toLowerCase().includes('hackathon')}`);
    
    // Try to find and click on the creator address or info section
    const creatorSection = page.locator('text=0x8B619, [class*="creator"], [class*="info"]').first();
    if (await creatorSection.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('Found creator section');
      await creatorSection.click({ force: true });
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(videosDir, 'edit4-creator.png') });
    }
    
    // Look for any buttons near the token info
    const infoButtons = page.locator('button').all();
    const buttonTexts = [];
    for (const btn of await infoButtons) {
      const text = await btn.textContent().catch(() => '');
      if (text) buttonTexts.push(text.trim());
    }
    console.log(`Buttons on page: ${buttonTexts.slice(0, 10).join(', ')}`);
    
    // Try clicking Share button to see options
    const shareBtn = page.locator('button:has-text("Share")').first();
    if (await shareBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('Clicking Share...');
      await shareBtn.click({ force: true });
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(videosDir, 'edit5-share.png') });
      await page.keyboard.press('Escape');
    }
    
    // Look for hamburger menu
    const menuBtn = page.locator('button svg, [class*="menu"]').first();
    if (await menuBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('Clicking menu...');
      await menuBtn.click({ force: true });
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(videosDir, 'edit6-menu.png') });
    }
    
    // Take full page screenshot
    await page.screenshot({ path: path.join(videosDir, 'edit-final.png'), fullPage: true });
    console.log('📸 Final screenshot');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: path.join(videosDir, 'error.png') }).catch(() => {});
  }

  const videoPath = await page.video().path();
  await page.close();
  await context.close();
  await browser.close();
  
  const finalVideo = path.join(videosDir, 'seek-edit.webm');
  if (fs.existsSync(videoPath)) {
    fs.renameSync(videoPath, finalVideo);
    console.log(`\n📹 Video: ${finalVideo}`);
  }
  
  const screenshots = fs.readdirSync(videosDir).filter(f => f.endsWith('.png') && f.startsWith('edit'));
  console.log(`📸 Screenshots: ${screenshots.join(', ')}`);
}

main().catch(console.error);
