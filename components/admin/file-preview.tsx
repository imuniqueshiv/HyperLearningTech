"use client";

interface FilePreviewProps {
  title: string;
  value: unknown;
  emptyMessage?: string;
}

export function FilePreview({
  title,
  value,
  emptyMessage = "Not available.",
}: FilePreviewProps) {
  if (value == null) {
    return (
      <div>
        <h4 className="text-xs font-medium text-foreground">{title}</h4>
        <p className="mt-2 text-xs text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div>
      <h4 className="text-xs font-medium text-foreground">{title}</h4>
      <pre className="mt-2 max-h-80 overflow-auto rounded-lg border border-border bg-background p-3 text-[11px] leading-relaxed text-muted-foreground">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}
