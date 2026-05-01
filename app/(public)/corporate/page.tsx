import type { Metadata } from "next";
import CorporateClient from "./corporate-client";

export const metadata: Metadata = {
  title: "Corporate & Bulk Orders — Baefikra",
  description:
    "Bulk t-shirts, hoodies, custom prints for your company, college fest, or event. Get a quote.",
};

export default function CorporatePage() {
  return <CorporateClient />;
}
