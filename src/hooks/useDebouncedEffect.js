import { useEffect } from "react";

// Run an effect only after `deps` have stopped changing for `delay` ms.
// Used to debounce the IndexedDB writes — typing in notes doesn't slam the
// store on every keystroke.
export default function useDebouncedEffect(fn, deps, delay = 250) {
  useEffect(() => {
    const t = setTimeout(fn, delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delay]);
}
