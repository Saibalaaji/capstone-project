const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    } else {
        console.log('BROWSER LOG:', msg.text());
    }
  });

  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.toString());
  });

  console.log('Navigating to http://localhost:5173/admin...');
  await page.goto('http://localhost:5173/admin', { waitUntil: 'networkidle2' });

  console.log('Waiting 2 seconds to absorb async errors...');
  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
})();
