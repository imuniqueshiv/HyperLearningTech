import assert from "node:assert/strict";
import test from "node:test";

import {
  composePyqQuestionMarkdown,
  normalizePyqMathText,
  splitQuestionText,
} from "../../lib/pyqs/normalize-pyq-math";

const NDFA_TEXT =
  "Convert the given NDFA to an equivalent DFA: States ${q0, q1}$, Alphabet ${a, b}$, Transitions: $\\delta(q0, a)={q0, q1}$, $\\delta(q0, b)={q0}$, $\\delta(q1, b)={q1}$. Final state= $q1$";

test("normalizes set-brace extraction artifacts for automata notation", () => {
  const out = normalizePyqMathText(NDFA_TEXT);
  assert.match(out, /\$\\\{q0, q1\\\}/);
  assert.match(out, /\$\\\{a, b\\\}/);
  assert.match(out, /\\delta\(q0, a\)=\\\{q0, q1\\\}/);
  assert.doesNotMatch(out, /\$\{q0, q1\}/);
});

test("preserves plain English questions without inventing math", () => {
  const plain =
    "Explain the difference between deadlock and starvation with examples.";
  assert.equal(normalizePyqMathText(plain), plain);
});

test("preserves literal alt='' diagram placeholders", () => {
  const withAlt =
    "Draw the transition diagram for the following NFA. alt='' Label all states.";
  assert.equal(normalizePyqMathText(withAlt), withAlt);
});

test("converts \\( \\) and \\[ \\] delimiters", () => {
  assert.equal(
    normalizePyqMathText("Let \\(x^2\\) be given."),
    "Let $x^2$ be given."
  );
  assert.match(
    normalizePyqMathText("Show that \\[E=mc^2\\]."),
    /\$\$E=mc\^2\$\$/
  );
});

test("appends display latex tables when text lacks them", () => {
  const text =
    "Consider the following snapshot of a system and answer using Banker's Algorithm.";
  const latex =
    "$$\\begin{array}{|c|c|}\\hline P1 & 1 \\\\\\hline\\end{array}$$";
  const composed = composePyqQuestionMarkdown(text, latex);
  assert.match(composed, /Banker's Algorithm/);
  assert.match(composed, /\\begin\{array\}/);
});

test("does not duplicate latex when it is only inline enrichment", () => {
  const text = "States $\\{q0, q1\\}$ Alphabet $\\{a, b\\}$";
  const latex = "States \\{q0, q1\\}, Alphabet \\{a, b\\}";
  assert.equal(composePyqQuestionMarkdown(text, latex), text);
});

test("splitQuestionText keeps roman-numeral parts separate", () => {
  const parts = splitQuestionText(
    "Answer the following: i) First part. ii) Second part."
  );
  assert.equal(parts.length, 3);
  assert.match(parts[1], /^i\)/);
  assert.match(parts[2], /^ii\)/);
});

test("supports functional-dependency and sigma notation samples", () => {
  const fd = normalizePyqMathText(
    "Identify keys for R. Dependencies:\n$A \\to BC$\n$C \\to E$"
  );
  assert.match(fd, /\$A \\to BC\$/);

  const sigma = normalizePyqMathText(
    "For $\\Sigma = \\{a, b\\}$, construct DFA's that accept the sets."
  );
  assert.match(sigma, /\\Sigma = \\\{a, b\\\}/);
});
