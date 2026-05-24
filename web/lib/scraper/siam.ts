import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export async function scrapeSiamSchedule(nim: string, password: string) {
  let browser = null;
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    const executablePath = isProduction 
      ? await chromium.executablePath()
      : undefined;
      
    const puppeteerModule = isProduction ? puppeteer : (await import('puppeteer')).default;

    browser = await puppeteerModule.launch({
      args: isProduction ? chromium.args : [],
      defaultViewport: chromium.defaultViewport,
      executablePath: executablePath,
      headless: isProduction ? chromium.headless : true,
    });

    const page = await browser.newPage();
    
    // 1. Pergi ke SIAM
    await page.goto('https://siam.ub.ac.id/', { waitUntil: 'networkidle2' });

    // Jika belum login, biasanya akan diarahkan ke sso / iam.ub.ac.id
    if (page.url().includes('iam.ub.ac.id')) {
      await page.waitForSelector('#username');
      await page.type('#username', nim);
      await page.type('#password', password);
      
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
        page.click('input[name="login"], #kc-login, button[type="submit"]')
      ]);
    }

    if (page.url().includes('iam.ub.ac.id')) {
      throw new Error('Login SIAM gagal. Periksa NIM dan Password.');
    }

    // 2. Tunggu jadwal dimuat di tabel
    try {
      await page.waitForSelector('table.table-bordered', { timeout: 15000 });
    } catch (e) {
      console.log("Timed out waiting for schedule table.");
      return [];
    }

    // 3. Ekstrak data jadwal
    const schedules = await page.evaluate(() => {
      const results: any[] = [];
      const rows = document.querySelectorAll('table.table-bordered tbody tr');
      
      const hariMap: Record<string, number> = {
        'Minggu': 0, 'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4, 'Jumat': 5, 'Sabtu': 6
      };

      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 6) {
          const hariText = cells[0].textContent?.trim() || '';
          const jamText = cells[1].textContent?.trim() || ''; // e.g., "08:00 - 09:40"
          const mkText = cells[2].textContent?.trim() || ''; // e.g., "(KODE) Nama MK"
          const kelas = cells[3].textContent?.trim() || '';
          const dosen = cells[4].textContent?.trim() || '';
          const ruangText = cells[5].textContent?.trim() || '';

          const day_of_week = hariMap[hariText] ?? -1;
          
          let start_time = '00:00';
          let end_time = '00:00';
          if (jamText.includes('-')) {
            const parts = jamText.split('-');
            start_time = parts[0].trim();
            end_time = parts[1].trim();
          }

          let course_name = mkText;
          let course_code = '';
          const mkMatch = mkText.match(/\((.*?)\)\s*(.*)/);
          if (mkMatch) {
            course_code = mkMatch[1];
            course_name = mkMatch[2];
          }

          if (day_of_week !== -1) {
            results.push({
              course_name,
              course_code,
              kelas,
              lecturer: dosen,
              room: ruangText,
              day_of_week,
              start_time,
              end_time
            });
          }
        }
      });
      return results;
    });

    return schedules;

  } catch (error) {
    console.error('Scraping error:', error);
    throw error;
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
}
