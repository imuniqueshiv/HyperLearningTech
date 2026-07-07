# Question Attachment Contribution Guide

This document defines the standard workflow for contributing question attachments to Hyper Learning.

Attachments include any visual material that accompanies a question, such as:

- Circuit diagrams
- Flowcharts
- Engineering drawings
- Graphs
- Tables
- Mathematical figures
- Block diagrams
- Network topologies
- State diagrams
- UML diagrams
- Chemical structures
- Timing diagrams
- Truth tables
- Maps
- Any other educational figure

Following this guide ensures:

- Consistent project structure
- High-quality educational content
- Better accessibility
- Faster page loading
- Reliable AI explanations
- Easier long-term maintenance
- Consistent contributor workflow

---

# Attachment Workflow

Every attachment should follow the same workflow.

```
Question Paper
      │
      ▼
Extract Original Figure
      │
      ▼
Clean & Enhance
      │
      ▼
Convert to WebP
      │
      ▼
Store in Subject Folder
      │
      ▼
Update pyqs.json
      │
      ▼
Verify Rendering
      │
      ▼
Verify AI Context
      │
      ▼
Run Project Checks
```

---

# Step 1 — Extract the Original Figure

Obtain the figure from one of the following sources:

- Official university question paper
- Official examination paper
- Official model paper
- Other authentic educational source

The attachment must represent the original question accurately.

Never redraw or simplify the original content unless the source itself is unreadable.

---

# Step 2 — Clean and Enhance

Before adding the attachment to the repository:

- Remove scan noise
- Remove paper stains
- Remove shadows
- Straighten the image
- Improve contrast
- Improve sharpness
- Improve readability
- Preserve all labels
- Preserve all symbols
- Preserve all dimensions
- Preserve all annotations
- Preserve all values
- Preserve all arrows
- Preserve all node names
- Preserve all captions

The enhanced image should look like a clean textbook illustration while remaining identical to the original.

Do NOT:

- Redraw the figure
- Change values
- Change labels
- Remove information
- Add information
- Invent missing content
- Simplify the diagram

Goal:

Create a high-resolution educational figure without altering its meaning.

---

# Step 3 — AI Image Enhancement

We recommend using Gemini or another high-quality AI image enhancement tool.

Suggested prompt:

> Enhance this scanned educational figure.
>
> Requirements:
>
> - Preserve the original exactly.
> - Do not modify labels.
> - Do not modify values.
> - Do not modify symbols.
> - Do not remove annotations.
> - Remove scan noise.
> - Remove stains.
> - Improve sharpness.
> - Produce a clean white background.
> - Generate a high-resolution textbook-quality version.
> - Preserve every visible element exactly.

Always compare the enhanced image with the original before accepting it.

---

# Step 4 — Convert to WebP

Convert the final image to WebP.

Requirements:

- Format: `.webp`
- High quality (80–90%)
- Lossless if necessary
- White background
- No unnecessary transparency

Why WebP?

- Smaller file size
- Faster rendering
- Better browser support
- Reduced bandwidth usage

---

# Step 5 — Folder Structure

Every subject owns its own attachments.

```
content/
└── rgpv/
    └── <branch>/
        └── <semester>/
            └── <subject>/
                ├── pyqs.json
                ├── syllabus.json
                └── diagrams/
```

Example

```
content/
└── rgpv/
    └── common/
        └── semester-2/
            └── bt-104/
                ├── pyqs.json
                ├── syllabus.json
                └── diagrams/
                    └── november-2022/
                        ├── Q.1-a-dec-2022.webp
                        └── Q.1-b-dec-2022.webp
```

Attachments must remain inside the subject directory.

Do NOT move them into:

```
public/
```

They are served securely through the content attachment API.

---

# Step 6 — File Naming

Use the following naming convention.

```
Q.<question>-<subquestion>-<month>-<year>.webp
```

Examples

```
Q.1-a-dec-2022.webp

Q.1-b-dec-2022.webp

Q.6-a-june-2025.webp
```

Rules:

- Use lowercase month names.
- Do not use spaces.
- Keep names descriptive and consistent.

---

# Step 7 — Update pyqs.json

If a question includes a figure, add an `attachments` array.

Example

```json
{
  "id": "q1a",
  "label": "a)",
  "text": "Question text...",
  "unit": "Unit 1",
  "type": "dc-circuits",
  "attachments": [
    {
      "id": "q1a-img-1",
      "type": "image",
      "path": "november-2022/Q.1-a-dec-2022.webp",
      "title": "Circuit Diagram",
      "alt": "Electrical circuit for determining the current through a resistor.",
      "caption": "Figure for Question 1(a).",
      "aiContext": "Detailed description of the figure."
    }
  ]
}
```

Only add `attachments` when a question actually contains a figure.

Questions without figures should not include this field.

---

# Attachment Field Reference

## id

Must be unique within the question.

Examples

```
q1a-img-1

q2b-img-1

q5a-img-2
```

---

## type

Currently supported

```
image
```

Future supported types

```
image

table

graph

equation

latex

pdf

animation

video

audio

3d-model
```

---

## path

Relative path inside the subject's `diagrams` folder.

Correct

```
november-2022/Q.1-a-dec-2022.webp
```

Incorrect

```
public/images/example.webp
```

---

## title

A short descriptive title.

Examples

```
Circuit Diagram

Flowchart

Block Diagram

Graph

Engineering Drawing

State Diagram

Truth Table
```

---

## alt

Used for accessibility.

Describe the attachment itself.

Example

```
Block diagram showing the architecture of a microprocessor.
```

Do NOT explain the solution.

---

## caption

Displayed below the attachment.

Examples

```
Figure for Question 1(a).

Figure (ii) for Question 2(b).

Block Diagram for Question 5(a).
```

---

## aiContext

This is the most important field.

The AI does not interpret the image directly.

Instead, it receives this structured description.

Describe:

- Overall layout
- Visible components
- Labels
- Values
- Symbols
- Node names
- Branches
- Arrows
- Relationships
- Connections
- Measurements
- Coordinates (if relevant)
- Axes (for graphs)
- Legends (if present)
- Captions inside the image
- Tables
- Figure numbering
- What the student is asked to determine

Do NOT:

- Explain the answer
- Solve the problem
- Add assumptions
- Invent missing information

The description should be factual, complete, and objective.

---

# Step 8 — Verification

After updating the attachment:

Verify:

- Image renders correctly
- Caption renders correctly
- Responsive layout works
- Dark mode works
- Mobile layout works
- No console errors
- AI answer still works
- AI prompt contains attachment context
- Attachment path resolves correctly
- Missing image fallback works
- Build passes successfully

---

# Common Mistakes

Avoid the following:

❌ Storing attachments in `public/`

❌ Changing educational content

❌ Cropping labels

❌ Cropping dimensions

❌ Cropping legends

❌ Removing arrows

❌ Removing annotations

❌ Incorrect file naming

❌ Incorrect attachment path

❌ Duplicate attachment IDs

❌ Writing solution steps inside `aiContext`

❌ Using absolute file paths

---

# AI Meta Prompt

Use the following prompt with ChatGPT, Gemini, Claude, or another AI model when generating the `aiContext` field.

---

## Meta Prompt

You are creating structured metadata for an educational figure used in an AI-powered learning platform.

Do NOT solve the question.

Do NOT explain any concepts.

Only describe the visual content accurately.

Requirements:

- Describe the overall structure of the figure.
- Identify every visible component.
- Mention all labels exactly as shown.
- Mention all numerical values.
- Mention symbols exactly as shown.
- Mention arrows and their directions.
- Mention node names or reference labels.
- Mention all connections and relationships.
- Mention legends, captions, or annotations if present.
- Mention axes and scales for graphs.
- Mention dimensions where applicable.
- Mention tables or grouped information if present.
- Preserve terminology from the original figure.
- State what quantity or result the student is required to determine.
- Do not omit any visible information.
- Do not infer hidden information.
- Do not invent missing values.
- Produce a single detailed paragraph suitable for use as `aiContext`.

---

# Quality Standards

Every attachment added to Hyper Learning should satisfy the following requirements:

- High resolution
- Sharp text
- Clean white background
- Accurate colors (if applicable)
- Original proportions maintained
- No compression artifacts
- No missing labels
- No cropped information
- Consistent naming
- Consistent JSON structure

---

# Final Checklist

Before opening a Pull Request, verify:

- Figure extracted from an authentic source.
- Image cleaned without changing the original content.
- Converted to WebP.
- Stored in the correct `content/.../diagrams/` directory.
- Correct filename.
- `attachments` added only where required.
- `id` is unique.
- `path` is correct.
- `title` added.
- `alt` added.
- `caption` added.
- `aiContext` added.
- Attachment renders correctly.
- Missing image fallback works.
- AI includes the attachment context.
- `npm run format:check` passes.
- `npm run lint` passes.
- `npm run typecheck` passes.
- `npm run build` passes.
