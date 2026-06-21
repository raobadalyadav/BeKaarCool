"use client";

import { useEffect, useState } from "react";
import { getActiveCampaigns, type CampaignDto } from "@/lib/api/marketing";
import { Clock } from "lucide-react";
import Link from "next/link";

export function FlashSaleBanner() {
  const [campaigns, setCampaigns] = useState<CampaignDto[]>([]);
  const [timeLeft, setTimeLeft] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    (async () => {
      try {
        const active = await getActiveCampaigns();
        setCampaigns(active.filter(c => c.type === "flash_sale" || c.type === "lightning_deal"));
      } catch (e) {
        console.error("Failed to fetch campaigns", e);
      }
    })();
  }, []);

  useEffect(() => {
    if (campaigns.length === 0) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const newTimeLeft: { [key: string]: string } = {};

      campaigns.forEach(c => {
        const end = new Date(c.endsAt).getTime();
        const distance = end - now;

        if (distance < 0) {
          newTimeLeft[c.id] = "Expired";
          return;
        }

        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        newTimeLeft[c.id] = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      });

      setTimeLeft(newTimeLeft);
    }, 1000);

    return () => clearInterval(interval);
  }, [campaigns]);

  if (campaigns.length === 0) return null;

  // Just show the first active one for the banner
  const activeCampaign = campaigns[0];
  const timeString = timeLeft[activeCampaign.id];

  if (timeString === "Expired") return null;

  return (
    <div className="bg-[#F38508] text-white py-2 px-4 flex flex-col sm:flex-row items-center justify-center gap-2 text-sm md:text-base">
      <div className="flex items-center gap-2 font-bold">
        <span>⚡ {activeCampaign.name}</span>
        {activeCampaign.description && <span className="hidden md:inline text-white/90 font-normal"> - {activeCampaign.description}</span>}
      </div>
      <div className="flex items-center gap-1 font-mono bg-black/20 px-2 py-1 rounded">
        <Clock className="w-4 h-4" />
        {timeString || "00:00:00"}
      </div>
      <Link href={`/sale/${activeCampaign.slug}`} className="ml-2 underline font-medium hover:text-black transition-colors">
        Shop Now
      </Link>
    </div>
  );
}
