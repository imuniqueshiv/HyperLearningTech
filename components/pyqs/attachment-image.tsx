"use client";

import { memo, useCallback, useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";

interface AttachmentImageProps {
  src: string;
  alt: string;
  title?: string;
  caption?: string;
  invalidPath?: boolean;
}

function DiagramUnavailableCard() {
  return (
    <div
      className="flex items-center gap-3 rounded-xl border border-border bg-card p-5 shadow-sm"
      role="img"
      aria-label="Diagram unavailable"
    >
      <div
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted"
      >
        <ImageOff className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">
        Diagram unavailable
      </p>
    </div>
  );
}

function AttachmentImageComponent({
  src,
  alt,
  title,
  caption,
  invalidPath = false,
}: AttachmentImageProps) {
  const [hasLoadError, setHasLoadError] = useState(invalidPath);

  const handleError = useCallback(() => {
    console.warn(`[attachments] Failed to load image: ${src}`);
    setHasLoadError(true);
  }, [src]);

  if (!src || hasLoadError) {
    return <DiagramUnavailableCard />;
  }

  return (
    <figure className="w-full max-w-2xl">
      {title ? (
        <figcaption className="mb-2 text-sm font-semibold text-foreground">
          {title}
        </figcaption>
      ) : null}

      <div
        aria-hidden="true"
        className="overflow-hidden rounded-xl border border-border bg-white p-3 shadow-sm"
      >
        <div className="relative mx-auto w-full">
          <Image
            src={src}
            alt={alt}
            width={960}
            height={720}
            loading="lazy"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 672px"
            className="mx-auto h-auto w-full max-w-full object-contain"
            onError={handleError}
          />
        </div>
      </div>

      {caption ? (
        <figcaption className="mt-2 text-xs text-muted-foreground sm:text-sm">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

const AttachmentImage = memo(AttachmentImageComponent);
AttachmentImage.displayName = "AttachmentImage";

export default AttachmentImage;
