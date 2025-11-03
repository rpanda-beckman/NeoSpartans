// Temporary JSX intrinsic elements declaration to satisfy TypeScript in this workspace.
// This provides a minimal, permissive mapping so existing JSX components typecheck
// while we ensure @types/react and tsconfig are configured.

import * as React from 'react';

declare global {
  namespace JSX {
    // Allow any HTML tag or custom element in JSX during initial development.
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

declare module 'react' {
  export function useState<T>(initialState: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;
  export function useMemo<T>(factory: () => T, deps: any[]): T;
  export function useRef<T>(initialValue: T): { current: T };
  export default React;
}
