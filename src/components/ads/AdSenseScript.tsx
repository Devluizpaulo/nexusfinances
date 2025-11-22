
"use client";

import React, { useEffect } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';

declare global {
  interface Window {
    adsbygoogle: { [key: string]: unknown }[];
  }
}

interface AdSenseScriptProps {
    adSlot: string;
}

export const AdSenseScript = ({ adSlot }: AdSenseScriptProps) => {
  const pathname = usePathname();

  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error(err);
    }
  }, [pathname]);

  return (
    <>
      {/* The AdSense script is already in layout.tsx, so we don't need it here. */}
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-5750464088623363"
        data-ad-slot={adSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </>
  );
};
