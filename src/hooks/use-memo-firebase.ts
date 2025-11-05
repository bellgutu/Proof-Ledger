
"use client";
import { useMemo, DependencyList } from 'react';

// This is a placeholder hook. In a real app, you would use this
// to memoize Firebase queries or other expensive objects.
export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
}
