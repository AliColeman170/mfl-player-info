import { createPopper, Options, StrictModifiers } from '@popperjs/core';
import { useCallback, useMemo, useRef } from 'react';

export function usePopper(options: Options) {
  let reference = useRef<Element>(undefined);
  let popper = useRef<HTMLElement>(undefined);

  let cleanupCallback = useRef(() => {});

  let instantiatePopper = useCallback(() => {
    if (!reference.current) return;
    if (!popper.current) return;

    if (cleanupCallback.current) cleanupCallback.current();

    cleanupCallback.current = createPopper<StrictModifiers>(
      reference.current,
      popper.current,
      options
    ).destroy;
  }, [reference, popper, cleanupCallback, options]);

  return useMemo(
    () => [
      (referenceDomNode: Element) => {
        reference.current = referenceDomNode;
        instantiatePopper();
      },
      (popperDomNode: HTMLElement) => {
        popper.current = popperDomNode;
        instantiatePopper();
      },
    ],
    [reference, popper, instantiatePopper]
  );
}
