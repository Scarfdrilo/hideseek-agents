const { chromium } = require('playwright');
const path = require('path');

async function recordDemo() {
  console.log('Recording longer demo...');
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: path.join(__dirname, '../videos'),
      size: { width: 1280, height: 720 }
    }
  });
  
  const page = await context.newPage();
  
  console.log('1/5 Loading app...');
  await page.goto('https://hideseek-agents.vercel.app/', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(4000);
  
  console.log('2/5 Showing hero + maze...');
  // Smooth scroll down
  for (let i = 0; i < 5; i++) {
    await page.evaluate((y) => window.scrollTo({top: y, behavior: 'smooth'}), i * 150);
    await page.waitForTimeout(800);
  }
  
  console.log('3/5 Interacting with 3D...');
  // Move mouse around the maze area
  for (let i = 0; i < 3; i++) {
    await page.mouse.move(400 + i*150, 350);
    await page.waitForTimeout(500);
  }
  await page.waitForTimeout(2000);
  
  console.log('4/5 Showing agents section...');
  await page.evaluate(() => window.scrollTo({top: 800, behavior: 'smooth'}));
  await page.waitForTimeout(3000);
  
  console.log('5/5 Full page tour...');
  await page.evaluate(() => window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'}));
  await page.waitForTimeout(3000);
  
  // Back to top
  await page.evaluate(() => window.scrollTo({top: 0, behavior: 'smooth'}));
  await page.waitForTimeout(3000);
  
  console.log('Done!');
  await context.close();
  await browser.close();
}

recordDemo().catch(console.error);
