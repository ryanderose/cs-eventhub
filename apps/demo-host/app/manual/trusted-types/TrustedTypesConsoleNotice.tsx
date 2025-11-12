'use client';

import { useEffect } from 'react';

export function TrustedTypesConsoleNotice() {
  useEffect(() => {
    console.info('[manual.trustedTypes]', 'Trusted Types harness intentionally blocks policy creation. Errors above this line are expected.');
    return () => {
      console.info('[manual.trustedTypes]', 'Leaving Trusted Types harness — clear DevTools console if you need a clean log.');
    };
  }, []);

  return null;
}
