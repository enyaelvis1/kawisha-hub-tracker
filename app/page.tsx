import type { Metadata } from "next";

import { LandingPage } from "@/components/landing-page";
import { getPublicStoreSnapshot } from "@/lib/data";

export const metadata: Metadata = {
  title: "Kawisha Hub NG · Fashion, home, and everyday finds",
  description:
    "Shop fashion, footwear, accessories, and home essentials from Kawisha Hub NG.",
};
export const instant = false;

export default async function Home() {
  return <LandingPage snapshot={await getPublicStoreSnapshot()} />;
}
