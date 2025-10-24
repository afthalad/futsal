"use client";

import React, { useEffect, useRef, useState } from "react";

type AdBannerTypes = {
  dataAdSlot: string;
  dataAdFormat: string;
  dataFullWidthResponsive: boolean;
};

const AdBanner = ({
  dataAdSlot,
  dataAdFormat,
  dataFullWidthResponsive,
}: AdBannerTypes) => {
  const adRef = useRef<HTMLModElement>(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);

  useEffect(() => {
    const initializeAd = () => {
      try {
        if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
          // console.log('Initializing AdSense ad...');
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          setAdLoaded(true);
        } else {
          // Retry after a short delay if adsbygoogle is not ready
          setTimeout(initializeAd, 100);
        }
      } catch (error: any) {
        // console.error('AdSense initialization error:', error.message);
        setAdError(true);
      }
    };

    // Wait for the component to be mounted and AdSense script to be loaded
    const timer = setTimeout(initializeAd, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Show a placeholder if ad fails to load (for testing purposes)
  if (adError) {
    return (
      <div className="bg-gray-200 border-2 border-dashed border-gray-400 rounded p-4 text-center text-sm text-gray-600">
        <div className="mb-2">📢 Ad Space</div>
        <div>Ad failed to load</div>
        <div className="text-xs mt-1">Slot: {dataAdSlot}</div>
      </div>
    );
  }

  return (
    <div className="ad-container">
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ 
          display: "block",
          minHeight: "90px",
          width: "100%"
        }}
        data-ad-client="ca-pub-8817711330907234"
        data-ad-slot={dataAdSlot}
        data-ad-format={dataAdFormat}
        data-full-width-responsive={dataFullWidthResponsive.toString()}
      ></ins>
     
    </div>
  );
};

export default AdBanner;