import AttachmentImage from "@/components/pyqs/attachment-image";
import {
  attachmentFileExists,
  getAttachmentPath,
} from "@/lib/content/attachment-path";
import {
  ATTACHMENT_TYPE_IMAGE,
  getAttachmentAlt,
  getAttachmentCaption,
  getAttachmentTitle,
  isQuestionAttachment,
  isSupportedAttachmentType,
} from "@/lib/content/attachment-utils";
import type { QuestionAttachment } from "@/types/pyq";

interface QuestionAttachmentsProps {
  attachments?: QuestionAttachment[];
  branch: string;
  semester: string;
  subject: string;
}

function warnInDevelopment(message: string) {
  if (process.env.NODE_ENV === "development") {
    console.warn(message);
  }
}

async function renderAttachment(
  attachment: QuestionAttachment,
  branch: string,
  semester: string,
  subject: string
) {
  if (!isQuestionAttachment(attachment)) {
    warnInDevelopment(
      `[attachments] Skipping malformed attachment in ${subject}: ${JSON.stringify(attachment)}`
    );
    return null;
  }

  if (!isSupportedAttachmentType(attachment.type)) {
    warnInDevelopment(
      `[attachments] Unsupported attachment type "${attachment.type}" for ${attachment.id}`
    );
    return null;
  }

  const pathInput = {
    branch,
    semester,
    subject,
    attachmentPath: attachment.path,
  };

  const src = getAttachmentPath(pathInput);

  if (!src) {
    console.warn(
      `[attachments] Invalid attachment path for ${attachment.id}: ${attachment.path}`
    );

    return (
      <AttachmentImage
        key={attachment.id}
        src=""
        alt={getAttachmentAlt(attachment)}
        title={getAttachmentTitle(attachment)}
        caption={getAttachmentCaption(attachment)}
        invalidPath
      />
    );
  }

  const fileExists = await attachmentFileExists(pathInput);

  if (!fileExists) {
    console.warn(
      `[attachments] Attachment file missing for ${attachment.id}: ${attachment.path}`
    );
  }

  switch (attachment.type) {
    case ATTACHMENT_TYPE_IMAGE:
      return (
        <AttachmentImage
          key={attachment.id}
          src={src}
          alt={getAttachmentAlt(attachment)}
          title={getAttachmentTitle(attachment)}
          caption={getAttachmentCaption(attachment)}
          invalidPath={!fileExists}
        />
      );
    default:
      warnInDevelopment(
        `[attachments] No renderer for attachment type "${attachment.type}"`
      );
      return null;
  }
}

export default async function QuestionAttachments({
  attachments,
  branch,
  semester,
  subject,
}: QuestionAttachmentsProps) {
  if (!attachments?.length) {
    return null;
  }

  const renderedAttachments = (
    await Promise.all(
      attachments.map((attachment) =>
        renderAttachment(attachment, branch, semester, subject)
      )
    )
  ).filter(Boolean);

  if (!renderedAttachments.length) {
    return null;
  }

  return (
    <div className="space-y-4" aria-label="Question attachments">
      {renderedAttachments}
    </div>
  );
}
