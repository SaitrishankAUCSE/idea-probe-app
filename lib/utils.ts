/**
 * ============================================
 * UTILITY — className merger
 * ============================================
 *
 * WHY:
 * When building reusable components, consumers pass extra `className` props
 * that need to be merged with the component's own classes without conflicts.
 *
 * This lightweight helper concatenates class strings and removes any
 * `undefined` / `false` values that come from conditional expressions.
 *
 * EXAMPLE:
 *   cn("px-4 py-2", isActive && "bg-primary", className)
 *   // → "px-4 py-2 bg-primary extra-class"
 */

export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(" ");
}
