/**
 * Generates a minimal native-text PDF fixture for Phase 2 fast-path verification.
 * This is a synthetic native-text sample — NOT a scanned RGPV paper.
 */
import fs from "node:fs";
import path from "node:path";

function pdfEscape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

const lines = [
  "BT /F1 14 Tf 50 750 Td (" +
    pdfEscape("RGPV Native Text Fixture AL-402") +
    ") Tj ET",
  "BT /F1 11 Tf 50 720 Td (" +
    pdfEscape("Q.1 Explain asymptotic analysis of algorithms.") +
    ") Tj ET",
  "BT /F1 11 Tf 50 700 Td (" +
    pdfEscape("a) Define Big-O Big-Omega and Big-Theta.") +
    ") Tj ET",
  "BT /F1 11 Tf 50 680 Td (" +
    pdfEscape("b) Compare time complexity 2.5 and O of n squared.") +
    ") Tj ET",
  "BT /F1 11 Tf 50 650 Td (" +
    pdfEscape("Q.2 Write Kruskal algorithm steps. Marks 7") +
    ") Tj ET",
  "BT /F1 11 Tf 50 630 Td (" +
    pdfEscape("Q.3 Solve the 0/1 Knapsack for weights 10, 20, 30.") +
    ") Tj ET",
];

const content = lines.join("\n") + "\n";
const objects = [
  "1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n",
  "2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n",
  "3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>endobj\n",
  `4 0 obj<< /Length ${content.length} >>stream\n${content}endstream\nendobj\n`,
  "5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n",
];

let body = "%PDF-1.4\n";
const offsets = [0];
for (const obj of objects) {
  offsets.push(Buffer.byteLength(body, "utf8"));
  body += obj;
}
const xrefStart = Buffer.byteLength(body, "utf8");
body += `xref\n0 ${objects.length + 1}\n`;
body += "0000000000 65535 f \n";
for (let i = 1; i <= objects.length; i += 1) {
  body += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
}
body += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

const out = path.join(
  process.cwd(),
  "scripts/cms-reliability/fixtures/native-text-al402-sample.pdf"
);
fs.writeFileSync(out, body);
console.log(`Wrote ${out} (${body.length} bytes)`);
