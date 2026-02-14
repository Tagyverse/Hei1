'use client';

import { useEffect, useState } from 'react';

export function usePortalElement(containerId: string = 'modals'): HTMLElement | null {
  const [element, setElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const portalElement = document.getElementById(containerId);
    setElement(portalElement);
  }, [containerId]);

  return element;
}
