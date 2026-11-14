// Report of the plot layouts of the painted settlement maps (js/town_layouts.js): for every map it lists plots whose
// drawn buildings would overlap each other, and plots that fall out of the picture.
// usage: node tools/town_layout_report.mjs
import { TOWN_LAYOUTS, IMG_W, IMG_H } from '../js/town_layouts.js';

const W = 1000;
const H = (W * IMG_H) / IMG_W;
let bad = 0;
for (const [id, lay] of Object.entries(TOWN_LAYOUTS)) {
  const boxes = lay.plots.map(([u, v, w], i) => {
    const iw = w * W * lay.grow * 0.74;
    const bw = iw * 0.9, bh = iw * 0.62;
    return { i, x: u * W, y: v * H, x0: u * W - bw / 2, x1: u * W + bw / 2, y0: v * H - bh, y1: v * H };
  });
  const lines = [];
  for (const a of boxes) {
    if (a.x0 < 4 || a.x1 > W - 4 || a.y0 < 4 || a.y1 > H - 4) lines.push(`  plot ${a.i}: outside the picture`);
    for (const b of boxes) {
      if (b.i <= a.i) continue;
      const ix = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), iy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
      if (ix <= 0 || iy <= 0) continue;
      const small = Math.min((a.x1 - a.x0) * (a.y1 - a.y0), (b.x1 - b.x0) * (b.y1 - b.y0));
      const r = (ix * iy) / small;
      if (r > 0.3) lines.push(`  plots ${a.i} and ${b.i}: buildings overlap ${(r * 100).toFixed(0)} %`);
    }
  }
  const dmin = Math.min(...boxes.flatMap((a) => boxes.filter((b) => b.i > a.i).map((b) => Math.hypot(a.x - b.x, a.y - b.y))));
  console.log(`${id}: ${lay.plots.length} plots, nearest centres ${dmin.toFixed(0)} units${lines.length ? '' : ', ok'}`);
  for (const l of lines) { console.log(l); bad++; }
}
console.log(bad ? `${bad} problem(s)` : 'no overlaps');
