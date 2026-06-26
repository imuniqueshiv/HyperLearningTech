"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";

import "katex/dist/katex.min.css";
import "highlight.js/styles/github-dark.css";

interface AnswerViewerProps {
  answer: string;
}

/**
 * The model sometimes chains multiple solution steps ("Path 1: ...",
 * "Step 2: ...", "C1: ...", "1. ...") into a single run-on paragraph
 * with no line breaks in between. ReactMarkdown can only respect line
 * breaks that exist in the source text, so this preprocessor forces
 * those breaks back in before rendering — on top of normalizing LaTeX
 * delimiters and making sure display math always sits on its own block.
 */
function preprocessMath(text: string): string {
  let result = text
    .replace(/\r\n/g, "\n")
    .replace(/\\\[/g, "$$")
    .replace(/\\\]/g, "$$")
    .replace(/\\\(/g, "$")
    .replace(/\\\)/g, "$");

  // Force display math ($$...$$) onto its own block, separated from
  // surrounding text by blank lines, so it renders as a standalone
  // equation instead of getting swallowed into a paragraph.
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_match, expr) => {
    return `\n\n$$${expr.trim()}$$\n\n`;
  });

  // Insert a paragraph break before common "step/part" labels that the
  // model tends to chain together mid-sentence instead of starting a
  // new line (e.g. "Path 1:", "Step 2:", "Case 3:", "C1:", "Q2:").
  const stepLabelPattern =
    /([.!?:)])\s+(?=(?:Path\s*\d+|Step\s*\d+|Case\s*\d+|Part\s*\d+|C\d+\s*:|Q\d+\s*:|\d+\.\s))/g;
  result = result.replace(stepLabelPattern, "$1\n\n");

  // Force numbered list markers onto their own line even when they
  // appear mid-sentence rather than at the start of a line.
  result = result.replace(/([^\n])\s+(\d+\.\s)/g, "$1\n\n$2");

  // Collapse any accidental triple+ blank lines down to a single blank line.
  result = result.replace(/\n{3,}/g, "\n\n");

  return result.trim();
}

const markdownComponents = {
  pre({ children }: any) {
    return (
      <pre className="my-6 overflow-x-auto rounded-xl border border-border bg-black/90 p-4 sm:p-6 shadow-sm">
        {children}
      </pre>
    );
  },

  code({ className, children }: any) {
    const isCodeBlock = className?.includes("language-");

    if (isCodeBlock) {
      return <code className={className}>{children}</code>;
    }

    return (
      <code className="rounded-md bg-muted px-1.5 py-1 text-sm sm:text-base text-blue-600 dark:text-blue-400">
        {children}
      </code>
    );
  },

  table({ children }: any) {
    return (
      <div className="my-6 overflow-x-auto">
        <table className="w-full border-collapse border border-border text-sm sm:text-base">
          {children}
        </table>
      </div>
    );
  },

  th({ children }: any) {
    return (
      <th className="border border-border bg-muted px-3 sm:px-4 py-2 text-left font-semibold text-foreground">
        {children}
      </th>
    );
  },

  td({ children }: any) {
    return (
      <td className="border border-border px-3 sm:px-4 py-2 text-foreground">
        {children}
      </td>
    );
  },

  blockquote({ children }: any) {
    return (
      <blockquote className="my-5 border-l-4 border-blue-500 bg-blue-500/5 pl-4 sm:pl-6 py-2 rounded-r-xl italic text-muted-foreground">
        {children}
      </blockquote>
    );
  },

  h1({ children }: any) {
    return (
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 mt-8 border-b border-border pb-3">
        {children}
      </h1>
    );
  },

  h2({ children }: any) {
    return (
      <h2 className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4 mt-10 border-l-4 border-blue-500 pl-4">
        {children}
      </h2>
    );
  },

  h3({ children }: any) {
    return (
      <h3 className="text-lg sm:text-xl font-bold text-cyan-600 dark:text-cyan-400 mb-3 mt-8">
        {children}
      </h3>
    );
  },

  h4({ children }: any) {
    return (
      <h4 className="text-base sm:text-lg font-semibold text-emerald-600 dark:text-emerald-400 mb-2 mt-6">
        {children}
      </h4>
    );
  },

  hr() {
    return <hr className="my-8 border-border" />;
  },

  ul({ children }: any) {
    return (
      <ul className="list-disc pl-6 sm:pl-8 my-5 space-y-2">{children}</ul>
    );
  },

  ol({ children }: any) {
    return (
      <ol className="list-decimal pl-6 sm:pl-8 my-5 space-y-2">{children}</ol>
    );
  },

  li({ children }: any) {
    return (
      <li className="text-base sm:text-lg leading-[1.8] sm:leading-[1.9] mb-3 text-foreground">
        {children}
      </li>
    );
  },

  p({ children }: any) {
    return (
      <p className="text-base sm:text-lg leading-[1.8] sm:leading-[1.9] mb-5 text-foreground">
        {children}
      </p>
    );
  },

  strong({ children }: any) {
    return (
      <strong className="font-semibold text-foreground">{children}</strong>
    );
  },

  em({ children }: any) {
    return <em className="italic text-muted-foreground">{children}</em>;
  },
} as any;

export default function AnswerViewer({ answer }: AnswerViewerProps) {
  const content = preprocessMath(answer);

  return (
    <div
      className="
        prose dark:prose-invert
        max-w-none
        px-4 sm:px-0

        prose-headings:text-foreground
        prose-headings:font-bold

        prose-h1:text-2xl
        sm:prose-h1:text-3xl
        prose-h1:mb-6
        prose-h1:mt-8
        prose-h1:border-b
        prose-h1:border-border
        prose-h1:pb-3

        prose-h2:text-xl
        sm:prose-h2:text-2xl
        prose-h2:mb-4
        prose-h2:mt-10
        prose-h2:text-blue-600
        prose-h2:border-l-4
        prose-h2:border-blue-500
        prose-h2:pl-4

        prose-h3:text-lg
        sm:prose-h3:text-xl
        prose-h3:mb-3
        prose-h3:mt-8
        prose-h3:text-cyan-600

        prose-h4:text-base
        sm:prose-h4:text-lg
        prose-h4:mb-2
        prose-h4:mt-6
        prose-h4:text-emerald-600

        prose-p:text-base
        sm:prose-p:text-lg
        prose-p:leading-[1.8]
        sm:prose-p:leading-[1.9]
        prose-p:mb-5
        prose-p:text-foreground

        prose-li:text-base
        sm:prose-li:text-lg
        prose-li:leading-[1.8]
        sm:prose-li:leading-[1.9]
        prose-li:mb-3

        prose-strong:text-foreground
        prose-strong:font-semibold

        prose-em:text-muted-foreground
        prose-em:italic

        prose-code:text-blue-600
        dark:prose-code:text-blue-400
        prose-code:before:content-none
        prose-code:after:content-none
        prose-code:text-sm
        sm:prose-code:text-base

        prose-pre:bg-black/90
        prose-pre:border
        prose-pre:border-border
        prose-pre:rounded-xl
        prose-pre:p-4
        sm:prose-pre:p-6
        prose-pre:my-6
        prose-pre:overflow-x-auto

        prose-blockquote:border-l-4
        prose-blockquote:border-blue-500
        prose-blockquote:pl-4
        sm:prose-blockquote:pl-6
        prose-blockquote:py-2
        prose-blockquote:my-5
        prose-blockquote:bg-blue-500/5
        prose-blockquote:rounded-r-xl
        prose-blockquote:text-muted-foreground
        prose-blockquote:italic

        prose-table:w-full
        prose-table:border-collapse
        prose-table:my-6
        prose-table:text-sm
        sm:prose-table:text-base

        prose-th:border
        prose-th:border-border
        prose-th:bg-muted
        prose-th:px-3
        sm:prose-th:px-4
        prose-th:py-2
        prose-th:text-left
        prose-th:font-semibold
        prose-th:text-foreground

        prose-td:border
        prose-td:border-border
        prose-td:px-3
        sm:prose-td:px-4
        prose-td:py-2
        prose-td:text-foreground

        prose-ul:list-disc
        prose-ul:pl-6
        sm:prose-ul:pl-8
        prose-ul:my-5
        prose-ul:space-y-2

        prose-ol:list-decimal
        prose-ol:pl-6
        sm:prose-ol:pl-8
        prose-ol:my-5
        prose-ol:space-y-2

        prose-hr:border-border
        prose-hr:my-8

        [&_.katex-display]:overflow-x-auto
        [&_.katex-display]:overflow-y-hidden
        [&_.katex-display]:my-6
        [&_.katex-display]:py-2
        [&_.katex-display]:px-1
        [&_.katex]:text-[1.05em]
        sm:[&_.katex]:text-[1.1em]
      "
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeHighlight]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
