import type { Metadata } from "next";

import { PublicStore } from "@/components/public-store";
import { getPublicStoreSnapshot } from "@/lib/data";

export const metadata: Metadata = {
  title: "Public store · Kawisha Hub NG",
  description: "Browse the public Kawisha Hub NG product catalog.",
};
export const instant = false;

export default async function StorePage() {
  const snapshot = await getPublicStoreSnapshot();
  return <PublicStore snapshot={snapshot} />;
}
