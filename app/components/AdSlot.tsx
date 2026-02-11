"use client";

import { useEffect, useMemo, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const SLOT_BY_LABEL: Record<string, string | undefined> = {
  Landing: process.env.NEXT_PUBLIC_ADSENSE_SLOT_LANDING,
  Rank: process.env.NEXT_PUBLIC_ADSENSE_SLOT_RANK,
};

type AdSlotProps = {
  label: string;
  placement?: "inline" | "side";
};

export default function AdSlot({ label, placement = "inline" }: AdSlotProps) {
  const adRef = useRef<HTMLModElement | null>(null);
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const slot = useMemo(() => SLOT_BY_LABEL[label], [label]);
  const enabled = Boolean(client && slot);
  const isSide = placement === "side";

  useEffect(() => {
    if (!enabled || !adRef.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense script can fail silently in dev/adblock environments.
    }
  }, [enabled]);

  if (!enabled) {
    return process.env.NODE_ENV === "development" ? (
      <div className="coastal-ad">{label} ad disabled (missing env)</div>
    ) : null;
  }

  return (
    <div className={`coastal-ad ${isSide ? "coastal-ad-side" : "coastal-ad-inline"}`}>
      <ins
        ref={adRef}
        className={`adsbygoogle block w-full ${isSide ? "min-h-[600px]" : "min-h-[96px]"}`}
        style={{ display: "block" }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={isSide ? "vertical" : "auto"}
        data-full-width-responsive="true"
      />
    </div>
  );
}
