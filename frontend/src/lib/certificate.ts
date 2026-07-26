/**
 * Certificate rendering — no dependencies.
 *
 * The certificate is drawn once onto a <canvas> at print resolution. That
 * same canvas is both the on-screen preview and the source of the PDF, so
 * the design has a single source of truth.
 *
 * `jpegToPdf` wraps the canvas JPEG in a hand-written PDF (a JPEG is already
 * a valid PDF image stream via the DCTDecode filter, so no encoding work is
 * needed — just the object/xref scaffolding).
 */

export interface CertificateData {
  courseTitle: string;
  userName: string;
  completedAt: Date;
}

/** A4 landscape at ~205 dpi: big enough to print crisply, small enough to stay snappy. */
export const CERTIFICATE_PIXEL_WIDTH = 2400;
export const CERTIFICATE_ASPECT = 1.414; // A4 landscape (297mm / 210mm)

/** A4 landscape in PostScript points (1pt = 1/72in). */
const PAGE_WIDTH_PT = 841.89;
const PAGE_HEIGHT_PT = 595.28;

const ACCENT = '#2563eb';
const INK = '#1f2937';
const INK_SOFT = '#6b7280';
const RULE = 'rgba(37, 99, 235, 0.4)';
const FONT_HEAD = "'Kalam', cursive";
const FONT_BODY = "'Nunito', system-ui, sans-serif";

/* SVG path data reused from the certificate markup (viewBox noted per path). */
const LOGO_PATH = 'M24 4 4 14l20 10 20-10Zm0 22.6L9.5 19.3v9.9c0 1 .5 1.9 1.4 2.4L24 39l13.1-7.4c.9-.5 1.4-1.4 1.4-2.4v-9.9Z'; // 0 0 48 48
const FLOURISH_PATH = 'M4 8c30-6 60 4 92-1s60-5 100 2'; // 0 0 200 12
const SEAL_STAR_PATH = 'M50 31l5 10.4 11.4 1.6-8.3 8 2 11.3L50 57l-10.1 5.3 2-11.3-8.3-8L45 41.4z'; // 0 0 100 100
const SEAL_RIBBON_PATH = 'M37 79l6.4-13.3 6.6 4.2 6.6-4.2L63 79l-13-5.3z'; // 0 0 100 100

/** Draws an SVG path scaled from its viewBox into a box at (x, y). */
function drawPath(
  ctx: CanvasRenderingContext2D,
  pathData: string,
  viewBox: number,
  x: number,
  y: number,
  size: number,
  paint: { fill?: string; stroke?: string; lineWidth?: number },
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / viewBox, size / viewBox);
  const path = new Path2D(pathData);
  if (paint.fill) {
    ctx.fillStyle = paint.fill;
    ctx.fill(path);
  }
  if (paint.stroke) {
    ctx.strokeStyle = paint.stroke;
    ctx.lineWidth = paint.lineWidth ?? 1;
    ctx.lineCap = 'round';
    ctx.stroke(path);
  }
  ctx.restore();
}

/** Shrinks the font until `text` fits `maxWidth`, then draws it centred at (cx, y). */
function drawFitted(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  maxWidth: number,
  fontSize: number,
  family: string,
  weight: string,
  color: string,
): void {
  let size = fontSize;
  ctx.font = `${weight} ${size}px ${family}`;
  while (ctx.measureText(text).width > maxWidth && size > fontSize * 0.45) {
    size -= fontSize * 0.04;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(text, cx, y, maxWidth);
}

/** `letterSpacing` is widely supported but not in every lib.dom version. */
function setLetterSpacing(ctx: CanvasRenderingContext2D, value: string): void {
  (ctx as unknown as { letterSpacing: string }).letterSpacing = value;
}

/**
 * Renders the full certificate. `width` drives everything: all sizes are
 * expressed in `u = width / 100`, mirroring the `cqw` units of the design.
 */
export function drawCertificate(ctx: CanvasRenderingContext2D, width: number, data: CertificateData): void {
  const height = Math.round(width / CERTIFICATE_ASPECT);
  const u = width / 100;

  ctx.clearRect(0, 0, width, height);
  setLetterSpacing(ctx, '0px');

  // --- Paper stock -------------------------------------------------------
  const paper = ctx.createLinearGradient(0, 0, width * 0.5, height);
  paper.addColorStop(0, '#ffffff');
  paper.addColorStop(1, '#f4f7ff');
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, width, height);

  // Guilloche: engine-turned crosshatch, as on banknote/diploma stock.
  ctx.save();
  ctx.strokeStyle = 'rgba(37, 99, 235, 0.07)';
  ctx.lineWidth = Math.max(1, 0.11 * u);
  const step = 0.9 * u;
  for (let i = -height; i < width + height; i += step) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + height, height);
    ctx.moveTo(i, height);
    ctx.lineTo(i + height, 0);
    ctx.stroke();
  }
  ctx.restore();

  // Corner vignette, so the sheet reads as printed rather than flat.
  const vignette = ctx.createRadialGradient(width / 2, height / 2, height * 0.34, width / 2, height / 2, width * 0.72);
  vignette.addColorStop(0, 'rgba(37, 99, 235, 0)');
  vignette.addColorStop(1, 'rgba(37, 99, 235, 0.09)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  // Sheen from above.
  const sheen = ctx.createRadialGradient(width / 2, -height * 0.1, 0, width / 2, -height * 0.1, height * 0.75);
  sheen.addColorStop(0, 'rgba(37, 99, 235, 0.10)');
  sheen.addColorStop(1, 'rgba(37, 99, 235, 0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, width, height);

  // --- Ghosted logo watermark -------------------------------------------
  ctx.save();
  ctx.globalAlpha = 0.05;
  drawPath(ctx, LOGO_PATH, 48, (width - 46 * u) / 2, (height - 46 * u) / 2, 46 * u, { fill: ACCENT });
  ctx.restore();

  // --- Engraved frame: accent band, hairline, inner rule -----------------
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth = 1.5 * u;
  ctx.strokeRect(0.75 * u, 0.75 * u, width - 1.5 * u, height - 1.5 * u);

  ctx.strokeStyle = '#93b4ff';
  ctx.lineWidth = 0.12 * u;
  ctx.strokeRect(1.56 * u, 1.56 * u, width - 3.12 * u, height - 3.12 * u);

  ctx.strokeStyle = RULE;
  ctx.lineWidth = 0.12 * u;
  ctx.strokeRect(2.4 * u, 2.4 * u, width - 4.8 * u, height - 4.8 * u);

  // --- Content (top-down, mirroring the flex column) ---------------------
  const cx = width / 2;
  const contentWidth = 82 * u;
  let y = 5.4 * u;

  // Brand: logo + wordmark
  const markSize = 3.6 * u;
  ctx.font = `700 ${2.5 * u}px ${FONT_HEAD}`;
  const brandTextWidth = ctx.measureText('TutorMe').width;
  const brandWidth = markSize + 1.1 * u + brandTextWidth;
  const brandX = cx - brandWidth / 2;
  drawPath(ctx, LOGO_PATH, 48, brandX, y, markSize, { fill: ACCENT });
  ctx.save();
  ctx.translate(brandX + markSize + 1.1 * u, y + markSize / 2);
  ctx.rotate((-2 * Math.PI) / 180);
  ctx.fillStyle = ACCENT;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('TutorMe', 0, 0);
  ctx.restore();
  y += markSize;

  // Eyebrow
  y += 2.6 * u;
  setLetterSpacing(ctx, `${0.45 * u}px`);
  ctx.font = `700 ${1.25 * u}px ${FONT_BODY}`;
  ctx.fillStyle = INK_SOFT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('CERTIFICATE OF COMPLETION', cx, y);
  setLetterSpacing(ctx, '0px');
  y += 1.5 * u;

  // Title
  y += 0.7 * u;
  drawFitted(ctx, 'Certificate of Completion', cx, y, contentWidth, 4.4 * u, FONT_HEAD, '700', INK);
  y += 4.84 * u;

  // Hand-drawn flourish
  y += 0.6 * u;
  drawPath(ctx, FLOURISH_PATH, 200, cx - 11 * u, y, 22 * u, { stroke: ACCENT, lineWidth: 4 });
  y += 1.2 * u;

  // "presented to"
  y += 2.2 * u;
  ctx.font = `600 ${1.5 * u}px ${FONT_BODY}`;
  ctx.fillStyle = INK_SOFT;
  ctx.fillText('This certificate is proudly presented to', cx, y);
  y += 1.8 * u;

  // Recipient name + rule beneath it
  y += 0.6 * u;
  drawFitted(ctx, data.userName || 'Your Name', cx, y, contentWidth, 5.6 * u, FONT_HEAD, '700', ACCENT);
  y += 6.44 * u + 0.8 * u;
  ctx.strokeStyle = RULE;
  ctx.lineWidth = 0.15 * u;
  ctx.beginPath();
  ctx.moveTo(cx - 23 * u, y);
  ctx.lineTo(cx + 23 * u, y);
  ctx.stroke();
  y += 0.15 * u;

  // Course line
  y += 2 * u;
  ctx.font = `600 ${1.6 * u}px ${FONT_BODY}`;
  ctx.fillStyle = INK_SOFT;
  ctx.fillText('for successfully completing the course', cx, y);
  y += 2.64 * u;

  y += 0.4 * u;
  drawFitted(ctx, data.courseTitle || 'Course', cx, y, contentWidth, 2.6 * u, FONT_HEAD, '700', INK);

  // --- Footer: date | seal | issuer (bottom-anchored) --------------------
  const footerBottom = height - 4.6 * u;
  const columnWidth = (contentWidth - 11.5 * u - 4 * u) / 2;
  const leftCentre = 9 * u + columnWidth / 2;
  const rightCentre = 9 * u + columnWidth + 2 * u + 11.5 * u + 2 * u + columnWidth / 2;

  const drawSignature = (centre: number, value: string, label: string) => {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    setLetterSpacing(ctx, `${0.16 * u}px`);
    ctx.font = `700 ${1.05 * u}px ${FONT_BODY}`;
    ctx.fillStyle = INK_SOFT;
    ctx.fillText(label.toUpperCase(), centre, footerBottom);
    setLetterSpacing(ctx, '0px');

    const ruleY = footerBottom - 1.26 * u - 0.5 * u;
    ctx.strokeStyle = RULE;
    ctx.lineWidth = 0.14 * u;
    ctx.beginPath();
    ctx.moveTo(centre - columnWidth / 2, ruleY);
    ctx.lineTo(centre + columnWidth / 2, ruleY);
    ctx.stroke();

    ctx.font = `700 ${2.1 * u}px ${FONT_HEAD}`;
    ctx.fillStyle = INK;
    ctx.fillText(value, centre, ruleY - 1 * u, columnWidth);
  };

  drawSignature(
    leftCentre,
    data.completedAt.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }),
    'Date of completion',
  );
  drawSignature(rightCentre, 'TutorMe Certificates', 'Issued & verified by');

  // Seal
  const sealSize = 11.5 * u;
  const sealX = cx - sealSize / 2;
  const sealY = footerBottom - sealSize;
  ctx.save();
  ctx.translate(sealX, sealY);
  ctx.scale(sealSize / 100, sealSize / 100);
  ctx.strokeStyle = ACCENT;
  ctx.setLineDash([5, 4]);
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(50, 50, 33, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = ACCENT;
  ctx.beginPath();
  ctx.arc(50, 50, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(50, 50, 26, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  drawPath(ctx, SEAL_STAR_PATH, 100, sealX, sealY, sealSize, { fill: ACCENT });
  ctx.save();
  ctx.globalAlpha = 0.85;
  drawPath(ctx, SEAL_RIBBON_PATH, 100, sealX, sealY, sealSize, { fill: ACCENT });
  ctx.restore();
}

/**
 * Wraps a JPEG in a minimal single-page PDF sized to A4 landscape.
 * The image is embedded as-is with the DCTDecode filter — no re-encoding.
 */
export function jpegToPdf(jpeg: Uint8Array<ArrayBuffer>, pixelWidth: number, pixelHeight: number): Blob {
  const parts: BlobPart[] = [];
  const offsets: number[] = [];
  let length = 0;

  // All literal strings here are ASCII, so String#length === byte length.
  const push = (part: string | Uint8Array<ArrayBuffer>) => {
    parts.push(part);
    length += typeof part === 'string' ? part.length : part.byteLength;
  };
  const startObject = () => { offsets.push(length); };

  push('%PDF-1.4\n');

  startObject();
  push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  startObject();
  push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

  startObject();
  push(
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + PAGE_WIDTH_PT + ' ' + PAGE_HEIGHT_PT + ']' +
    ' /Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>\nendobj\n',
  );

  // Scale the image to exactly fill the page (it already has the A4 ratio).
  const content = 'q ' + PAGE_WIDTH_PT + ' 0 0 ' + PAGE_HEIGHT_PT + ' 0 0 cm /Im0 Do Q\n';
  startObject();
  push('4 0 obj\n<< /Length ' + content.length + ' >>\nstream\n' + content + 'endstream\nendobj\n');

  startObject();
  push(
    '5 0 obj\n<< /Type /XObject /Subtype /Image /Width ' + pixelWidth + ' /Height ' + pixelHeight +
    ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + jpeg.byteLength + ' >>\nstream\n',
  );
  push(jpeg);
  push('\nendstream\nendobj\n');

  const xrefOffset = length;
  let xref = 'xref\n0 ' + (offsets.length + 1) + '\n0000000000 65535 f \n';
  for (const offset of offsets) {
    xref += String(offset).padStart(10, '0') + ' 00000 n \n';
  }
  push(xref);
  push('trailer\n<< /Size ' + (offsets.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + xrefOffset + '\n%%EOF\n');

  return new Blob(parts, { type: 'application/pdf' });
}

/** "TutorMe-Certificate-Intro-to-ML.pdf" */
export function certificateFileName(courseTitle: string): string {
  const slug = courseTitle.trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').slice(0, 60) || 'Course';
  return 'TutorMe-Certificate-' + slug + '.pdf';
}

/** Renders and downloads the certificate PDF without needing a visible preview canvas. */
export async function downloadCertificatePdf(data: CertificateData): Promise<void> {
  await ensureCertificateFonts();
  const canvas = document.createElement('canvas');
  canvas.width = CERTIFICATE_PIXEL_WIDTH;
  canvas.height = Math.round(CERTIFICATE_PIXEL_WIDTH / CERTIFICATE_ASPECT);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable.');
  drawCertificate(ctx, canvas.width, data);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
  if (!blob) throw new Error('Canvas export failed.');

  const pdf = jpegToPdf(new Uint8Array(await blob.arrayBuffer()), canvas.width, canvas.height);
  const url = URL.createObjectURL(pdf);
  const link = document.createElement('a');
  link.href = url;
  link.download = certificateFileName(data.courseTitle);
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Ensures the Kalam/Nunito webfonts are loaded before the canvas draws text. */
export async function ensureCertificateFonts(): Promise<void> {
  const href = 'https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&family=Nunito:wght@400;600;700;800&display=swap';
  if (!document.querySelector('link[href="' + href + '"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }
  try {
    await Promise.all([
      document.fonts.load('700 100px Kalam'),
      document.fonts.load('600 100px Nunito'),
      document.fonts.load('700 100px Nunito'),
    ]);
  } catch {
    /* Fonts are cosmetic: fall back to the generic families. */
  }
}
