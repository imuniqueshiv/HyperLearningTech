import type { ProductionQuestionAttachment } from "./schema-types";
import { preferNonEmptyString, safeTrim } from "./string-normalize";

export interface AttachmentMergeStats {
  attachmentsAdded: number;
}

/**
 * Merges incoming attachments into existing ones without duplicating by id or path.
 * Preserves existing non-empty fields.
 */
export function mergeAttachments(
  existing: ProductionQuestionAttachment[] | undefined,
  incoming: ProductionQuestionAttachment[] | undefined
): {
  attachments: ProductionQuestionAttachment[] | undefined;
  stats: AttachmentMergeStats;
} {
  const base = [...(existing ?? [])];
  let attachmentsAdded = 0;

  for (const attachment of incoming ?? []) {
    const byId = base.findIndex((item) => item.id === attachment.id);
    const byPath = base.findIndex(
      (item) =>
        safeTrim(item.path).replace(/\\/g, "/") ===
        safeTrim(attachment.path).replace(/\\/g, "/")
    );

    if (byId >= 0) {
      base[byId] = mergeAttachmentFields(base[byId], attachment);
      continue;
    }

    if (byPath >= 0) {
      base[byPath] = mergeAttachmentFields(base[byPath], attachment);
      continue;
    }

    base.push({ ...attachment });
    attachmentsAdded += 1;
  }

  return {
    attachments: base.length > 0 ? base : undefined,
    stats: { attachmentsAdded },
  };
}

function mergeAttachmentFields(
  existing: ProductionQuestionAttachment,
  incoming: ProductionQuestionAttachment
): ProductionQuestionAttachment {
  return {
    id: existing.id,
    type: existing.type,
    path: preferNonEmptyString(existing.path, incoming.path),
    title: preferNonEmptyString(existing.title, incoming.title),
    alt: preferNonEmptyString(existing.alt, incoming.alt),
    caption: preferNonEmptyString(existing.caption, incoming.caption),
    aiContext: preferNonEmptyString(existing.aiContext, incoming.aiContext),
  };
}
