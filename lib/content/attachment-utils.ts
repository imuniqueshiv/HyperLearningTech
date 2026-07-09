import type { QuestionAttachment } from "@/types/pyq";

export const ATTACHMENT_TYPE_IMAGE = "image" as const;

const SUPPORTED_RENDER_TYPES = new Set<string>([ATTACHMENT_TYPE_IMAGE]);

export function isQuestionAttachment(
  value: unknown
): value is QuestionAttachment {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === "string" &&
    candidate.id.trim().length > 0 &&
    typeof candidate.type === "string" &&
    candidate.type.trim().length > 0 &&
    typeof candidate.path === "string" &&
    candidate.path.trim().length > 0 &&
    !candidate.path.includes("..")
  );
}

export function isSupportedAttachmentType(type: string): boolean {
  return SUPPORTED_RENDER_TYPES.has(type);
}

export function getAttachmentAlt(attachment: QuestionAttachment): string {
  const alt = attachment.alt?.trim();
  return alt && alt.length > 0 ? alt : "Question attachment";
}

export function getAttachmentTitle(
  attachment: QuestionAttachment
): string | undefined {
  const title = attachment.title?.trim();
  return title && title.length > 0 ? title : undefined;
}

export function getAttachmentCaption(
  attachment: QuestionAttachment
): string | undefined {
  const caption = attachment.caption?.trim();
  return caption && caption.length > 0 ? caption : undefined;
}

export function collectAttachmentAiContexts(
  attachments?: QuestionAttachment[]
): string[] {
  if (!attachments?.length) {
    return [];
  }

  return attachments
    .filter(isQuestionAttachment)
    .map((attachment) => attachment.aiContext?.trim())
    .filter((context): context is string => Boolean(context));
}
