import { Suspense } from "react";
import AccProposalDosen from "./accproposaldosen";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10">Loading...</div>}>
      <AccProposalDosen />
    </Suspense>
  );
}
