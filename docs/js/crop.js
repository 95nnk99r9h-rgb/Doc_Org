// Automatischer Zuschnitt fotografierter Dokumente.
// Annahme: helles Papier vor dunklerem Untergrund. Gefunden wird die größte
// zusammenhängende helle Fläche; daraus wird das kleinste umschließende Rechteck
// bestimmt und das Bild darauf gedreht und beschnitten. Ist die Lage nicht
// eindeutig, wird nichts verändert – ein falscher Zuschnitt wäre schlimmer als
// keiner. Die Erkennung läuft auf einer verkleinerten Graustufenkopie.
const ANALYSIS_MAX = 720;
const MIN_COVERAGE = 0.10;   // kleiner: vermutlich kein Dokument, sondern ein Objekt
const MAX_COVERAGE = 0.995;  // größer: Papier füllt das Bild, es gibt nichts zu schneiden
const MIN_FILL = 0.70;       // wie rechteckig die gefundene Fläche ist
const MAX_ANGLE = 0.44;      // ~25°, darüber ist die Erkennung nicht mehr belastbar

export function otsuThreshold(histogram, total) {
 let sum = 0;
 for (let i = 0; i < 256; i++) sum += i * histogram[i];
 let sumB = 0, weightB = 0, best = -1, threshold = 127;
 for (let t = 0; t < 256; t++) {
  weightB += histogram[t];
  if (!weightB) continue;
  const weightF = total - weightB;
  if (!weightF) break;
  sumB += t * histogram[t];
  const meanB = sumB / weightB, meanF = (sum - sumB) / weightF;
  const between = weightB * weightF * (meanB - meanF) * (meanB - meanF);
  if (between > best) { best = between; threshold = t; }
 }
 return threshold;
}

// Andrew's monotone chain, gegen den Uhrzeigersinn.
export function convexHull(points) {
 if (points.length < 3) return points.slice();
 const sorted = points.slice().sort((a, b) => a.x - b.x || a.y - b.y);
 const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
 const build = list => {
  const half = [];
  for (const p of list) {
   while (half.length >= 2 && cross(half.at(-2), half.at(-1), p) <= 0) half.pop();
   half.push(p);
  }
  half.pop();
  return half;
 };
 return [...build(sorted), ...build(sorted.slice().reverse())];
}

// Kleinstes umschließendes Rechteck über rotierende Auflagelinien.
export function minAreaRect(hull) {
 if (hull.length < 3) return null;
 let best = null;
 for (let i = 0; i < hull.length; i++) {
  const p = hull[i], q = hull[(i + 1) % hull.length];
  const dx = q.x - p.x, dy = q.y - p.y, len = Math.hypot(dx, dy);
  if (len < 1e-9) continue;
  const ux = dx / len, uy = dy / len;
  let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
  for (const r of hull) {
   const u = r.x * ux + r.y * uy, v = -r.x * uy + r.y * ux;
   if (u < minU) minU = u; if (u > maxU) maxU = u;
   if (v < minV) minV = v; if (v > maxV) maxV = v;
  }
  const width = maxU - minU, height = maxV - minV, area = width * height;
  if (!best || area < best.area) {
   const cu = (minU + maxU) / 2, cv = (minV + maxV) / 2;
   best = { area, width, height, angle: Math.atan2(uy, ux), cx: cu * ux - cv * uy, cy: cu * uy + cv * ux };
  }
 }
 return best && upright(best);
}

// Drehwinkel auf (-45°, 45°] bringen; Seiten tauschen bei 90°-Schritten.
function upright(rect) {
 let { angle, width, height } = rect;
 while (angle <= -Math.PI / 4) { angle += Math.PI / 2; [width, height] = [height, width]; }
 while (angle > Math.PI / 4) { angle -= Math.PI / 2; [width, height] = [height, width]; }
 return { ...rect, angle, width, height };
}

export function grayscale(rgba, width, height) {
 const gray = new Uint8Array(width * height);
 for (let i = 0, j = 0; j < gray.length; i += 4, j++) gray[j] = (rgba[i] * 77 + rgba[i + 1] * 151 + rgba[i + 2] * 28) >> 8;
 return gray;
}

export function detectDocument(gray, width, height) {
 const total = width * height;
 if (total < 400) return null;
 const histogram = new Uint32Array(256);
 for (let i = 0; i < total; i++) histogram[gray[i]]++;
 const threshold = otsuThreshold(histogram, total);
 const mask = new Uint8Array(total);
 let bright = 0;
 for (let i = 0; i < total; i++) if (gray[i] > threshold) { mask[i] = 1; bright++; }
 const brightShare = bright / total;
 if (brightShare < 0.05 || brightShare > 0.985) return null;

 // Größte zusammenhängende helle Fläche (4er-Nachbarschaft, iterativ).
 const component = new Int32Array(total).fill(-1);
 const stack = new Int32Array(total);
 const sizes = [];
 for (let start = 0; start < total; start++) {
  if (!mask[start] || component[start] >= 0) continue;
  const id = sizes.length;
  let top = 0, size = 0;
  component[start] = id; stack[top++] = start;
  while (top) {
   const i = stack[--top]; size++;
   const x = i % width;
   if (x > 0 && mask[i - 1] && component[i - 1] < 0) { component[i - 1] = id; stack[top++] = i - 1; }
   if (x < width - 1 && mask[i + 1] && component[i + 1] < 0) { component[i + 1] = id; stack[top++] = i + 1; }
   if (i >= width && mask[i - width] && component[i - width] < 0) { component[i - width] = id; stack[top++] = i - width; }
   if (i < total - width && mask[i + width] && component[i + width] < 0) { component[i + width] = id; stack[top++] = i + width; }
  }
  sizes.push(size);
 }
 if (!sizes.length) return null;
 let best = 0;
 for (let i = 1; i < sizes.length; i++) if (sizes[i] > sizes[best]) best = i;
 const size = sizes[best];
 if (size / total < MIN_COVERAGE) return null;

 // Randpunkte je Zeile und Spalte reichen für die konvexe Hülle.
 const points = [];
 for (let y = 0; y < height; y++) {
  let min = -1, max = -1;
  for (let x = 0; x < width; x++) if (component[y * width + x] === best) { if (min < 0) min = x; max = x; }
  if (min >= 0) { points.push({ x: min, y }); if (max !== min) points.push({ x: max, y }); }
 }
 for (let x = 0; x < width; x++) {
  let min = -1, max = -1;
  for (let y = 0; y < height; y++) if (component[y * width + x] === best) { if (min < 0) min = y; max = y; }
  if (min >= 0) { points.push({ x, y: min }); if (max !== min) points.push({ x, y: max }); }
 }
 const rect = minAreaRect(convexHull(points));
 if (!rect || !rect.area) return null;
 const coverage = rect.area / total, fill = size / rect.area;
 if (coverage < MIN_COVERAGE || coverage > MAX_COVERAGE) return null;
 if (fill < MIN_FILL || Math.abs(rect.angle) > MAX_ANGLE) return null;
 // Nahezu bildfüllend und gerade: ein Zuschnitt brächte nichts.
 if (coverage > 0.96 && Math.abs(rect.angle) < 0.009) return null;
 return { ...rect, coverage, fill };
}

// Führt die Erkennung auf einer verkleinerten Kopie aus und rechnet auf die
// Originalauflösung zurück. Gibt null zurück, wenn nicht zugeschnitten wird.
export function analyzeSource(source) {
 const width = source.naturalWidth || source.width, height = source.naturalHeight || source.height;
 if (!width || !height) return null;
 const scale = Math.min(1, ANALYSIS_MAX / Math.max(width, height));
 const aw = Math.max(1, Math.round(width * scale)), ah = Math.max(1, Math.round(height * scale));
 const canvas = document.createElement('canvas');
 canvas.width = aw; canvas.height = ah;
 const ctx = canvas.getContext('2d', { willReadFrequently: true });
 ctx.drawImage(source, 0, 0, aw, ah);
 const rect = detectDocument(grayscale(ctx.getImageData(0, 0, aw, ah).data, aw, ah), aw, ah);
 canvas.width = canvas.height = 0;
 if (!rect) return null;
 const factor = 1 / scale;
 return { ...rect, cx: rect.cx * factor, cy: rect.cy * factor, width: rect.width * factor, height: rect.height * factor };
}

export function drawCropped(source, rect, { margin = 0.015, maxEdge = 2200 } = {}) {
 const width = rect.width * (1 + margin), height = rect.height * (1 + margin);
 const scale = Math.min(1, maxEdge / Math.max(width, height));
 const canvas = document.createElement('canvas');
 canvas.width = Math.max(1, Math.round(width * scale));
 canvas.height = Math.max(1, Math.round(height * scale));
 const ctx = canvas.getContext('2d');
 ctx.fillStyle = '#fff';
 ctx.fillRect(0, 0, canvas.width, canvas.height);
 ctx.translate(canvas.width / 2, canvas.height / 2);
 ctx.scale(scale, scale);
 ctx.rotate(-rect.angle);
 ctx.translate(-rect.cx, -rect.cy);
 ctx.imageSmoothingQuality = 'high';
 ctx.drawImage(source, 0, 0);
 return canvas;
}
