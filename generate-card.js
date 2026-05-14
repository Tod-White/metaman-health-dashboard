const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });
  
  await page.goto('https://dashboard-metadoge.vercel.app', {
    waitUntil: 'networkidle0',
    timeout: 30000
  });
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // 等待图表渲染完成
  await page.waitForSelector('canvas#progressChart', { timeout: 10000 });
  await page.evaluate(() => {
    return new Promise(resolve => {
      if (window.Chart && window.Chart.instances && window.Chart.instances.length > 0) {
        setTimeout(resolve, 1000);
      } else {
        setTimeout(resolve, 3000);
      }
    });
  });
  
  const card = await page.$('.chart-section');
  if (card) {
    await card.screenshot({ path: '/root/health-dashboard/康复轨迹.png' });
    console.log('Card generated: /root/health-dashboard/康复轨迹.png');
  } else {
    console.error('Card element not found');
  }
  
  await browser.close();
})();
