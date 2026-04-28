import type { APIRoute } from 'astro';
import { isValidToken, getTokenFromCookies } from '../../../lib/adminAuth';
import { getDB } from '../../../lib/db';

export const prerender = false;

const LOGO = 'https://res.cloudinary.com/ddtjwooiz/image/upload/v1777391322/charola/logo.svg';

// ── Stop words ────────────────────────────────────────────────────────────────
const STOP = new Set([
  'que','de','en','y','a','el','la','los','las','un','una','unos','unas',
  'es','son','por','con','para','me','se','te','lo','le','su','sus','mi',
  'más','como','si','no','pero','hay','del','al','este','esta','esto',
  'también','muy','qué','cómo','cuál','dónde','cuándo','quién','sobre',
  'the','is','are','can','do','i','you','we','it','of','in','and','or',
  'to','have','has','be','what','how','where','when','who','which',
  'would','could','should','also','some','any','not','than','that','this',
  'with','from','about','hola','hello','hi','buenas','hey','ok','okay',
  'gracias','thanks','quiero','quisiera','necesito','tengo','puede','puedo',
  'soy','están','está','estoy','tiene','tienen','please','favor',
]);

function keywords(msgs: string[]): [string, number][] {
  const freq: Record<string, number> = {};
  for (const m of msgs) {
    m.toLowerCase().replace(/[^\wáéíóúñü\s]/g, ' ').split(/\s+/)
      .filter(w => w.length > 3 && !STOP.has(w))
      .forEach(w => { freq[w] = (freq[w] ?? 0) + 1; });
  }
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 12);
}

function fmt(ymd: string): string {
  const [y, m, d] = ymd.split('-');
  return `${d} ${['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'][+m-1]} ${y}`;
}

// ── SVG: bar chart (activity) ─────────────────────────────────────────────────
function activitySVG(days: { date: string; count: number }[]): string {
  const W = 760, H = 170, PL = 38, PR = 14, PT = 22, PB = 34;
  const CW = W - PL - PR, CH = H - PT - PB;
  const n = days.length || 1;
  const maxV = Math.max(...days.map(d => d.count), 1);
  const bw   = Math.max(3, (CW / n) - 2);
  const DARK = '#0F3D2E', GOLD = '#C9A56B', MUTED = '#7C8A82';

  if (days.every(d => d.count === 0))
    return `<text x="${W/2}" y="${H/2}" text-anchor="middle" font-family="system-ui" font-size="13" fill="${MUTED}">Sin actividad en este período</text>`;

  let out = '';

  // grid
  [0, 0.25, 0.5, 0.75, 1].forEach(p => {
    const y = PT + (1 - p) * CH;
    const v = Math.round(p * maxV);
    out += `<line x1="${PL}" y1="${y.toFixed(1)}" x2="${W-PR}" y2="${y.toFixed(1)}" stroke="${p===0?'rgba(10,42,31,.18)':'rgba(10,42,31,.07)'}" stroke-width="${p===0?1.5:1}" stroke-dasharray="${p===0?'none':'4,4'}"/>`;
    out += `<text x="${(PL-6).toFixed(1)}" y="${(y+3.5).toFixed(1)}" text-anchor="end" font-family="system-ui,sans-serif" font-size="9" fill="${MUTED}">${v}</text>`;
  });

  // bars + labels
  const hiIdx = days.reduce((m, d, i) => d.count > days[m].count ? i : m, 0);
  const every  = n > 60 ? 14 : n > 30 ? 7 : n > 14 ? 3 : 1;

  days.forEach((d, i) => {
    const bh  = Math.max((d.count / maxV) * CH, d.count > 0 ? 3 : 0);
    const bx  = PL + (i / n) * CW;
    const by  = PT + CH - bh;
    const hi  = i === hiIdx;

    out += `<rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${(bw-1).toFixed(1)}" height="${bh.toFixed(1)}" rx="3" fill="${hi ? GOLD : DARK}" opacity="${hi ? 1 : 0.38}"/>`;
    if (d.count > 0 && (hi || n <= 20))
      out += `<text x="${(bx+bw/2).toFixed(1)}" y="${(by-5).toFixed(1)}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="9" font-weight="600" fill="${hi ? GOLD : DARK}" opacity="${hi?1:0.65}">${d.count}</text>`;
    if (i % every === 0 || i === n - 1)
      out += `<text x="${(bx+bw/2).toFixed(1)}" y="${H-8}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="8" fill="${MUTED}">${d.date.slice(5).replace('-','/')}</text>`;
  });

  return out;
}

// ── SVG: donut chart (keywords) ───────────────────────────────────────────────
function donutSVG(kws: [string, number][]): string {
  const top = kws.slice(0, 6);
  const W = 420, H = 210;
  const cx = 105, cy = 105, R = 88, r = 50;
  const COLORS = ['#0F3D2E', '#C9A56B', '#1F5C44', '#A88550', '#7C8A82', '#B8C9B5'];
  const MUTED = '#7C8A82';

  if (top.length === 0)
    return `<text x="${W/2}" y="${H/2}" text-anchor="middle" font-family="system-ui" font-size="12" fill="${MUTED}">Sin datos</text>`;

  const total = top.reduce((s, [, v]) => s + v, 0);
  let angle = -Math.PI / 2;
  let out = '';

  // Slices
  top.forEach(([, val], i) => {
    const sweep = (val / total) * Math.PI * 2;
    const x1 = cx + R * Math.cos(angle), y1 = cy + R * Math.sin(angle);
    const x2 = cx + R * Math.cos(angle + sweep), y2 = cy + R * Math.sin(angle + sweep);
    const xi1 = cx + r * Math.cos(angle), yi1 = cy + r * Math.sin(angle);
    const xi2 = cx + r * Math.cos(angle + sweep), yi2 = cy + r * Math.sin(angle + sweep);
    const large = sweep > Math.PI ? 1 : 0;
    out += `<path d="M${x1.toFixed(2)},${y1.toFixed(2)} A${R},${R} 0 ${large},1 ${x2.toFixed(2)},${y2.toFixed(2)} L${xi2.toFixed(2)},${yi2.toFixed(2)} A${r},${r} 0 ${large},0 ${xi1.toFixed(2)},${yi1.toFixed(2)} Z" fill="${COLORS[i]}" stroke="#F4EEDE" stroke-width="2.5"/>`;
    angle += sweep;
  });

  // Center label — top keyword
  const topPct = Math.round(top[0][1] / total * 100);
  out += `<text x="${cx}" y="${cy - 10}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="24" font-weight="800" fill="#0F3D2E">${topPct}%</text>`;
  out += `<text x="${cx}" y="${cy + 8}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="10" font-weight="600" fill="#7C8A82">${top[0][0]}</text>`;
  out += `<text x="${cx}" y="${cy + 22}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="8" fill="#B8C9B5">top keyword</text>`;

  // Legend
  const lx = 220, rowH = 30;
  top.forEach(([word, val], i) => {
    const pct = Math.round(val / total * 100);
    const y = 18 + i * rowH;
    const isTop = i === 0;
    out += `<rect x="${lx}" y="${y}" width="10" height="10" rx="3" fill="${COLORS[i]}"/>`;
    out += `<text x="${lx + 16}" y="${y + 9}" font-family="system-ui,sans-serif" font-size="${isTop ? 12 : 11}" font-weight="${isTop ? 700 : 500}" fill="${isTop ? '#0A2A1F' : '#4A5A52'}">${word}</text>`;
    out += `<text x="${W - 8}" y="${y + 9}" text-anchor="end" font-family="system-ui,sans-serif" font-size="12" font-weight="700" fill="${COLORS[i]}">${pct}%</text>`;
    // mini bar
    const bw = (val / top[0][1]) * 90;
    out += `<rect x="${lx + 16}" y="${y + 13}" width="90" height="3" rx="2" fill="rgba(10,42,31,.08)"/>`;
    if (bw > 0) out += `<rect x="${lx + 16}" y="${y + 13}" width="${bw.toFixed(1)}" height="3" rx="2" fill="${COLORS[i]}" opacity="0.55"/>`;
  });

  return out;
}

// ── Handler ───────────────────────────────────────────────────────────────────
export const POST: APIRoute = async ({ request }) => {
  const token = getTokenFromCookies(request.headers.get('cookie'));
  if (!(await isValidToken(token)))
    return new Response('No autorizado', { status: 401 });

  let body: { from?: string; to?: string };
  try { body = await request.json(); }
  catch { return new Response('Bad request', { status: 400 }); }

  const { from, to } = body;
  if (!from || !to) return new Response('Fechas requeridas', { status: 400 });

  const db = await getDB();

  const [statsR, dailyR, msgsR] = await Promise.all([
    db.execute({
      sql: `SELECT COUNT(DISTINCT session_id) as sess,
                   COUNT(CASE WHEN role='user' THEN 1 END) as umsg,
                   COUNT(CASE WHEN role='bot' AND content LIKE '%[WA]%' THEN 1 END) as wa
            FROM chat_messages WHERE date >= ? AND date <= ?`,
      args: [from, to],
    }),
    db.execute({
      sql: `SELECT date, COUNT(*) as cnt FROM chat_messages
            WHERE role='user' AND date >= ? AND date <= ?
            GROUP BY date ORDER BY date`,
      args: [from, to],
    }),
    db.execute({
      sql: `SELECT content FROM chat_messages WHERE role='user' AND date >= ? AND date <= ? LIMIT 800`,
      args: [from, to],
    }),
  ]);

  const totalSess  = Number(statsR.rows[0]?.sess ?? 0);
  const totalMsgs  = Number(statsR.rows[0]?.umsg ?? 0);
  const totalWA    = Number(statsR.rows[0]?.wa   ?? 0);
  const waRate     = totalMsgs > 0 ? ((totalWA / totalMsgs) * 100).toFixed(1) : '0.0';
  const avgMps     = totalSess > 0 ? (totalMsgs / totalSess).toFixed(1) : '0';

  // Fill daily gaps with 0
  const dailyMap = new Map(dailyR.rows.map(r => [String(r.date), Number(r.cnt)]));
  const days: { date: string; count: number }[] = [];
  const cur = new Date(from + 'T00:00:00'), end = new Date(to + 'T00:00:00');
  for (; cur <= end; cur.setDate(cur.getDate() + 1)) {
    const ymd = cur.toISOString().slice(0, 10);
    days.push({ date: ymd, count: dailyMap.get(ymd) ?? 0 });
  }

  const hiDay = days.reduce((b, d) => d.count > b.count ? d : b, days[0] ?? { date: '', count: 0 });
  const kws    = keywords(msgsR.rows.map(r => String(r.content)));
  const kwSvg  = donutSVG(kws);
  const actSvg = activitySVG(days);

  const periodLabel = `${fmt(from)} — ${fmt(to)}`;
  const dayCount    = days.length;
  const today       = new Date().toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric', timeZone:'America/Mexico_City' });

  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Reporte Bot855 · ${periodLabel}</title>
  <style>
    @page { size: A4 landscape; margin: 0; }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 297mm; height: 210mm;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #F4EEDE;
      color: #0A2A1F;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── Shell ── */
    .shell {
      width: 297mm; height: 210mm;
      display: flex; flex-direction: column;
    }

    /* ── Header bar ── */
    .hdr {
      background: #0F3D2E;
      padding: 0 22px;
      height: 64px;
      display: flex; align-items: center; gap: 16px;
      flex-shrink: 0;
    }
    .hdr img { width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0; }
    .hdr-brand { display: flex; flex-direction: column; }
    .hdr-brand strong { font-size: .88rem; font-weight: 700; color: #fff; letter-spacing: .03em; line-height: 1.2; }
    .hdr-brand span  { font-size: .62rem; color: rgba(255,255,255,.45); }
    .hdr-sep { width: 1px; height: 28px; background: rgba(255,255,255,.15); margin: 0 4px; flex-shrink: 0; }

    /* KPI pills in header */
    .kpi-pills { display: flex; gap: 8px; flex: 1; }
    .pill {
      background: rgba(255,255,255,.09);
      border: 1px solid rgba(255,255,255,.14);
      border-radius: 10px;
      padding: 6px 14px;
      display: flex; flex-direction: column; align-items: center;
      min-width: 80px;
    }
    .pill.hi { border-color: rgba(201,165,107,.55); background: rgba(201,165,107,.12); }
    .pill-val { font-size: 1.35rem; font-weight: 800; color: #fff; line-height: 1; }
    .pill.hi .pill-val { color: #C9A56B; }
    .pill-lbl { font-size: .52rem; font-weight: 600; color: rgba(255,255,255,.45); text-transform: uppercase; letter-spacing: .1em; margin-top: 2px; }

    /* Period badge */
    .period-badge { text-align: right; flex-shrink: 0; }
    .period-badge .per-val { font-size: .82rem; font-weight: 700; color: #C9A56B; }
    .period-badge .per-sub { font-size: .58rem; color: rgba(255,255,255,.35); margin-top: 2px; }

    /* ── Main content ── */
    .body {
      flex: 1; min-height: 0;
      display: grid;
      grid-template-columns: 1fr 220px 168px;
      gap: 10px;
      padding: 10px 14px;
    }

    /* cards */
    .card {
      background: #fff;
      border: 1px solid rgba(10,42,31,.1);
      border-radius: 12px;
      padding: 11px 13px;
      box-shadow: 0 1px 4px rgba(10,42,31,.06);
      display: flex; flex-direction: column;
      overflow: hidden;
    }
    .card-ttl {
      font-size: .55rem; font-weight: 700; color: #7C8A82;
      text-transform: uppercase; letter-spacing: .12em;
      margin-bottom: 8px; flex-shrink: 0;
    }
    .card-body { flex: 1; min-height: 0; display: flex; align-items: center; }
    .card-body svg { width: 100%; height: 100%; display: block; overflow: visible; }

    /* summary list */
    .sum { display: flex; flex-direction: column; width: 100%; }
    .sum-row {
      display: flex; justify-content: space-between; align-items: baseline;
      padding: 5px 0; border-bottom: 1px solid rgba(10,42,31,.07);
    }
    .sum-row:last-child { border-bottom: none; }
    .sum-lbl { font-size: .72rem; color: #4A5A52; }
    .sum-val { font-size: .95rem; font-weight: 800; color: #0F3D2E; }
    .sum-val.g { color: #A88550; }

    /* ── Footer ── */
    .ftr {
      height: 30px; flex-shrink: 0;
      background: #0F3D2E;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 22px;
    }
    .ftr span { font-size: .58rem; color: rgba(255,255,255,.4); letter-spacing: .06em; }
    .ftr strong { font-size: .62rem; font-weight: 700; color: rgba(255,255,255,.65); }
  </style>
</head>
<body>
<div class="shell">

  <!-- HEADER -->
  <div class="hdr">
    <img src="${LOGO}" alt="Naturizable"/>
    <div class="hdr-brand">
      <strong>100% Naturizable</strong>
      <span>Bot855 · Reporte de actividad</span>
    </div>
    <div class="hdr-sep"></div>

    <div class="kpi-pills">
      <div class="pill">
        <span class="pill-val">${totalSess}</span>
        <span class="pill-lbl">Conversaciones</span>
      </div>
      <div class="pill">
        <span class="pill-val">${totalMsgs}</span>
        <span class="pill-lbl">Mensajes</span>
      </div>
      <div class="pill hi">
        <span class="pill-val">${totalWA}</span>
        <span class="pill-lbl">WhatsApp</span>
      </div>
      <div class="pill">
        <span class="pill-val">${waRate}%</span>
        <span class="pill-lbl">Conversión</span>
      </div>
      <div class="pill">
        <span class="pill-val">${avgMps}</span>
        <span class="pill-lbl">Msgs/Sesión</span>
      </div>
    </div>

    <div class="hdr-sep"></div>
    <div class="period-badge">
      <div class="per-val">${periodLabel}</div>
      <div class="per-sub">${dayCount} días · ${today}</div>
    </div>
  </div>

  <!-- BODY: 3 columns -->
  <div class="body">

    <!-- Actividad -->
    <div class="card">
      <div class="card-ttl">Actividad diaria — mensajes de usuarios</div>
      <div class="card-body">
        <svg viewBox="0 0 760 155">${actSvg}</svg>
      </div>
    </div>

    <!-- Keywords donut -->
    <div class="card">
      <div class="card-ttl">Temas más frecuentes</div>
      <div class="card-body">
        <svg viewBox="0 0 420 210" style="width:100%;height:100%;display:block;overflow:visible">${kwSvg}</svg>
      </div>
    </div>

    <!-- Resumen -->
    <div class="card">
      <div class="card-ttl">Resumen del período</div>
      <div class="card-body" style="align-items:flex-start">
        <div class="sum">
          <div class="sum-row"><span class="sum-lbl">Días analizados</span><span class="sum-val">${dayCount}</span></div>
          <div class="sum-row"><span class="sum-lbl">Conversaciones</span><span class="sum-val">${totalSess}</span></div>
          <div class="sum-row"><span class="sum-lbl">Mensajes</span><span class="sum-val">${totalMsgs}</span></div>
          <div class="sum-row"><span class="sum-lbl">Leads WA</span><span class="sum-val g">${totalWA}</span></div>
          <div class="sum-row"><span class="sum-lbl">Conversión</span><span class="sum-val g">${waRate}%</span></div>
          <div class="sum-row"><span class="sum-lbl">Msgs / Sesión</span><span class="sum-val">${avgMps}</span></div>
          <div class="sum-row"><span class="sum-lbl">Pico diario</span><span class="sum-val">${hiDay?.count ?? 0}</span></div>
          <div class="sum-row"><span class="sum-lbl">Día pico</span><span class="sum-val" style="font-size:.72rem">${hiDay?.date ? fmt(hiDay.date) : '—'}</span></div>
        </div>
      </div>
    </div>

  </div>

  <!-- FOOTER -->
  <div class="ftr">
    <span>100% Naturizable · Bot855 Analytics</span>
    <strong>naturizable.com</strong>
    <span>${today}</span>
  </div>

</div>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
};
