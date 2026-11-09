'use strict';
// HomeFlow · Διαγράμματα
// Ένα κοινό ύφος για όλα τα διαγράμματα: μπάρες με στρογγυλή κορυφή και απαλό χρώμα,
// ομαλές καμπύλες με σκίαση, ντόνατ με κενά, και ταμπελάκι με το ποσό στο πέρασμα
// του ποντικιού (ή στο άγγιγμα).
// (Τα αρχεία φορτώνονται με τη σειρά του index.html· μοιράζονται τις ίδιες μεταβλητές.)

let chUid = 0;
function chStep(raw) { const p = Math.pow(10, Math.floor(Math.log10(raw || 1))); const n = raw / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; }
function chK(v) { const a = Math.abs(v); return (v < 0 ? '−' : '') + (a >= 1e6 ? (a / 1e6).toLocaleString('el-GR', { maximumFractionDigits: 1 }) + 'εκ' : a >= 1000 ? (a / 1000).toLocaleString('el-GR', { maximumFractionDigits: 1 }) + 'χ' : Math.round(a).toLocaleString('el-GR')); }
const chTip = s => esc(s).replace(/\n/g, '&#10;');
// μπάρα με στρογγυλές μόνο τις πάνω γωνίες
function chBar(x, y, w, h, r) {
  if (h <= 0.5) return '';
  r = Math.min(r, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}
// ομαλή καμπύλη από σημεία (monotone, για να μην «φουσκώνει» πάνω από τα σημεία)
function chSmooth(p) {
  if (p.length < 3) return p.map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ',' + q[1].toFixed(1)).join('');
  const n = p.length, d = [], m = [];
  for (let i = 0; i < n - 1; i++) d.push((p[i + 1][1] - p[i][1]) / (p[i + 1][0] - p[i][0]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  let s = `M${p[0][0].toFixed(1)},${p[0][1].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const h = (p[i + 1][0] - p[i][0]) / 3;
    s += `C${(p[i][0] + h).toFixed(1)},${(p[i][1] + m[i] * h).toFixed(1)} ${(p[i + 1][0] - h).toFixed(1)},${(p[i + 1][1] - m[i + 1] * h).toFixed(1)} ${p[i + 1][0].toFixed(1)},${p[i + 1][1].toFixed(1)}`;
  }
  return s;
}
function chGrid(L, R, W, y, top, step, fmt) {
  let g = '';
  for (let v = 0; v <= top + 1e-6; v += step) g += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="ch-grid ${v ? '' : 'base'}"/><text x="${L - 10}" y="${y(v) + 5}" text-anchor="end" class="ch-ax">${fmt(v)}</text>`;
  return g;
}

// Ομαδοποιημένες μπάρες. series: [{ name, values, color }], line: { name, values, color } (προαιρετικά)
function barChart({ labels, series, line, H = 300, fmt = eur, tipHead = l => l, action }) {
  const id = ++chUid, W = 1000, L = 62, R = 10, T = 18, B = 40;
  const all = [...series.flatMap(s => s.values), ...(line ? line.values : [])].filter(v => v != null);
  const max = Math.max(1, ...all), step = chStep(max / 4), top = Math.ceil(max / step) * step;
  const y = v => T + (H - T - B) * (1 - v / top);
  const n = labels.length, gw = (W - L - R) / n, inner = gw * (n > 16 ? .78 : .62), bw = Math.min(46, (inner - (series.length - 1) * 4) / series.length);
  const grp = bw * series.length + (series.length - 1) * 4;
  let defs = '', bars = '', hits = '';
  series.forEach((s, k) => { defs += `<linearGradient id="chg${id}-${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${s.color}"/><stop offset="1" style="stop-color:${s.color};stop-opacity:.55"/></linearGradient>`; });
  labels.forEach((lab, i) => {
    const cx = L + i * gw + gw / 2, x0 = cx - grp / 2;
    series.forEach((s, k) => {
      const v = s.values[i]; if (v == null) return;
      bars += `<path class="ch-bar" style="fill:url(#chg${id}-${k});animation-delay:${(i * 25)}ms" d="${chBar(x0 + k * (bw + 4), y(v), bw, y(0) - y(v), 7)}"/>`;
    });
    const tip = [tipHead(lab, i), ...series.map(s => s.values[i] != null ? `${s.name}: ${fmt(s.values[i])}` : ''), line && line.values[i] != null ? `${line.name}: ${fmt(line.values[i])}` : ''].filter(Boolean).join('\n');
    hits += `<rect class="ch-hit" x="${L + i * gw}" y="${T}" width="${gw}" height="${H - T - B}" rx="10" data-tip="${chTip(tip)}"${action ? ` ${action(i)}` : ''}/>`;
    bars += `<text x="${cx}" y="${H - 12}" text-anchor="middle" class="ch-lab">${esc(lab)}</text>`;
  });
  let ln = '';
  if (line) {
    const pts = line.values.map((v, i) => v == null ? null : [L + i * gw + gw / 2, y(v)]).filter(Boolean);
    ln = `<path d="${chSmooth(pts)}" class="ch-line dashed" style="stroke:${line.color}"/>` + pts.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="4.5" class="ch-dot" style="stroke:${line.color}"/>`).join('');
  }
  const legend = [...series.map(s => [s.name, s.color, '']), ...(line ? [[line.name, line.color, 'dash']] : [])];
  return `<div class="ch"><svg class="chart ch-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(series.map(s => s.name).join(', '))}"><defs>${defs}</defs>
    ${chGrid(L, R, W, y, top, step, chK)}${hits}${bars}${ln}</svg>
    <div class="legend">${legend.map(([n, c, k]) => `<span><i class="${k}" style="background:${c}"></i>${esc(n)}</span>`).join('')}</div></div>`;
}

// Καμπύλη με σκίαση (π.χ. σύνολο χρημάτων, υπόλοιπο λογαριασμού)
function areaChart({ labels, values, color = 'var(--brand)', H = 260, fmt = eur0, tips, xLabels, fromZero = true }) {
  const id = ++chUid, W = 1000, L = 62, R = 18, T = 26, B = 40;
  const vs = values, n = vs.length;
  if (n < 2) return '';
  let mn = fromZero ? Math.min(0, ...vs) : Math.min(...vs), mx = Math.max(...vs);
  if (!fromZero) { const pad = (mx - mn) * .15 || Math.abs(mx) * .05 || 1; const pos = mn >= 0; mn -= pad; mx += pad; if (pos && mn < 0) mn = 0; }
  const step = chStep((mx - mn || 1) / 4), lo = Math.floor(mn / step) * step, top = Math.ceil(mx / step) * step;
  const y = v => T + (H - T - B) * (1 - (v - lo) / (top - lo || 1));
  const x = i => L + (W - L - R) * i / (n - 1);
  const pts = vs.map((v, i) => [x(i), y(v)]);
  const path = chSmooth(pts);
  let grid = '';
  for (let v = lo; v <= top + 1e-6; v += step) grid += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="ch-grid"/><text x="${L - 10}" y="${y(v) + 5}" text-anchor="end" class="ch-ax">${chK(v)}</text>`;
  const every = Math.ceil(n / 12);
  const xl = (xLabels || labels).map((l, i) => i % every === 0 || i === n - 1 ? `<text x="${x(i)}" y="${H - 12}" text-anchor="${i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}" class="ch-lab">${esc(l)}</text>` : '').join('');
  const hw = (W - L - R) / (n - 1);
  const hits = vs.map((v, i) => `<g class="ch-pt"><rect class="ch-hit" x="${x(i) - hw / 2}" y="${T}" width="${hw}" height="${H - T - B}" data-tip="${chTip((tips ? tips[i] : labels[i]) + '\n' + fmt(v))}"/><line class="ch-cross" x1="${x(i)}" x2="${x(i)}" y1="${T}" y2="${H - B}"/><circle class="ch-dot" cx="${x(i)}" cy="${y(v)}" r="5" style="stroke:${color}"/></g>`).join('');
  const last = pts[n - 1];
  return `<div class="ch"><svg class="chart ch-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Πορεία"><defs>
      <linearGradient id="cha${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${color};stop-opacity:.32"/><stop offset="1" style="stop-color:${color};stop-opacity:0"/></linearGradient></defs>
    ${grid}
    <path d="${path}L${last[0]},${y(lo)}L${pts[0][0]},${y(lo)}Z" style="fill:url(#cha${id})" class="ch-area"/>
    <path d="${path}" class="ch-line" style="stroke:${color}"/>
    <circle cx="${last[0]}" cy="${last[1]}" r="11" class="ch-halo" style="fill:${color}"/><circle cx="${last[0]}" cy="${last[1]}" r="6" style="fill:${color};stroke:var(--paper);stroke-width:3"/>
    ${hits}${xl}</svg></div>`;
}

// Ντόνατ. parts: [{ label, v, color, attrs }]
function donutChart(parts, { total, sub = 'Σύνολο', fmt = eur0, size = 220 } = {}) {
  const tot = parts.reduce((s, p) => s + p.v, 0);
  if (!tot) return '';
  const C = size / 2, r = size * .38, sw = size * .14, circ = 2 * Math.PI * r;
  const gap = parts.length > 1 ? 6 : 0;
  let off = 0, segs = '';
  for (const p of parts) {
    const len = circ * p.v / tot;
    const vis = Math.max(.01, len - gap);
    segs += `<circle class="ch-seg" cx="${C}" cy="${C}" r="${r}" style="stroke:${p.color}" stroke-width="${sw}" stroke-dasharray="${vis} ${circ - vis}" stroke-dashoffset="${-off}" data-tip="${chTip(`${p.label}\n${fmt(p.v)} · ${Math.round(p.v / tot * 100)}%`)}" ${p.attrs || ''}/>`;
    off += len;
  }
  return `<svg class="ch-donut" viewBox="0 0 ${size} ${size}" role="img" aria-label="Κατανομή">
    <circle cx="${C}" cy="${C}" r="${r}" fill="none" style="stroke:var(--track)" stroke-width="${sw}"/>
    <g transform="rotate(-90 ${C} ${C})">${segs}</g>
    <text x="${C}" y="${C - 6}" text-anchor="middle" class="ch-dsub">${esc(sub)}</text>
    <text x="${C}" y="${C + 20}" text-anchor="middle" class="ch-dtot">${esc(total != null ? total : fmt(tot))}</text></svg>`;
}

// Ταμπελάκι
(function () {
  let tip = null;
  const show = (el, ev) => {
    if (!tip) { tip = document.createElement('div'); tip.className = 'ch-tip'; document.body.appendChild(tip); }
    const [h, ...rest] = el.getAttribute('data-tip').split('\n');
    tip.innerHTML = `<b>${esc(h)}</b>${rest.map(r => `<div>${esc(r)}</div>`).join('')}`;
    tip.classList.add('on');
    const pad = 14, w = tip.offsetWidth, hh = tip.offsetHeight;
    let x = ev.clientX + pad, y = ev.clientY - hh - pad;
    if (x + w > innerWidth - 8) x = ev.clientX - w - pad;
    if (y < 8) y = ev.clientY + pad;
    tip.style.transform = `translate(${x}px, ${y}px)`;
  };
  const hide = () => { if (tip) tip.classList.remove('on'); };
  document.addEventListener('pointermove', ev => {
    const el = ev.target.closest && ev.target.closest('[data-tip]');
    if (el && el.closest('.ch, .ch-donut, .pie-wrap')) show(el, ev); else hide();
  }, { passive: true });
  document.addEventListener('scroll', hide, true);
})();
