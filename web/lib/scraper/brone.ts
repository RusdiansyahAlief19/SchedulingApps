import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export async function scrapeBroneSchedule(nim: string, password: string) {
  let browser = null;
  try {
    // Check if running on Vercel or locally
    const isProduction = process.env.NODE_ENV === 'production';
    
    // In production (Vercel), use sparticuz/chromium
    // Locally, use the standard puppeteer package (requires npm install puppeteer locally)
    const executablePath = isProduction 
      ? await chromium.executablePath()
      : undefined; // Puppeteer will use its bundled Chromium locally
      
    // Dynamically import standard puppeteer for local dev if not production
    const puppeteerModule = isProduction ? puppeteer : (await import('puppeteer')).default;

    browser = await puppeteerModule.launch({
      args: isProduction ? chromium.args : [],
      defaultViewport: chromium.defaultViewport,
      executablePath: executablePath,
      headless: isProduction ? chromium.headless : true,
    });

    const page = await browser.newPage();
    
    // 1. Pergi ke halaman login Brone
    await page.goto('https://brone.ub.ac.id/login/index.php', { waitUntil: 'networkidle2' });

    // 2. Isi form login (Moodle standard menggunakan #username dan #password)
    await page.type('#username', nim);
    await page.type('#password', password);
    
    // 3. Klik tombol login dan tunggu navigasi
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.click('#loginbtn')
    ]);

    // Cek apakah login gagal (masih di halaman login)
    if (page.url().includes('login/index.php')) {
      throw new Error('Login Brone gagal. Periksa NIM dan Password.');
    }

    // 4. Kita berada di Dashboard. Tunggu block_myoverview selesai memuat kelas-kelasnya.
    // Moodle menggunakan AJAX untuk memuat kelas di dashboard, kita tunggu selektor course-nya muncul.
    try {
      await page.waitForSelector('.coursename, .course-listitem, .dashboard-card', { timeout: 10000 });
    } catch (e) {
      console.log("No courses found or timed out waiting for course list.");
      return [];
    }

    // 5. Ekstrak data mata kuliah
    const courses = await page.evaluate(() => {
      const results: { name: string, url: string }[] = [];
      
      // Moodle course lists usually have .coursename or similar elements
      const courseElements = document.querySelectorAll('.coursename, .dashboard-card .card-title, .course-title');
      
      courseElements.forEach(el => {
        const text = el.textContent?.trim() || '';
        const linkEl = el.closest('a') || el.querySelector('a');
        const url = linkEl ? linkEl.href : '';
        
        if (text) {
          results.push({ name: text, url });
        }
      });
      
      return results;
    });

    return courses;

  } catch (error) {
    console.error('Scraping error:', error);
    throw error;
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
}
