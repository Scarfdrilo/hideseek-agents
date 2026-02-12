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
    viewport: { width: 1280, height: 800 },
    recordVideo: { dir: videosDir, size: { width: 1280, height: 800 } }
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
    // Go to homepage
    console.log('🏠 Going to nad.fun...');
    await page.goto('https://nad.fun', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);
    
    // Connect if needed
    const connectBtn = page.locator('button:has-text("Connect")').first();
    if (await connectBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await connectBtn.click({ force: true });
      await page.waitForTimeout(5000);
    }
    
    // Accept ToS
    const agreeBtn = page.locator('button:has-text("Agree and Continue")');
    if (await agreeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await agreeBtn.click({ force: true });
      await page.waitForTimeout(2000);
    }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: path.join(videosDir, 'step1-home.png') });
    
    // Search for SEEK
    console.log('🔍 Searching for SEEK...');
    
    // Click search icon
    const searchIcon = page.locator('svg[class*="Lucide"], button svg').first();
    await searchIcon.click({ force: true }).catch(() => {});
    await page.waitForTimeout(1000);
    
    // Type in search
    const searchInput = page.locator('input').first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('SEEK');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(3000);
      await page.screenshot({ path: path.join(videosDir, 'step2-search.png') });
      
      // Look for SEEK in results
      const seekLink = page.locator('a[href*="SEEK"], a[href*="${SEEK_TOKEN.toLowerCase()}"], text=HideSeek').first();
      if (await seekLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('✅ Found SEEK! Clicking...');
        await seekLink.click({ force: true });
        await page.waitForTimeout(3000);
      }
    }
    
    // If search didn't work, try direct URL with waiting
    if (!page.url().includes('token')) {
      console.log('📄 Trying direct URL...');
      await page.goto(`https://nad.fun/token/${SEEK_TOKEN}`, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(5000);
      
      // Accept ToS again
      if (await agreeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await agreeBtn.click({ force: true });
        await page.waitForTimeout(2000);
      }
    }
    
    await page.screenshot({ path: path.join(videosDir, 'step3-token.png') });
    console.log(`Current URL: ${page.url()}`);
    
    // Check if we're on token page or 404
    const is404 = await page.textContent('body').then(t => t.includes('404')).catch(() => false);
    console.log(`Is 404: ${is404}`);
    
    if (!is404) {
      // Look for edit button (as creator)
      console.log('🔧 Looking for edit...');
      
      // Check if we see creator options
      const pageText = await page.textContent('body');
      console.log(`Has Edit button: ${pageText.includes('Edit')}`);
      console.log(`Has Settings: ${pageText.includes('Settings')}`);
      
      // Try to find menu
      const menuBtn = page.locator('button svg, [aria-label="More"], [aria-label="menu"]').first();
      if (await menuBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await menuBtn.click({ force: true });
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(videosDir, 'step4-menu.png') });
      }
    } else {
      console.log('❌ Token page shows 404');
      
      // Try alternate URL formats
      const altUrls = [
        `https://nad.fun/token/${SEEK_TOKEN.toLowerCase()}`,
        `https://nad.fun/tokens/${SEEK_TOKEN}`,
        `https://nad.fun/coin/${SEEK_TOKEN}`,
      ];
      
      for (const url of altUrls) {
        console.log(`Trying: ${url}`);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
        await page.waitForTimeout(2000);
        const still404 = await page.textContent('body').then(t => t.includes('404')).catch(() => true);
        if (!still404) {
          console.log('✅ Found working URL!');
          await page.screenshot({ path: path.join(videosDir, 'step5-found.png') });
          break;
        }
      }
    }
    
    await page.screenshot({ path: path.join(videosDir, 'final.png'), fullPage: true });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: path.join(videosDir, 'error.png') }).catch(() => {});
  }

  const videoPath = await page.video().path();
  await page.close();
  await context.close();
  await browser.close();
  
  const finalVideo = path.join(videosDir, 'seek-final.webm');
  if (fs.existsSync(videoPath)) {
    fs.renameSync(videoPath, finalVideo);
    console.log(`\n📹 Video: ${finalVideo}`);
  }
  
  const screenshots = fs.readdirSync(videosDir).filter(f => f.endsWith('.png') && (f.startsWith('step') || f === 'final.png'));
  console.log(`📸 Screenshots: ${screenshots.join(', ')}`);
}

main().catch(console.error);
