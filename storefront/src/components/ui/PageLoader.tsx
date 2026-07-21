'use client';

import { useEffect, useState } from 'react';

export function PageLoader() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Hide loader after animation completes
    const timer = setTimeout(() => setDone(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (done) return null;

  return (
    <div id="page-loader" className={done ? 'done' : ''} aria-hidden="true">
      <p className="loader-logo">Odhvica</p>
      <div className="loader-bar-wrap">
        <div className="loader-bar" />
      </div>
    </div>
  );
}
