"use client";

import React from "react";
import useSWR from "swr"; 
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { 
  ArrowLeft, 
  User, 
  CheckCircle2, 
  BadgeCheck,
  History,
  Calendar,
  MapPin,
  BookOpen
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

const fetchDetailPengujiData = async (dosenId: string | null) => {
  if (!dosenId) return null;
  const { data: pembimbingSeminarData, error: pembimbingSeminarError } = await supabase
  .from("thesis_supervisors")
  .select(`
    role,
    proposal:proposals (
      id, judul, status, status_lulus,
      mahasiswa:profiles ( nama, npm ),
      seminar_request:seminar_requests (
        id, status, created_at,
        schedule:seminar_schedules ( tanggal, jam, ruangan )
      )
    )
  `)
  .eq("dosen_id", dosenId)
  .eq("status", "accepted");

if (pembimbingSeminarError) {
  console.error("Error Pembimbing Seminar:", pembimbingSeminarError.message);
}
const mappedPembimbingSeminar = (pembimbingSeminarData || [])
  .map((item: any) => {
    const proposal = Array.isArray(item.proposal) ? item.proposal[0] : item.proposal;
    const seminarRequest = Array.isArray(proposal?.seminar_request)
      ? proposal.seminar_request[0]
      : proposal?.seminar_request;

    if (!proposal || !seminarRequest) return null;

    return {
      role: item.role === "utama" ? "Pembimbing 1" : "Pembimbing 2",
      seminar_request: {
        ...seminarRequest,
        proposal,
      },
    };
  })
  .filter(Boolean);

  const { data: profileData } = await supabase
    .from("profiles")
    .select("nama, avatar_url")
    .eq("id", dosenId)
    .single();

  const { data: seminarData, error: seminarError } = await supabase
    .from("examiners")
    .select(`
      role,
      seminar_request:seminar_requests (
        id, status, created_at,
        schedule:seminar_schedules ( tanggal, jam, ruangan ),
        proposal:proposals (
          id,judul, status, status_lulus,
          mahasiswa:profiles ( nama, npm )
        )
      )
    `)
    .eq("dosen_id", dosenId)
    .not("seminar_request", "is", null);

  if (seminarError) console.error("Error Seminar:", seminarError.message);

  const { data: sidangData, error: sidangError } = await supabase
    .from("sidang_grades")
    .select(`
      nilai_akhir,
      sidang_request:sidang_requests (
        id, status, tanggal_sidang, ruangan,
        proposal:proposals (
          id, judul,status,  status_lulus,
          mahasiswa:profiles ( nama, npm )
        )
      )
    `)
    .eq("dosen_id", dosenId);

     if (sidangError) console.error("Error Sidang:", sidangError.message);

  const proposalIdsFromSeminar =
    (seminarData || [])
      .map((s: any) => s.seminar_request?.proposal?.id)
      .filter(Boolean);

  const proposalIdsFromSidang =
    (sidangData || [])
      .map((s: any) => s.sidang_request?.proposal?.id)
      .filter(Boolean);

  const allProposalIds = Array.from(
    new Set([...proposalIdsFromSeminar, ...proposalIdsFromSidang])
  );

  const supervisorRoleByProposal: Record<string, string> = {};

  if (allProposalIds.length > 0) {
  const { data: supervisorData, error: supervisorError } = await supabase
    .from("thesis_supervisors")
    .select("proposal_id, dosen_id, role")
    .eq("dosen_id", dosenId)
    .in("proposal_id", allProposalIds);

  if (supervisorError) {
    console.error("Error Supervisor:", supervisorError.message);
  }

  (supervisorData || []).forEach((s: any) => {
    supervisorRoleByProposal[s.proposal_id] = s.role;
  });
}

  const mergedSeminarsMap = new Map<string, any>();

(seminarData || []).forEach((item: any) => {
  const proposal = Array.isArray(item.seminar_request?.proposal)
    ? item.seminar_request.proposal[0]
    : item.seminar_request?.proposal;

  if (proposal?.id) {
    mergedSeminarsMap.set(proposal.id, item);
  }
});

(mappedPembimbingSeminar || []).forEach((item: any) => {
  const proposal = Array.isArray(item.seminar_request?.proposal)
    ? item.seminar_request.proposal[0]
    : item.seminar_request?.proposal;

  if (proposal?.id) {
    mergedSeminarsMap.set(proposal.id, item);
  }
});

return {
  dosenNama: profileData?.nama || "",
  dosenAvatar: profileData?.avatar_url || null,
  seminars: Array.from(mergedSeminarsMap.values()),
  sidangs: sidangData || [],
  supervisorRoleByProposal,
};
}

export default function DetailMonitoringPengujiClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const dosenId = searchParams.get("id"); 

  const { data: cache, isLoading, mutate } = useSWR(
    dosenId ? `detail_penguji_${dosenId}` : null,
    () => fetchDetailPengujiData(dosenId),
    {
      revalidateOnFocus: true,
      refreshInterval: 60000 
    }
  );

  const dosenNama = cache?.dosenNama || "";
  const dosenAvatar = cache?.dosenAvatar || null;
  const seminars = cache?.seminars || [];
  const sidangs = cache?.sidangs || [];

  const supervisorRoleByProposal = cache?.supervisorRoleByProposal || {};

const getRoleLabel = (proposalId: string, examinerRole: string) => {
  if (examinerRole === "Pembimbing 1") return "Pembimbing 1";
  if (examinerRole === "Pembimbing 2") return "Pembimbing 2";

  const supervisorRole = supervisorRoleByProposal[proposalId];

  if (supervisorRole === "utama") return "Pembimbing 1";
  if (supervisorRole === "pendamping") return "Pembimbing 2";

  if (examinerRole === "penguji1") return "Penguji 1";
  if (examinerRole === "penguji2") return "Penguji 2";
  if (examinerRole === "penguji3") return "Penguji 3";

  return examinerRole;
};
  const getFormattedDate = (dateString: string) => {
    if (!dateString) return "TBA";
    const d = new Date(dateString);
    return `${d.getDate().toString().padStart(2, '0')} ${d.toLocaleDateString('id-ID', { month: 'short' }).toUpperCase()} ${d.getFullYear()}`;
  };

  const isMahasiswaLulus = (proposal: any) => {
  return proposal?.status_lulus === true || proposal?.status === "Lulus";
};

  const antreanSeminar = seminars.filter((s: any) => {
  const p = s.seminar_request?.proposal;
  return !isMahasiswaLulus(p);
});

const antreanSidang = sidangs.filter((s: any) => {
  const p = s.sidang_request?.proposal;
  return !isMahasiswaLulus(p);
});

const riwayatRaw = [
  ...seminars
    .filter((s: any) => isMahasiswaLulus(s.seminar_request?.proposal))
    .map((s: any) => ({
      id: s.seminar_request?.proposal?.id,
      ...s.seminar_request?.proposal,
      type: "Seminar",
    })),

  ...sidangs
    .filter((s: any) => isMahasiswaLulus(s.sidang_request?.proposal))
    .map((s: any) => ({
      id: s.sidang_request?.proposal?.id,
      ...s.sidang_request?.proposal,
      type: "Sidang Akhir",
    })),
];

const riwayatSelesai = Array.from(
  new Map(
    riwayatRaw.map((item: any) => [
      item.id || item.mahasiswa?.npm,
      item,
    ])
  ).values()
);

const activeRaw = [
  ...antreanSeminar.map((s: any) => s.seminar_request?.proposal),
  ...antreanSidang.map((s: any) => s.sidang_request?.proposal),
].filter(Boolean);

const activeUnique = Array.from(
  new Map(
    activeRaw.map((item: any) => [
      item.id || item.mahasiswa?.npm,
      item,
    ])
  ).values()
);

const totalAktif = activeUnique.length;

  if (isLoading && !cache) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] z-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-10 font-sans text-slate-700 outline-none focus:outline-none">
      <div className="max-w-7xl mx-auto outline-none focus:outline-none">
        
       <button 
          onClick={() => router.back()}
          className="group flex items-center gap-4 mb-8 w-fit transition-all active:scale-95 outline-none focus:outline-none"
        >
          <div className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-500 group-hover:text-blue-600 group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:shadow-md transition-all shadow-sm shrink-0">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </div>
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.15em] group-hover:text-blue-600 transition-colors">
            Kembali ke Monitoring
          </span>
        </button>

        <div className="bg-white rounded-[3rem] p-10 shadow-2xl shadow-slate-200/50 border border-white mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6 outline-none focus:outline-none">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-blue-50 border border-slate-200 rounded-[2rem] flex items-center justify-center text-blue-600 shadow-xl relative overflow-hidden shrink-0">
              {dosenAvatar ? (
                <Image src={dosenAvatar} alt={dosenNama || "Profil Dosen"} layout="fill" objectFit="cover"/>
              ) : (
                <span className="text-3xl font-black uppercase">
                  {dosenNama ? dosenNama.charAt(0) : <User size={40} />}
                </span>
              )}
            </div>

            <div>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-1">Dosen Penguji</p>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">
                {dosenNama || "Memuat..."}
              </h1>
            </div>
          </div>
          <div className="bg-emerald-50 px-8 py-4 rounded-[1.5rem] border border-emerald-100 text-center shadow-inner relative">
  <button
    onClick={() => mutate()}
    className="absolute -top-3 -right-3 px-3 py-1 bg-white border border-emerald-200 text-emerald-600 rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm hover:bg-emerald-600 hover:text-white transition-all active:scale-95"
  >
    Reset
  </button>

  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">
    Total Pengujian Aktif
  </p>
  <p className="text-2xl font-black text-emerald-700">{totalAktif}</p>
</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 outline-none focus:outline-none">
          
          <div className="space-y-6 outline-none focus:outline-none">
            <div className="flex items-center gap-3 px-4">
              <Calendar className="text-blue-500" size={20} />
              <h2 className="text-lg font-black text-slate-800 tracking-tighter">Menguji Seminar</h2>
            </div>
            <div className="space-y-4">
              {antreanSeminar.map((s: any, i: number) => {
                const req = s.seminar_request;
                const sched = Array.isArray(req.schedule) ? req.schedule[0] : req.schedule;
                
                return (
                  <div key={i} className="bg-white p-6 rounded-[2rem] border border-white shadow-lg shadow-slate-200/30 relative outline-none focus:outline-none">
                    <div className="absolute right-4 top-4">
                      <span className="text-[8px] font-black bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full uppercase shadow-sm">
  {getRoleLabel(req.proposal?.id, s.role)}
</span>
                    </div>
                    <h3 className="font-black text-slate-800 text-sm leading-tight pr-12">
                      {req.proposal?.mahasiswa?.nama}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-black mt-1 uppercase tracking-widest">
                      {req.proposal?.mahasiswa?.npm}
                    </p>
                    
                    <div className="mt-4 pt-4 border-t border-slate-50 flex flex-col gap-2">
                       <div className="flex items-center gap-2 text-blue-600">
                          <Calendar size={12} />
                          <span className="text-[10px] font-black uppercase tracking-widest">{getFormattedDate(sched?.tanggal)}</span>
                       </div>
                       <div className="flex items-center gap-2 text-slate-500">
                          <MapPin size={12} />
                          <span className="text-[10px] font-bold">{sched?.ruangan || "Menunggu Ruangan"}</span>
                       </div>
                    </div>
                  </div>
                );
              })}
              {antreanSeminar.length === 0 && <EmptyState text="Tidak ada jadwal seminar" />}
            </div>
          </div>

          <div className="space-y-6 outline-none focus:outline-none">
            <div className="flex items-center gap-3 px-4">
              <BadgeCheck className="text-emerald-500" size={20} />
              <h2 className="text-lg font-black text-slate-800 tracking-tighter">Menguji Sidang</h2>
            </div>
            <div className="space-y-4">
              {antreanSidang.map((s: any, i: number) => {
                const req = s.sidang_request;
                return (
                  <div key={i} className="bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-100/50 shadow-sm relative outline-none focus:outline-none">
                    <h3 className="font-black text-slate-800 text-sm leading-tight">
                      {req?.proposal?.mahasiswa?.nama}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-black mt-1 uppercase tracking-widest">
                      {req?.proposal?.mahasiswa?.npm}
                    </p>

                    <div className="mt-4 pt-4 border-t border-emerald-100 flex flex-col gap-2">
                       <div className="flex items-center gap-2 text-emerald-600">
                          <Calendar size={12} />
                          <span className="text-[10px] font-black uppercase tracking-widest">{getFormattedDate(req?.tanggal_sidang)}</span>
                       </div>
                       <div className="flex items-center gap-2 text-slate-500">
                          <MapPin size={12} />
                          <span className="text-[10px] font-bold">{req?.ruangan || "Menunggu Ruangan"}</span>
                       </div>
                    </div>
                  </div>
                );
              })}
              {antreanSidang.length === 0 && <EmptyState text="Tidak ada jadwal sidang" />}
            </div>
          </div>

          <div className="space-y-6 outline-none focus:outline-none">
            <div className="flex items-center gap-3 px-4">
              <History className="text-slate-400" size={20} />
              <h2 className="text-lg font-black text-slate-800 tracking-tighter">Riwayat Selesai</h2>
            </div>
            <div className="space-y-4">
              {riwayatSelesai.map((s: any, i: number) => (
                <div key={i} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-3 opacity-80 hover:opacity-100 transition-opacity outline-none focus:outline-none">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-black text-slate-700 text-[11px] leading-tight">
                        {s?.mahasiswa?.nama}
                      </h3>
                      <p className="text-[9px] text-slate-400 font-bold mt-0.5 tracking-widest uppercase">
                        {s?.mahasiswa?.npm}
                      </p>
                    </div>
                    <div className="bg-emerald-50 text-emerald-500 p-2 rounded-xl shrink-0">
                      <CheckCircle2 size={16} />
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex gap-2 items-start">
                    <BookOpen size={12} className="text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-[9px] font-medium text-slate-500 leading-relaxed line-clamp-2">
                      "{s?.judul}"
                    </p>
                  </div>
                </div>
              ))}
              {riwayatSelesai.length === 0 && <EmptyState text="Belum ada riwayat" />}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="bg-white/50 border-2 border-dashed border-slate-200 rounded-[2rem] p-10 text-center outline-none focus:outline-none">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{text}</p>
    </div>
  );
}