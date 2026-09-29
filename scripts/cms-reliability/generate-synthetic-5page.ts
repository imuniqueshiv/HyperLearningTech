/**
 * Generates a synthetic 5-page native-text PDF for page-limit / performance probing.
 * Clearly synthetic — not a real RGPV scan.
 */
import fs from "node:fs";
import path from "node:path";

function pdfEscape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function pageContent(page: number): string {
  const lines = [
    `BT /F1 14 Tf 50 750 Td (${pdfEscape(`Synthetic 5-page fixture page ${page}`)}) Tj ET`,
    `BT /F1 11 Tf 50 720 Td (${pdfEscape(`Q.${page} Sample question on page ${page}.`)}) Tj ET`,
    `BT /F1 11 Tf 50 700 Td (${pdfEscape(`a) Subquestion with value ${(page * 1.5).toFixed(1)}.`)}) Tj ET`,
    `BT /F1 11 Tf 50 680 Td (${pdfEscape(`b) Marks ${page + 6}`)}) Tj ET`,
  ];
  return lines.join("\n") + "\n";
}

const pageCount = 5;
const objects: string[] = [];
// Catalog + Pages
objects.push("1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n");
const kidRefs = Array.from(
  { length: pageCount },
  (_, i) => `${3 + i * 2} 0 R`
).join(" ");
objects.push(
  `2 0 obj<< /Type /Pages /Kids [${kidRefs}] /Count ${pageCount} >>endobj\n`
);

for (let i = 0; i < pageCount; i += 1) {
  const pageObj = 3 + i * 2;
  const contentObj = pageObj + 1;
  const content = pageContent(i + 1);
  objects.push(
    `${pageObj} 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentObj} 0 R /Resources << /Font << /F1 ${3 + pageCount * 2} 0 R >> >> >>endobj\n`
  );
  objects.push(
    `${contentObj} 0 obj<< /Length ${content.length} >>stream\n${content}endstream\nendobj\n`
  );
}
const fontObj = 3 + pageCount * 2;
objects.push(
  `${fontObj} 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n`
);

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
  "scripts/cms-reliability/fixtures/synthetic-5page-native.pdf"
);
fs.writeFileSync(out, body);
console.log(`Wrote ${out} (${body.length} bytes)`);
