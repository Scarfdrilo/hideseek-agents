#!/usr/bin/env node
/**
 * Connect to nad.fun with wallet and explore token settings
 */

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
  if (!fs.existsSync(videosDir)) fs.mkdirSync(videosDir, { recursive: true });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: { dir: videosDir, size: { width: 1280, height: 800 } }
  });

  const page = await context.newPage();
  
  // Expose signing function
  await page.exposeFunction('__signPersonal', async (message) => {
    console.log('📝 Signing...');
    return await wallet.signMessage(message);
  });

  // Inject ethereum provider
  await context.addInitScript(`
    const WALLET_ADDRESS = '${wallet.address}';
    
    window.ethereum = {
      isMetaMask: true,
      selectedAddress: WALLET_ADDRESS,
      chainId: '0x8f',
      networkVersion: '143',
      _events: {},
      
      request: async function({ method, params }) {
        console.log('[ETH]', method);
        
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
          case 'eth_signTypedData_v4': {
            const data = JSON.parse(params[1]);
            return await window.__signPersonal(JSON.stringify(data.message || data));
          }
          case 'eth_getBalance':
            return '0x8AC7230489E80000';
          default:
            return null;
        }
      },
      on: function(e, h) { this._events[e] = this._events[e] || []; this._events[e].push(h); },
      removeListener: function() {},
      emit: function(e, ...a) { if(this._events[e]) this._events[e].forEach(h => h(...a)); }
    };
    window.web3 = { currentProvider: window.ethereum };
  `);

  try {
    // First go to homepage to accept ToS
    console.log('📍 Going to nad.fun...');
    await page.goto('https://nad.fun', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);
    
    // Click Connect if visible
    const connectBtn = page.locator('button:has-text("Connect")').first();
    if (await connectBtn.isVisible().catch(() => false)) {
      console.log('🔗 Connecting wallet...');
      await connectBtn.click();
      await page.waitForTimeout(5000);
    }
    
    // Accept ToS if modal appears
    const agreeBtn = page.locator('button:has-text("Agree and Continue"), button:has-text("Agree")').first();
    if (await agreeBtn.isVisible().catch(() => false)) {
      console.log('✅ Accepting ToS...');
      await agreeBtn.click();
      await page.waitForTimeout(2000);
    }
    
    await page.screenshot({ path: path.join(videosDir, '01-homepage.png') });
    
    // Now navigate to the token page
    console.log('📄 Going to $SEEK token page...');
    await page.goto(`https://nad.fun/token/${SEEK_TOKEN}`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);
    
    // Accept ToS again if it shows
    if (await agreeBtn.isVisible().catch(() => false)) {
      await agreeBtn.click();
      await page.waitForTimeout(2000);
    }
    
    await page.screenshot({ path: path.join(videosDir, '02-token-page.png') });
    
    // Look for settings/edit button (as creator)
    console.log('🔧 Looking for token settings...');
    
    // Check for any edit/settings icons near the token info
    const settingsBtn = page.locator('button:has(svg[class*="settings"]), button:has(svg[class*="edit"]), button[aria-label*="edit"], button[aria-label*="settings"], [class*="edit"]').first();
    
    if (await settingsBtn.isVisible().catch(() => false)) {
      console.log('Found settings button!');
      await settingsBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(videosDir, '03-settings.png') });
    }
    
    // Look for three-dot menu
    const menuBtn = page.locator('button:has(svg[class*="dots"]), button:has(svg[class*="more"]), [class*="menu-trigger"]').first();
    if (await menuBtn.isVisible().catch(() => false)) {
      console.log('Found menu button!');
      await menuBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(videosDir, '03-menu.png') });
    }
    
    // Scroll down to see all options
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(videosDir, '04-scrolled.png') });
    
    // Check for Moltiverse/hackathon related elements
    const content = await page.content();
    const hasHackathon = content.toLowerCase().includes('hackathon');
    const hasMoltiverse = content.toLowerCase().includes('moltiverse');
    const hasJoin = content.toLowerCase().includes('join');
    
    console.log(`📊 Page scan: hackathon=${hasHackathon}, moltiverse=${hasMoltiverse}, join=${hasJoin}`);
    
    // Take full page screenshot
    await page.screenshot({ path: path.join(videosDir, '05-final.png'), fullPage: true });
    
    // Check Moltiverse tab to see if our token appears there
    console.log('🔍 Checking Moltiverse section...');
    await page.goto('https://nad.fun', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    // Click Moltiverse in nav
    const moltNav = page.locator('a:has-text("Moltiverse"), button:has-text("Moltiverse"), nav >> text=Moltiverse').first();
    if (await moltNav.isVisible()) {
      await moltNav.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: path.join(videosDir, '06-moltiverse.png') });
      
      // Scroll to see tokens
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(videosDir, '07-moltiverse-scroll.png') });
    }
    
    console.log('✅ Exploration complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: path.join(videosDir, 'error.png') }).catch(() => {});
  }

  const videoPath = await page.video().path();
  await page.close();
  await context.close();
  await browser.close();
  
  const finalVideo = path.join(videosDir, 'nadfun-exploration.webm');
  if (fs.existsSync(videoPath)) {
    fs.renameSync(videoPath, finalVideo);
    const size = (fs.statSync(finalVideo).size / 1024 / 1024).toFixed(2);
    console.log(`📹 Video: ${finalVideo} (${size} MB)`);
  }
  
  // List screenshots
  const screenshots = fs.readdirSync(videosDir).filter(f => f.endsWith('.png'));
  console.log(`📸 Screenshots: ${screenshots.join(', ')}`);
  
  console.log('🎬 Done!');
}

main().catch(console.error);
