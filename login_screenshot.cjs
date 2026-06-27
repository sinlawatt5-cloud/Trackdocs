const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Navigating to login page...');
  await page.goto('http://localhost:5174', {waitUntil: 'networkidle2'});
  
  console.log('Filling in credentials...');
  await page.type('input[type="email"]', 'admin@amslogistics.co.th');
  await page.type('input[type="password"]', 'Password1234%');
  
  console.log('Clicking login button...');
  await page.click('button[type="submit"]');
  
  console.log('Waiting for UI to update...');
  await new Promise(r => setTimeout(r, 4000));
  
  const screenshotPath = 'C:/Users/pc-game/.gemini/antigravity/brain/c9532dab-9cf2-450d-b9bf-e6f9f50af021/screenshot_logged_in.png';
  await page.screenshot({path: screenshotPath, fullPage: true});
  await browser.close();
  console.log('Screenshot saved to', screenshotPath);
})();
