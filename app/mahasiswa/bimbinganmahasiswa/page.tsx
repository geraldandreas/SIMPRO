import { Suspense } from "react";
import DetailProposalMahasiswaClient from "./bimbinganmahasiswaclient";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10">Loading...</div>}>
      <DetailProposalMahasiswaClient />
    </Suspense>
  );
}
