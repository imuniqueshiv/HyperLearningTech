export function downloadMarkdown(answer: string) {
  const blob = new Blob([answer], {
    type: "text/markdown",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `hyper-ai-answer-${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadPDF(answer: string) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to download PDF");
    return;
  }

  const isDark = document.documentElement.classList.contains("dark");
  const bgColor = isDark ? "#0a0a0a" : "#ffffff";
  const textColor = isDark ? "#e5e7eb" : "#1a1a1a";
  const borderColor = isDark ? "#1f2937" : "#e5e7eb";
  const codeBg = isDark ? "#1a1a1a" : "#f3f4f6";
  const tableHeaderBg = isDark ? "#1f2937" : "#f3f4f6";

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Hyper AI Answer</title>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            padding: 40px 24px;
            max-width: 900px;
            margin: 0 auto;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: ${bgColor};
            color: ${textColor};
            line-height: 1.8;
          }
          .prose { max-width: 100%; }
          .prose h1 { font-size: 28px; font-weight: 700; margin-bottom: 20px; margin-top: 32px; border-bottom: 2px solid ${borderColor}; padding-bottom: 12px; }
          .prose h2 { font-size: 24px; font-weight: 600; margin-bottom: 16px; margin-top: 28px; color: #2563eb; border-left: 4px solid #2563eb; padding-left: 16px; }
          .prose h3 { font-size: 20px; font-weight: 600; margin-bottom: 12px; margin-top: 24px; color: #0891b2; }
          .prose h4 { font-size: 18px; font-weight: 600; margin-bottom: 10px; margin-top: 20px; color: #059669; }
          .prose p { font-size: 16px; line-height: 1.9; margin-bottom: 16px; }
          .prose ul { padding-left: 28px; margin-bottom: 16px; }
          .prose ol { padding-left: 28px; margin-bottom: 16px; }
          .prose li { line-height: 1.9; margin-bottom: 6px; }
          .prose table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
          .prose th, .prose td { border: 1px solid ${borderColor}; padding: 10px 14px; text-align: left; }
          .prose th { background: ${tableHeaderBg}; font-weight: 600; }
          .prose blockquote { border-left: 4px solid #2563eb; padding-left: 20px; margin: 20px 0; color: #6b7280; font-style: italic; background: ${isDark ? "rgba(37, 99, 235, 0.05)" : "rgba(37, 99, 235, 0.03)"}; padding: 8px 20px; border-radius: 0 8px 8px 0; }
          .prose code { background: ${codeBg}; padding: 2px 8px; border-radius: 4px; font-size: 14px; font-family: "Courier New", monospace; color: #2563eb; }
          .prose pre { background: ${isDark ? "#1a1a1a" : "#1a1a1a"}; color: #e5e7eb; padding: 20px; border-radius: 8px; overflow-x: auto; margin: 20px 0; border: 1px solid ${borderColor}; }
          .prose pre code { background: transparent; color: #e5e7eb; padding: 0; font-size: 14px; }
          .prose hr { border: none; border-top: 1px solid ${borderColor}; margin: 28px 0; }
          .prose strong { font-weight: 600; color: ${isDark ? "#ffffff" : "#111827"}; }
          .prose img { max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0; }
          .katex-display { margin: 16px 0; overflow-x: auto; padding: 8px 0; }
          .katex { font-size: 1.1em; }
          @media print {
            body { padding: 20px; }
            .prose h1 { page-break-after: avoid; }
            .prose h2 { page-break-after: avoid; }
            .prose h3 { page-break-after: avoid; }
            .prose table { page-break-inside: avoid; }
            .prose pre { page-break-inside: avoid; }
            .prose blockquote { page-break-inside: avoid; }
          }
          @media (max-width: 600px) {
            body { padding: 20px 16px; }
            .prose h1 { font-size: 22px; }
            .prose h2 { font-size: 20px; }
            .prose h3 { font-size: 18px; }
            .prose p { font-size: 15px; }
            .prose table { font-size: 13px; }
            .prose th, .prose td { padding: 6px 10px; }
          }
        </style>
        <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" />
        <script>
          document.addEventListener('DOMContentLoaded', function() {
            // Render KaTeX math
            const mathElements = document.querySelectorAll('.math, .katex-math');
            mathElements.forEach(function(el) {
              try {
                const display = el.classList.contains('display') || el.tagName === 'DIV';
                katex.render(el.textContent, el, { displayMode: display, throwOnError: false });
              } catch(e) {
                console.warn('KaTeX error:', e);
              }
            });
          });
        </script>
      </head>
      <body>
        <div class="prose" id="pdf-content"></div>
        <script>
          setTimeout(function() {
            window.print();
          }, 500);
        </script>
      </body>
    </html>
  `);

  printWindow.document.getElementById("pdf-content")!.textContent = answer;
  printWindow.document.close();
}
