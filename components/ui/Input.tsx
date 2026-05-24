"use client";

/**
 * ============================================
 * INPUT COMPONENT — Text input & textarea
 * ============================================
 *
 * WHAT THIS DOES:
 * A unified form field that renders either an <input> or <textarea> based on
 * the `textarea` prop. Handles labels, error messages, helper text, and all
 * the visual states (default, focus, error, disabled).
 *
 * DESIGN DECISIONS:
 * 1. **forwardRef** — React Hook Form (and other form libraries) need a ref
 *    to the underlying DOM element to register it. Without forwardRef,
 *    `register("email")` would silently fail.
 *
 * 2. **Compound label/error layout** — The label sits above the input and
 *    the error/helper text sits below. This is the most accessible pattern
 *    because screen readers can associate them via `aria-describedby`.
 *
 * 3. **Dark input style** — `bg-background-secondary` keeps the input
 *    darker than the card it sits on, creating visual depth.
 *
 * 4. **Focus glow** — On focus, the border changes to `border-primary` with
 *    a subtle box-shadow glow. This guides the user's eye.
 *
 * 5. **Error state** — `border-danger` + red helper text clearly signals
 *    validation failures without relying on color alone (the text is also
 *    present for accessibility).
 *
 * WHY ONE COMPONENT FOR BOTH <input> AND <textarea>?
 * They share 95% of their styles. Splitting them would duplicate code.
 * The `textarea` boolean prop toggles between them, and TypeScript narrows
 * the correct HTML attributes automatically.
 */

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

/* ── Props ─────────────────────────────────── */

/**
 * We intersect HTML input attributes with our custom props.
 * The `textarea` flag switches the rendered element.
 */
interface InputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement> &
      React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    "size"
  > {
  /** Label displayed above the input field. */
  label?: string;
  /** Error message — triggers danger border + red text. */
  error?: string;
  /** Neutral hint text below the field (hidden when error is shown). */
  helperText?: string;
  /** Render a <textarea> instead of <input>. */
  textarea?: boolean;
}

/* ── Component ─────────────────────────────── */

/**
 * forwardRef lets parent components (and form libraries) attach a ref
 * to the underlying <input>/<textarea> DOM node.
 */
const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
  function Input(
    { label, error, helperText, textarea = false, className, id, ...rest },
    ref
  ) {
    /*
     * useId() generates a unique, SSR-safe ID.
     * This links the <label> to the input via `htmlFor` and
     * the error message via `aria-describedby`.
     */
    const autoId = useId();
    const fieldId = id || autoId;
    const errorId = `${fieldId}-error`;

    /* ── Shared input styles ── */
    const fieldStyles = cn(
      /* Base appearance */
      "w-full rounded-xl px-4 py-3",
      "bg-background-secondary text-foreground",
      "placeholder:text-foreground-tertiary",
      "text-sm",

      /* Border — default state */
      "border",
      error ? "border-danger" : "border-border",

      /* Focus state — primary border + glow */
      !error && "focus:border-primary focus:shadow-[0_0_12px_rgba(19,106,183,0.2)]",
      error && "focus:border-danger focus:shadow-[0_0_12px_rgba(226,75,75,0.2)]",

      /* Smooth transitions */
      "transition-all duration-200 ease-out",

      /* Remove default browser outline — we handle focus visuals ourselves */
      "outline-none",

      /* Disabled state */
      "disabled:opacity-50 disabled:cursor-not-allowed",

      /* Consumer overrides */
      className
    );

    return (
      <div className="flex flex-col gap-1.5">
        {/* ── Label ── */}
        {label && (
          <label
            htmlFor={fieldId}
            className="text-sm font-medium text-foreground-secondary"
          >
            {label}
          </label>
        )}

        {/* ── Field ──
         * Conditional rendering: textarea or input.
         * TypeScript knows `ref` can be either type because of our union.
         */}
        {textarea ? (
          <textarea
            id={fieldId}
            ref={ref as React.Ref<HTMLTextAreaElement>}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className={cn(fieldStyles, "resize-y min-h-[100px]")}
            {...(rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : (
          <input
            id={fieldId}
            ref={ref as React.Ref<HTMLInputElement>}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className={fieldStyles}
            {...(rest as React.InputHTMLAttributes<HTMLInputElement>)}
          />
        )}

        {/* ── Error / Helper Text ──
         * Error takes priority over helper text.
         * We use `role="alert"` so screen readers announce errors immediately.
         */}
        {error && (
          <p
            id={errorId}
            role="alert"
            className="text-xs text-danger mt-0.5"
          >
            {error}
          </p>
        )}
        {!error && helperText && (
          <p className="text-xs text-foreground-tertiary mt-0.5">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
