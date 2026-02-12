const { chromium } = require('playwright');
const path = require('path');

async function recordDemo() {
  console.log('Launching browser...');
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: path.join(__dirname, '../videos'),
      size: { width: 1280, height: 720 }
    }
  });
  
  const page = await context.newPage();
  
  console.log('Loading HideSeek...');
  await page.goto('https://hideseek-agents.vercel.app/', { waitUntil: 'networkidle', timeout: 60000 });
  
  // Wait for 3D to load
  await page.waitForTimeout(3000);
  console.log('Page loaded, recording...');
  
  // Scroll to show the maze
  await page.evaluate(() => window.scrollTo(0, 300));
  await page.waitForTimeout(2000);
  
  // Try to interact with the maze if possible
  await page.mouse.move(640, 400);
  await page.waitForTimeout(1000);
  
  // Click around to show interactivity
  await page.mouse.click(640, 400);
  await page.waitForTimeout(1000);
  
  // Scroll down to show agents
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(2000);
  
  // Scroll to bottom
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(2000);
  
  // Back to top
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(2000);
  
  console.log('Recording complete, saving...');
  
  await context.close();
  await browser.close();
  
  console.log('Video saved to videos/');
}

recordDemo().catch(console.error);
