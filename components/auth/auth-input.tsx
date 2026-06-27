import { ReactNode } from "react";

interface AuthInputProps {
  id: string;
  type: string;
  label: string;
  placeholder: string;
  required?: boolean;
  hint?: ReactNode;
  rightElement?: ReactNode;
}

export function AuthInput({
  id,
  type,
  label,
  placeholder,
  required = true,
  hint,
  rightElement,
}: AuthInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
        {rightElement}
      </div>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        className="rounded-xl border border-border bg-background px-4 py-3 text-sm shadow-sm transition-colors focus:border-[#1D4ED8] focus:outline-none focus:ring-1 focus:ring-[#1D4ED8] dark:bg-muted/20"
        required={required}
      />
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}
