import type { APIRoute } from 'astro';
import { isValidToken, getTokenFromCookies } from '../../lib/adminAuth';
import { existsSync } from 'fs';

export const prerender = false;

const LOCAL_CHROME_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
];

async function getBrowserConfig(): Promise<{ executablePath: string; args: string[] }> {
  const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

  if (isServerless) {
    const chromium = await import('@sparticuz/chromium');
    return {
      executablePath: await chromium.default.executablePath(),
      args: [...chromium.default.args, '--no-sandbox'],
    };
  }

  const fromEnv = process.env.CHROME_PATH;
  if (fromEnv && existsSync(fromEnv)) {
    return { executablePath: fromEnv, args: ['--no-sandbox', '--disable-setuid-sandbox'] };
  }

  for (const p of LOCAL_CHROME_PATHS) {
    if (existsSync(p)) {
      return { executablePath: p, args: ['--no-sandbox', '--disable-setuid-sandbox'] };
    }
  }

  throw new Error('Chrome no encontrado. Instala Google Chrome o define CHROME_PATH en el entorno.');
}

export const POST: APIRoute = async ({ request }) => {
  let browser: any = null;

  try {
    const token = getTokenFromCookies(request.headers.get('cookie'));
    if (!(await isValidToken(token)))
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });

    const { html, filename = 'reporte.pdf' } = await request.json();
    if (!html)
      return new Response(JSON.stringify({ error: 'HTML requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });

    const puppeteer = await import('puppeteer-core');
    const { executablePath, args } = await getBrowserConfig();

    browser = await puppeteer.default.launch({ executablePath, args, headless: true });

    const page = await browser.newPage();

    // Block external fonts to avoid hangs
    await page.setRequestInterception(true);
    page.on('request', (req: any) => {
      const url = req.url();
      if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // A4 landscape at 96 dpi = 1123 × 794 px
    await page.setViewport({ width: 1123, height: 794, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: 'load', timeout: 60_000 });

    const pdf = await page.pdf({
      preferCSSPageSize: true,
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

    return new Response(new Blob([pdf], { type: 'application/pdf' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('[export-pdf]', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  } finally {
    if (browser) await browser.close();
  }
};
