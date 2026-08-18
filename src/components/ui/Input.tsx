import {
  forwardRef,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

// PRD §2.4 Inputs — 10px radius, 1.5px solid #D4C5A9 border.
// PRD §7 — always a visible label; descriptive errors.

const fieldBase =
  "w-full rounded-input border-[1.5px] border-inputborder bg-white px-4 py-2.5 text-body text-navy placeholder:text-muted/60 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25 transition-colors disabled:bg-warm/50";

export function Label({
  htmlFor,
  children,
  required,
  className,
}: {
  htmlFor?: string;
  children: ReactNode;
  required?: boolean;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("mb-1.5 block text-caption font-semibold text-navy", className)}
    >
      {children}
      {required && <span className="ml-0.5 text-alert">*</span>}
    </label>
  );
}

export function FieldError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return <p className="mt-1 text-caption text-alert">{children}</p>;
}

export function Hint({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return <p className="mt-1 text-caption text-muted">{children}</p>;
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, required, id, className, ...props }, ref) => {
    const fieldId = id || props.name;
    return (
      <div>
        {label && (
          <Label htmlFor={fieldId} required={required}>
            {label}
          </Label>
        )}
        <input
          ref={ref}
          id={fieldId}
          aria-invalid={!!error}
          className={cn(fieldBase, error && "border-alert focus:border-alert focus:ring-alert/20", className)}
          {...props}
        />
        <FieldError>{error}</FieldError>
        {!error && <Hint>{hint}</Hint>}
      </div>
    );
  }
);
Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, required, id, className, ...props }, ref) => {
    const fieldId = id || props.name;
    return (
      <div>
        {label && (
          <Label htmlFor={fieldId} required={required}>
            {label}
          </Label>
        )}
        <textarea
          ref={ref}
          id={fieldId}
          aria-invalid={!!error}
          className={cn(fieldBase, "min-h-[100px] resize-y", error && "border-alert", className)}
          {...props}
        />
        <FieldError>{error}</FieldError>
        {!error && <Hint>{hint}</Hint>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  required?: boolean;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, required, options, placeholder, id, className, ...props }, ref) => {
    const fieldId = id || props.name;
    return (
      <div>
        {label && (
          <Label htmlFor={fieldId} required={required}>
            {label}
          </Label>
        )}
        <select
          ref={ref}
          id={fieldId}
          aria-invalid={!!error}
          className={cn(fieldBase, "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 fill=%22none%22 stroke=%22%236B6B6B%22 stroke-width=%222%22><path d=%22M4 6l4 4 4-4%22/></svg>')] bg-[right_1rem_center] bg-no-repeat pr-10", className)}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <FieldError>{error}</FieldError>
      </div>
    );
  }
);
Select.displayName = "Select";

/** Toggle switch (PRD §4.8 anonymous toggle, §4.2 giving prefs). */
export function Toggle({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  id?: string;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        id={id}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-progress transition-colors",
          checked ? "bg-gold" : "bg-inputborder"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-[22px]" : "translate-x-0.5"
          )}
        />
      </button>
      {label && <span className="text-body text-navy">{label}</span>}
    </label>
  );
}
