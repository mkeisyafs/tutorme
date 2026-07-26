/**
 * Self-check for the hand-rolled PDF writer:
 *   node src/lib/certificate.selfcheck.mjs
 *
 * Imports the real certificate.ts (Node strips the types) and verifies the
 * one part of the PDF format that silently corrupts a file if it drifts:
 * every xref byte offset must land exactly on its object header.
 */
import assert from 'node:assert/strict';
import { jpegToPdf, certificateFileName } from './certificate.ts';

// A structurally real, minimal JPEG payload (SOI … EOI).
const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0xff, 0xd9]);

const blob = jpegToPdf(jpeg, 2400, 1697);
assert.equal(blob.type, 'application/pdf', 'blob is a PDF');

// latin1 keeps every byte 1:1, so string offsets == byte offsets.
const bytes = Buffer.from(await blob.arrayBuffer());
const text = bytes.toString('latin1');

assert.ok(text.startsWith('%PDF-1.4'), 'starts with the PDF header');
assert.ok(text.endsWith('%%EOF\n'), 'ends with EOF');
assert.ok(text.includes('/MediaBox [0 0 841.89 595.28]'), 'page is A4 landscape');
assert.ok(text.includes('/Filter /DCTDecode'), 'JPEG embedded, not re-encoded');

// Parse startxref and walk the xref table the way a PDF reader would.
const startxref = Number(/startxref\n(\d+)/.exec(text)[1]);
assert.ok(text.startsWith('xref\n', startxref), 'startxref points at the xref table');

const xrefBody = text.slice(startxref);
const entries = [...xrefBody.matchAll(/^(\d{10}) 00000 n $/gm)].map((m) => Number(m[1]));
assert.equal(entries.length, 5, 'five in-use objects');
entries.forEach((offset, index) => {
  assert.ok(
    text.startsWith(`${index + 1} 0 obj`, offset),
    `xref entry ${index + 1} (offset ${offset}) lands on its object header`,
  );
});

// The image stream must survive byte-for-byte, with a matching declared length.
assert.ok(bytes.includes(jpeg), 'JPEG bytes present unchanged');
assert.ok(text.includes('/Length ' + jpeg.byteLength), 'declared stream length matches');
assert.ok(text.includes('/Width 2400') && text.includes('/Height 1697'), 'image dimensions recorded');

// Filename slugging.
assert.equal(certificateFileName('Intro to ML: Part 1'), 'TutorMe-Certificate-Intro-to-ML-Part-1.pdf');
assert.equal(certificateFileName('   '), 'TutorMe-Certificate-Course.pdf');

console.log(`certificate self-check passed (${bytes.length} byte PDF, ${entries.length} objects)`);
