/**
 * Stage 1A static structural-note round-trip against local Verovio emscripten build.
 *
 * Usage (from Neon repo):
 *   node scripts/stage1a-schenker-roundtrip.js
 *
 * Requires ../verovio/emscripten/build/verovio.js (built WASM module).
 */
const fs = require('fs');
const path = require('path');

const verovioJs = path.resolve(
  __dirname,
  '../../verovio/emscripten/build/verovio.js',
);
const smokeMeiPath = path.resolve(
  __dirname,
  '../Resources for Neon tutorials/schenker_stage1_smoke.mei',
);

function noteheadXY(svg) {
  const m = svg.match(
    /id="schenker-n1"[\s\S]*?<use[^>]*transform="translate\(([^,]+),\s*([^)]+)\)/,
  );
  return m ? { x: parseFloat(m[1]), y: parseFloat(m[2]) } : null;
}

function check(name, ok, detail) {
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${name}${detail ? ` — ${detail}` : ''}`);
  return ok;
}

async function main() {
  if (!fs.existsSync(verovioJs)) {
    throw new Error(`Missing ${verovioJs}. Build Verovio WASM first.`);
  }
  const Mod = require(verovioJs);
  await new Promise((r) => setTimeout(r, 500));

  const cwrap = Mod.cwrap.bind(Mod);
  const ctor = cwrap('vrvToolkit_constructor', 'number', []);
  const loadData = cwrap('vrvToolkit_loadData', 'number', ['number', 'string']);
  const renderToSVG = cwrap('vrvToolkit_renderToSVG', 'string', [
    'number',
    'number',
    'number',
  ]);
  const getMEI = cwrap('vrvToolkit_getMEI', 'string', ['number', 'string']);
  const setOptions = cwrap('vrvToolkit_setOptions', null, ['number', 'string']);

  const ptr = ctor();
  setOptions(
    ptr,
    JSON.stringify({
      inputFrom: 'mei',
      footer: 'none',
      header: 'none',
      pageWidth: 2100,
      pageHeight: 2970,
      scale: 40,
      adjustPageHeight: true,
    }),
  );

  const base = fs.readFileSync(smokeMeiPath, 'utf8');
  let all = true;

  loadData(ptr, base);
  const svg1 = renderToSVG(ptr, 1, 0);
  const p1 = noteheadXY(svg1);
  all =
    check(
      '1. Renders type=schenker note',
      !!(p1 && svg1.includes('schenker-n1')),
      JSON.stringify(p1),
    ) && all;

  loadData(ptr, base.replace('schenker:x="816"', 'schenker:x="1200"'));
  const p2 = noteheadXY(renderToSVG(ptr, 1, 0));
  all =
    check(
      '2. Changing schenker:x changes only X',
      !!(
        p1 &&
        p2 &&
        Math.abs(p2.x - p1.x) > 1 &&
        Math.abs(p2.y - p1.y) < 1.5
      ),
      `${JSON.stringify(p1)} -> ${JSON.stringify(p2)}`,
    ) && all;

  loadData(ptr, base.replace('loc="4"', 'loc="5"'));
  const p3 = noteheadXY(renderToSVG(ptr, 1, 0));
  const dy = p1 && p3 ? p1.y - p3.y : null;
  all =
    check(
      '3. loc+1 moves one half staff-space up',
      dy !== null && dy > 5,
      `Δy(up)=${dy}`,
    ) && all;

  loadData(ptr, base);
  renderToSVG(ptr, 1, 0);
  const exported = getMEI(ptr, JSON.stringify({ scoreBased: true }));
  const attrsOk =
    /type="schenker"/.test(exported) &&
    /loc="4"/.test(exported) &&
    /schenker:x="816"/.test(exported);
  const xmlnsOk =
    /xmlns:schenker="https:\/\/example\.org\/schenker"/.test(exported);
  all =
    check(
      '4. Export preserves type/loc/schenker:x and xmlns',
      attrsOk && xmlnsOk,
      `attrsOk=${attrsOk} xmlnsOk=${xmlnsOk}`,
    ) && all;

  loadData(ptr, exported);
  const p5 = noteheadXY(renderToSVG(ptr, 1, 0));
  all =
    check(
      '5. Reload exported MEI keeps same X/loc',
      !!(
        p1 &&
        p5 &&
        Math.abs(p1.x - p5.x) < 1.5 &&
        Math.abs(p1.y - p5.y) < 1.5
      ),
      `${JSON.stringify(p1)} vs ${JSON.stringify(p5)}`,
    ) && all;

  if (!all) process.exit(1);
  console.log('Stage 1A: all checks passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
