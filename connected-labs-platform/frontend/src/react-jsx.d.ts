// Temporary JSX intrinsic elements declaration to satisfy TypeScript in this workspace.
// This provides a minimal, permissive mapping so existing JSX components typecheck
// while we ensure @types/react and tsconfig are configured.

declare namespace JSX {
  // Allow any HTML tag or custom element in JSX during initial development.
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
