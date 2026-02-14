'use client';

import { useEffect, useRef } from 'react';
import { lockScroll, unlockScroll } from '../utils/scrollLock';

export function useModalScroll(isOpen: boolean) {
  const wasOpen = useRef(false);

  useEffect(() => {
    if (isOpen && !wasOpen.current) {
      lockScroll();
      wasOpen.current = true;
    } else if (!isOpen && wasOpen.current) {
      unlockScroll();
      wasOpen.current = false;
    }

    return () => {
      if (wasOpen.current) {
        unlockScroll();
        wasOpen.current = false;
      }
    };
  }, [isOpen]);
}
