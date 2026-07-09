import { ReactNode } from "react";

interface AuthInputProps {
  id: string;
  type: string;
  label: string;
  placeholder: string;
  required?: boolean;
  hint?: ReactNode;
  rightElement?: ReactNode;
  suggestions?: string[];
}

export function AuthInput({
  id,
  type,
  label,
  placeholder,
  required = true,
  hint,
  rightElement,
  suggestions,
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
        className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/[0.03] px-4 py-3.5 text-sm transition-all focus:border-blue-500 focus:bg-white dark:focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-blue-500/10 placeholder:text-zinc-400 dark:placeholder:text-white/30"
        required={required}
        list={suggestions ? `${id}-suggestions` : undefined}
      />
      {suggestions && (
        <datalist id={`${id}-suggestions`}>
          {suggestions.map((suggestion, index) => (
            <option key={index} value={suggestion} />
          ))}
        </datalist>
      )}
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}
