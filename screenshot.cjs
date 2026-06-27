const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
  const page = await browser.newPage();
  
  // Set viewport to mobile size
  await page.setViewport({
    width: 390,
    height: 844,
    isMobile: true,
    hasTouch: true,
  });

  await page.goto('http://localhost:5174', { waitUntil: 'networkidle2' });
  
  // Wait for login form
  try {
    await page.waitForSelector('input[type="email"]', { timeout: 3000 });
    // Login flow
    await page.type('input[type="email"]', 'admin@amslogistics.co.th');
    await page.type('input[type="password"]', 'Password1234%');
    await page.click('button[type="submit"]');
    
    // Wait for login to complete and dashboard to load
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
  } catch (e) {
    console.log('Already logged in or login form not found');
  }

  // Wait a bit more for data and animations
  await new Promise(r => setTimeout(r, 2000)); 

  // Navigate to create shipment page
  await page.goto('http://localhost:5174/admin/create-shipment', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  // Click on the '3. ยืนยัน' button (Confirm step)
  try {
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('3. ยืนยัน')) {
        await btn.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1000));
  } catch (e) {
    console.log('Could not click on step 3', e);
  }

  const outputPath = 'C:/Users/pc-game/.gemini/antigravity/brain/c9532dab-9cf2-450d-b9bf-e6f9f50af021/mobile_screenshot.png';
  await page.screenshot({path: outputPath, fullPage: true});
  
  await browser.close();
  console.log('Screenshot saved to', outputPath);
})();
