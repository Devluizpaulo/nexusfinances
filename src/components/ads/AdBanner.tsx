"use client";

import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

declare global {
  interface Window {
    adsbygoogle?: { [key: string]: unknown }[];
  }
}

const AdBanner = () => {
  const pathname = usePathname();
  const adRef = useRef<HTMLModElement | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    if (typeof window === "undefined") return;

    const tryInit = () => {
      try {
        if (!initialized.current && adRef.current && window.adsbygoogle) {
          initialized.current = true;
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        }
      } catch {
        // silencia erros do AdSense em dev/local
      }
    };

    if (window.adsbygoogle) {
      tryInit();
      return;
    }

    const timeout = setTimeout(tryInit, 1000);

    return () => {
      clearTimeout(timeout);
    };
  }, [pathname]);

  return (
    <ins
      ref={adRef as any}
      className="adsbygoogle"
      style={{ display: "block" }}
      data-ad-client="ca-pub-5750464088623363"
      data-ad-slot="3856507618"
      data-ad-format="auto"
      data-full-width-responsive="true"
    ></ins>
  );
};

export default AdBanner;