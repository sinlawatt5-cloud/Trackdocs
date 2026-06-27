const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
  const page = await browser.newPage();
  
  // Login first
  await page.setViewport({ width: 390, height: 844 }); // Mobile Viewport
  console.log('Navigating to login page...');
  await page.goto('http://localhost:5174', {waitUntil: 'networkidle2'});
  
  console.log('Filling in credentials...');
  await page.type('input[type="email"]', 'admin@amslogistics.co.th');
  await page.type('input[type="password"]', 'Password1234%');
  
  console.log('Clicking login button...');
  await page.click('button[type="submit"]');
  
  console.log('Waiting for UI to update...');
  await new Promise(r => setTimeout(r, 4000));

  // Screenshot Mobile
  const mobilePath = 'C:/Users/pc-game/.gemini/antigravity/brain/c9532dab-9cf2-450d-b9bf-e6f9f50af021/screenshot_mobile.png';
  await page.screenshot({path: mobilePath, fullPage: true});
  console.log('Mobile screenshot saved to', mobilePath);

  // Set Viewport to Tablet
  await page.setViewport({ width: 820, height: 1180 });
  await new Promise(r => setTimeout(r, 2000)); // wait for reflow
  
  // Screenshot Tablet
  const tabletPath = 'C:/Users/pc-game/.gemini/antigravity/brain/c9532dab-9cf2-450d-b9bf-e6f9f50af021/screenshot_tablet.png';
  await page.screenshot({path: tabletPath, fullPage: true});
  console.log('Tablet screenshot saved to', tabletPath);

  await browser.close();
})();
