"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

import {
  composePyqQuestionMarkdown,
  splitQuestionText,
} from "@/lib/pyqs/normalize-pyq-math";

import "katex/dist/katex.min.css";

interface QuestionTextProps {
  text: string;
  latex?: string | null;
}

const paragraphClassName =
  "text-base leading-7 text-foreground sm:text-lg sm:leading-8";

const markdownComponents: Components = {
  p({ children }) {
    return <p className={paragraphClassName}>{children}</p>;
  },
  li({ children }) {
    return <li className={paragraphClassName}>{children}</li>;
  },
  ul({ children }) {
    return <ul className="list-disc space-y-2 pl-5 sm:pl-6">{children}</ul>;
  },
  ol({ children }) {
    return <ol className="list-decimal space-y-2 pl-5 sm:pl-6">{children}</ol>;
  },
  table({ children }) {
    return (
      <div className="my-3 overflow-x-auto">
        <table className="w-full border-collapse border border-border text-sm sm:text-base">
          {children}
        </table>
      </div>
    );
  },
  th({ children }) {
    return (
      <th className="border border-border bg-muted px-3 py-2 text-left font-semibold text-foreground">
        {children}
      </th>
    );
  },
  td({ children }) {
    return (
      <td className="border border-border px-3 py-2 text-foreground">
        {children}
      </td>
    );
  },
  code({ children }) {
    return (
      <code className="rounded-md bg-muted px-1.5 py-0.5 text-sm text-foreground">
        {children}
      </code>
    );
  },
};

function MathMarkdown({ source }: { source: string }) {
  return (
    <div
      className={`
        space-y-3
        [&_.katex-display]:overflow-x-auto
        [&_.katex-display]:overflow-y-hidden
        [&_.katex-display]:my-3
        [&_.katex-display]:py-1
        [&_.katex]:text-[1.05em]
        sm:[&_.katex]:text-[1.1em]
      `}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[
          [
            rehypeKatex,
            {
              throwOnError: false,
              strict: "ignore",
              errorColor: "var(--muted-foreground)",
            },
          ],
        ]}
        components={markdownComponents}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}

/**
 * Renders PYQ sub-question text with the same Markdown + KaTeX stack used for
 * AI answers, keeping existing typography for plain prose.
 */
export default function QuestionText({ text, latex }: QuestionTextProps) {
  const segments = splitQuestionText(text);

  return (
    <div className="space-y-3">
      {segments.map((segment, index) => {
        const source = composePyqQuestionMarkdown(
          segment,
          // Attach optional latex only once, on the first segment
          index === 0 ? latex : null
        );
        return <MathMarkdown key={index} source={source} />;
      })}
    </div>
  );
}
