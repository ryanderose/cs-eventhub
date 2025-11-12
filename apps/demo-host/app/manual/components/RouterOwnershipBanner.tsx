'use client';

import { useEffect, useState } from 'react';

export function RouterOwnershipBanner() {
  const [owner, setOwner] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const globalWindow = window as typeof window & { __hub_embed_path_owner__?: string | undefined };
    const update = () => {
      setOwner(globalWindow.__hub_embed_path_owner__ ?? null);
    };
    update();
    const timer = window.setInterval(update, 200);
    return () => {
      window.clearInterval(timer);
    };
  }, []);

  return (
    <p className="status router-ownership" role="status">
      {owner ? `Active router owner: ${owner}` : 'Active router owner: (unclaimed)'}
    </p>
  );
}
