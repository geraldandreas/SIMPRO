"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import useSWR from "swr"; 
import { useRouter } from "next/navigation";
import { sendNotification } from "@/lib/notificationUtils";
import { supabase } from "@/lib/supabaseClient";
import { 
  CloudUpload, 
  FileText, 
  ChevronDown, 
  UserCheck,
  Lock,
  Send,
  AlertTriangle,
  FileCheck,
  CheckCircle,
  XCircle
} from "lucide-react";

interface Dosen {
  id: string;
  nama: string;
}

const fetcher = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("npm, avatar_url, alamat")
    .eq("id", user.id)
    .single();

  const isProfileComplete = !!(profile?.npm && profile?.avatar_url && profile?.alamat);

  const { data: propData } = await supabase
    .from("proposals")
    .select(`
      id, judul, bidang, status, is_locked, 
      file_path, file_transkrip, file_formulir, file_referensi,
      status_file_proposal, status_file_transkrip, status_file_formulir, status_file_referensi,
      created_at
    `)
    .eq("user_id", user.id)
    .maybeSingle();

  let previewUrls: Record<string, string | null> = {
    proposal: null,
    transkrip: null,
    formulir: null,
    referensi: null
  };

  if (propData) {
    const storageKeys = ['file_path', 'file_transkrip', 'file_formulir', 'file_referensi'];
    const labelKeys = ['proposal', 'transkrip', 'formulir', 'referensi'];

    await Promise.all(storageKeys.map(async (key, idx) => {
      const path = propData[key as keyof typeof propData];
      if (path) {
        const { data: signData } = await supabase.storage
          .from("proposals")
          .createSignedUrl(path as string, 3600);
        if (signData?.signedUrl) previewUrls[labelKeys[idx]] = signData.signedUrl;
      }
    }));
  }

  const { data: recData } = propData 
    ? await supabase.from("proposal_recommendations").select("dosen_id, tipe").eq("proposal_id", propData.id)
    : { data: null };

  const { data: dosenData } = await supabase
    .from("profiles")
    .select("id, nama")
    .in("role", ["dosen", "kaprodi"])
    .order("nama");

  return {
    isProfileComplete,
    proposalRaw: propData,
    recData,
    previewUrls,
    dosenList: (dosenData as Dosen[]) || []
  };
};

export default function UploadProposalMahasiswaClient() {
  const router = useRouter();
  const { data, isLoading, mutate } = useSWR('upload_proposal_mhs', fetcher, {
    revalidateOnFocus: true,
  });

  const [fileProposal, setFileProposal] = useState<File | null>(null);
  const [fileTranskrip, setFileTranskrip] = useState<File | null>(null);
  const [fileFormulir, setFileFormulir] = useState<File | null>(null);
  const [fileReferensi, setFileReferensi] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [judulSkripsi, setJudulSkripsi] = useState("");
  const [bidangSkripsi, setBidangSkripsi] = useState("AI");
  const [pembimbing1, setPembimbing1] = useState("");
  const [pembimbing2, setPembimbing2] = useState("");

  useEffect(() => {
    if (data?.proposalRaw) {
      setJudulSkripsi(data.proposalRaw.judul);
      setBidangSkripsi(data.proposalRaw.bidang);
    }
    if (data?.recData) {
      data.recData.forEach((rec: any) => {
        if (rec.tipe === "pembimbing1") setPembimbing1(rec.dosen_id);
        if (rec.tipe === "pembimbing2") setPembimbing2(rec.dosen_id);
      });
    }
  }, [data]);

  const existingProposal = data?.proposalRaw;
  const statusSistem = existingProposal?.status || "";
  const isFormLocked = existingProposal ? existingProposal.is_locked : false;

  const isDitolakTendik = statusSistem === "Ditolak Tendik";
  const isDitolakDosbing = statusSistem === "Ditolak Dosbing";
  const isDitetapkan = statusSistem === "Ditetapkan" || statusSistem === "Lengkap" || statusSistem.includes("Selesai");
  const isRevising = (isDitolakTendik || isDitolakDosbing) && !isFormLocked;

  const listDosen = data?.dosenList || [];

  const hasFile = (localFile: File | null, remotePath: string | undefined | null) => !!localFile || !!remotePath;

  const getFileState = (docType: 'proposal' | 'transkrip' | 'formulir' | 'referensi', statusField: string | undefined) => {
    if (!existingProposal) return { disabled: false, statusText: "Belum Disubmit", statusColor: "text-slate-400" };
    
    if (isDitolakDosbing) {
       if (docType === 'proposal') return { disabled: false, statusText: "Butuh Revisi Dosbing", statusColor: "text-red-500" };
       return { disabled: true, statusText: "Terkunci (Valid Tendik)", statusColor: "text-emerald-500" };
    }

    if (isDitolakTendik) {
       if (statusField === "Ditolak") return { disabled: false, statusText: "Ditolak (Wajib Diganti)", statusColor: "text-red-500" };
       if (statusField === "Lengkap") return { disabled: true, statusText: "Valid", statusColor: "text-emerald-500" };
       return { disabled: false, statusText: "Belum Diverifikasi", statusColor: "text-amber-500" };
    }

    if (isFormLocked) {
       if (statusField === "Lengkap") return { disabled: true, statusText: "Valid", statusColor: "text-emerald-500" };
       return { disabled: true, statusText: "Sedang Ditinjau", statusColor: "text-amber-500" };
    }

    return { disabled: false, statusText: "Draft", statusColor: "text-slate-400" };
  };

  const propState = getFileState('proposal', existingProposal?.status_file_proposal);
  const transkripState = getFileState('transkrip', existingProposal?.status_file_transkrip);
  const formulirState = getFileState('formulir', existingProposal?.status_file_formulir);
  const referensiState = getFileState('referensi', existingProposal?.status_file_referensi);

  const handleSubmitAll = async () => {
    if (!hasFile(fileProposal, existingProposal?.file_path)) return alert("Mohon unggah dokumen Proposal Skripsi.");
    if (!hasFile(fileTranskrip, existingProposal?.file_transkrip)) return alert("Mohon unggah berkas Transkrip Nilai & KRS.");
    if (!hasFile(fileFormulir, existingProposal?.file_formulir)) return alert("Mohon unggah Formulir Pengajuan TA.");
    if (!hasFile(fileReferensi, existingProposal?.file_referensi)) return alert("Mohon unggah File Referensi Jurnal.");

    if (!judulSkripsi.trim()) return alert("Silakan isi judul skripsi Anda.");
    
    if (!existingProposal?.id) {
      if (!pembimbing1) return alert("Silakan tentukan minimal Pembimbing Utama.");
      if (pembimbing1 === pembimbing2 && pembimbing2 !== "") return alert("Dosen Pembimbing Utama dan Pendamping tidak boleh sama.");
    }

    try {
      setLoading(true);
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) return;

      const { data: currentProfile } = await supabase.from('profiles').select('nama').eq('id', user.id).single();
      const mhsNama = currentProfile?.nama || "Seorang mahasiswa";

      let pathProposal = existingProposal?.file_path;
      let pathTranskrip = existingProposal?.file_transkrip;
      let pathFormulir = existingProposal?.file_formulir;
      let pathReferensi = existingProposal?.file_referensi;

      let newStatusProp = existingProposal?.status_file_proposal || "Belum Diverifikasi";
      let newStatusTranskrip = existingProposal?.status_file_transkrip || "Belum Diverifikasi";
      let newStatusFormulir = existingProposal?.status_file_formulir || "Belum Diverifikasi";
      let newStatusReferensi = existingProposal?.status_file_referensi || "Belum Diverifikasi";

      const timestamp = Date.now();

      if (fileProposal) {
        pathProposal = `${user.id}/${timestamp}-proposal-${fileProposal.name.replace(/\s+/g, "_")}`;
        await supabase.storage.from("proposals").upload(pathProposal, fileProposal);
        newStatusProp = "Belum Diverifikasi"; 
      }
      if (fileTranskrip) {
        pathTranskrip = `${user.id}/${timestamp}-transkrip-${fileTranskrip.name.replace(/\s+/g, "_")}`;
        await supabase.storage.from("proposals").upload(pathTranskrip, fileTranskrip);
        newStatusTranskrip = "Belum Diverifikasi";
      }
      if (fileFormulir) {
        pathFormulir = `${user.id}/${timestamp}-formulir-${fileFormulir.name.replace(/\s+/g, "_")}`;
        await supabase.storage.from("proposals").upload(pathFormulir, fileFormulir);
        newStatusFormulir = "Belum Diverifikasi";
      }
      if (fileReferensi) {
        pathReferensi = `${user.id}/${timestamp}-jurnal-${fileReferensi.name.replace(/\s+/g, "_")}`;
        await supabase.storage.from("proposals").upload(pathReferensi, fileReferensi);
        newStatusReferensi = "Belum Diverifikasi";
      }

      const targetStatus = isDitolakDosbing ? "Menunggu Persetujuan Dosbing" : "Menunggu Verifikasi Tendik";

      if (existingProposal?.id) {
        const { error: updateError } = await supabase
          .from("proposals")
          .update({
            judul: judulSkripsi,
            bidang: bidangSkripsi,
            file_path: pathProposal,
            file_transkrip: pathTranskrip,
            file_formulir: pathFormulir,
            file_referensi: pathReferensi,
            status_file_proposal: newStatusProp,
            status_file_transkrip: newStatusTranskrip,
            status_file_formulir: newStatusFormulir,
            status_file_referensi: newStatusReferensi,
            status: targetStatus,
            is_locked: true
          })
          .eq("id", existingProposal.id);

        if (updateError) throw updateError;
        alert(`Pengajuan berhasil diperbarui! Status saat ini: ${targetStatus}`);
      } else {
        const { data: newProp, error: insertError } = await supabase
          .from("proposals")
          .insert({
            user_id: user.id,
            judul: judulSkripsi,
            bidang: bidangSkripsi,
            file_path: pathProposal,
            file_transkrip: pathTranskrip,
            file_formulir: pathFormulir,
            file_referensi: pathReferensi,
            status: "Menunggu Verifikasi Tendik",
            is_locked: true
          })
          .select('id').single();

        if (insertError) throw insertError;

        const inserts = [{ proposal_id: newProp.id, dosen_id: pembimbing1, tipe: "pembimbing1" }];
        if (pembimbing2) inserts.push({ proposal_id: newProp.id, dosen_id: pembimbing2, tipe: "pembimbing2" });
        await supabase.from("proposal_recommendations").insert(inserts);

        alert("Pengajuan berkas sukses dikirim! Berkas Anda akan diverifikasi oleh bagian Tendik terlebih dahulu.");
      }

      if (targetStatus === "Menunggu Verifikasi Tendik") {
        const { data: tendikList } = await supabase.from('profiles').select('id').eq('role', 'tendik');
        if (tendikList && tendikList.length > 0) {
          for (const t of tendikList) {
            await sendNotification(t.id, "Pengajuan Berkas Baru", `${mhsNama} telah mengirimkan dokumen persyaratan proposal untuk diverifikasi.`);
          }
        }
      } else if (targetStatus === "Menunggu Persetujuan Dosbing") {
        const { data: kaprodi } = await supabase.from('profiles').select('id').eq('role', 'kaprodi').maybeSingle();
        if (kaprodi) {
          await sendNotification(kaprodi.id, "Revisi Proposal Masuk", `${mhsNama} telah mengunggah perbaikan dokumen proposal skripsinya.`);
        }
      }

      setFileProposal(null); setFileTranskrip(null); setFileFormulir(null); setFileReferensi(null);
      mutate();
    } catch (err: any) {
      alert(`Gagal memproses pengajuan: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 max-w-[1400px] mx-auto font-sans">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Unggah Proposal Skripsi</h1>
        <p className="text-slate-500 mt-2 font-medium">Lengkapi seluruh berkas persyaratan administrasi dan usulan judul skripsi Anda di bawah ini.</p>
      </div>

      { !data ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-pulse">
           <div className="lg:col-span-7 h-[500px] bg-slate-200 rounded-[2.5rem]"></div>
           <div className="lg:col-span-5 h-[500px] bg-slate-200 rounded-[2.5rem]"></div>
        </div>
      ) : !data?.isProfileComplete ? (
        <div className="flex flex-col items-center justify-center min-h-[500px] bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 text-center">
           <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-8"><Lock size={40} /></div>
           <h2 className="text-2xl font-black text-slate-800 mb-4">Akses Terkunci</h2>
           <p className="text-slate-500 max-w-md font-medium leading-relaxed mb-8">Mohon lengkapi Foto Profil, NPM, dan Alamat Anda di pengaturan sebelum mengunggah berkas.</p>
           <Link href="/settings"><button className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all">Lengkapi Profil Sekarang</button></Link>
        </div>
      ) : (
        <>
          {isRevising && (
            <div className={`mb-8 p-6 rounded-[2rem] border flex items-start gap-4 shadow-sm animate-in fade-in duration-500 ${isDitolakDosbing ? 'bg-red-50 border-red-100 text-red-800' : 'bg-amber-50 border-amber-100 text-amber-800'}`}>
              <AlertTriangle size={24} className="shrink-0 mt-0.5" />
              <div>
                <h3 className="font-black text-lg tracking-tight">{isDitolakDosbing ? "Proposal Ditolak Calon Pembimbing" : "Berkas Administrasi Ditolak Tendik"}</h3>
                <p className="text-sm font-medium mt-1 leading-relaxed opacity-90">
                  {isDitolakDosbing 
                    ? "Calon pembimbing meminta Anda untuk mengoreksi substansi proposal. Silakan unggah dokumen proposal terbaru (file administrasi dan nama dosen dikunci)." 
                    : "Terdapat berkas administrasi yang tidak sesuai kriteria peninjauan Tendik. Silakan periksa kembali dan unggah ulang komponen dokumen yang ditolak."}
                </p>
              </div>
            </div>
          )}

          {isDitetapkan ? (
  <div className="mb-8 bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-3 text-emerald-700 font-bold text-xs animate-in fade-in duration-500">
    <CheckCircle size={16} /> Pengajuan selesai. Pembimbing Anda telah ditetapkan oleh Kaprodi.
  </div>
) : isFormLocked && (
  <div className="mb-8 bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-center gap-3 text-blue-700 font-bold text-xs animate-in fade-in duration-500">
    <Lock size={16} /> Data pengajuan telah dikunci selama masa peninjauan verifikasi.
  </div>
)}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/40 space-y-6">
                <h3 className="text-base font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-2"><FileCheck size={18} className="text-blue-500" /> Dokumen Persyaratan</h3>
                
                <FileUploadSlot 
                  label="1. Dokumen Proposal Skripsi (PDF)" 
                  fileName={fileProposal?.name || existingProposal?.file_path?.split("/").pop()} 
                  viewUrl={data?.previewUrls?.proposal}
                  disabled={propState.disabled}
                  statusText={propState.statusText}
                  statusColor={propState.statusColor}
                  onFileSelect={setFileProposal}
                />

                <FileUploadSlot 
                  label="2. Transkrip Nilai & KRS Ter-ACC Dosen Wali (PDF)" 
                  fileName={fileTranskrip?.name || existingProposal?.file_transkrip?.split("/").pop()} 
                  viewUrl={data?.previewUrls?.transkrip}
                  disabled={transkripState.disabled}
                  statusText={transkripState.statusText}
                  statusColor={transkripState.statusColor}
                  onFileSelect={setFileTranskrip}
                />

                <FileUploadSlot 
                  label="3. Formulir Kesanggupan Menyelesaikan TA (PDF)" 
                  fileName={fileFormulir?.name || existingProposal?.file_formulir?.split("/").pop()} 
                  viewUrl={data?.previewUrls?.formulir}
                  disabled={formulirState.disabled}
                  statusText={formulirState.statusText}
                  statusColor={formulirState.statusColor}
                  onFileSelect={setFileFormulir}
                />

                <FileUploadSlot 
                  label="4. File Dokumen Referensi Jurnal Utama (PDF)" 
                  fileName={fileReferensi?.name || existingProposal?.file_referensi?.split("/").pop()} 
                  viewUrl={data?.previewUrls?.referensi}
                  disabled={referensiState.disabled}
                  statusText={referensiState.statusText}
                  statusColor={referensiState.statusColor}
                  onFileSelect={setFileReferensi}
                />
              </div>
            </div>

            <div className="lg:col-span-5 space-y-6">
              <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40">
                <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2"><UserCheck size={22} className="text-blue-600" /> Detail Usulan & Pembimbing</h2>
                
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Judul Skripsi / Tugas Akhir</label>
                    <textarea
                      value={judulSkripsi}
                      onChange={(e) => setJudulSkripsi(e.target.value)}
                      disabled={isFormLocked || isDitolakTendik}
                      placeholder="Masukkan rancangan judul skripsi..."
                      className="w-full border border-slate-200 rounded-2xl p-4 text-sm focus:ring-4 focus:ring-blue-50 focus:border-blue-400 bg-slate-50/50 outline-none transition-all min-h-[100px] resize-none disabled:cursor-not-allowed disabled:opacity-70"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Bidang Kajian Utama</label>
                    <div className="relative">
                      <select
                        value={bidangSkripsi}
                        onChange={(e) => setBidangSkripsi(e.target.value)}
                        disabled={isFormLocked || isDitolakTendik}
                        className="w-full border border-slate-200 rounded-2xl p-4 text-sm bg-slate-50/50 focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {["AI", "Machine Learning", "Data Science", "Jaringan Komputer", "Internet of Things", "Cyber Security", "Rancang Bangun", "Lainnya"].map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      {(!isFormLocked && !isDitolakTendik) && <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />}
                    </div>
                  </div>

                  <div className="h-px bg-slate-100 my-2"></div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Rekomendasi Pembimbing Utama</label>
                    <div className="relative">
                      <select
                        value={pembimbing1}
                        onChange={(e) => setPembimbing1(e.target.value)}
                        disabled={isFormLocked || isDitolakDosbing || isDitolakTendik}
                        className="w-full border border-slate-200 rounded-2xl p-4 text-sm bg-slate-50/50 focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none appearance-none cursor-pointer disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        <option value="">-- Pilih Dosen Pembimbing --</option>
                        {listDosen.map((dosen) => (
                          <option key={dosen.id} value={dosen.id}>{dosen.nama}</option>
                        ))}
                      </select>
                      {(!isFormLocked && !isDitolakDosbing && !isDitolakTendik) && <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Rekomendasi Co-Pembimbing</label>
                    <div className="relative">
                      <select
                        value={pembimbing2}
                        onChange={(e) => setPembimbing2(e.target.value)}
                        disabled={isFormLocked || isDitolakDosbing || isDitolakTendik}
                        className="w-full border border-slate-200 rounded-2xl p-4 text-sm bg-slate-50/50 focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none appearance-none cursor-pointer disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        <option value="">-- Pilih Co-Pembimbing (Opsional) --</option>
                        {listDosen.map((dosen) => (
                          <option key={dosen.id} value={dosen.id}>{dosen.nama}</option>
                        ))}
                      </select>
                      {(!isFormLocked && !isDitolakDosbing && !isDitolakTendik) && <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />}
                    </div>
                  </div>

                  {existingProposal && (
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1.5 text-xs font-bold mt-4">
                      <div className="flex justify-between"><span className="text-slate-400">Status Saat Ini:</span><span className="text-blue-600 uppercase font-black">{statusSistem}</span></div>
                    </div>
                  )}

                  <button
                    onClick={handleSubmitAll}
                    disabled={isFormLocked || isDitetapkan || loading}
                    className={`w-full py-4 flex items-center justify-center gap-2 rounded-2xl text-xs font-black tracking-widest uppercase shadow-xl transition-all active:scale-95 mt-4
                      ${isDitetapkan
                        ? "bg-emerald-100 text-emerald-700 shadow-none cursor-not-allowed"
                        : isFormLocked 
                          ? "bg-blue-100 text-blue-600 shadow-none cursor-not-allowed" 
                          : "bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700 disabled:opacity-50"}`}
                  >
                    {isDitetapkan ? (
                      "PEMBIMBING TELAH DITETAPKAN"
                    ) : isFormLocked ? (
                      "PENGAJUAN SEDANG DITINJAU"
                    ) : loading ? (
                      "MEMPROSES..."
                    ) : (
                      <>
                        <Send size={16} /> 
                        {isDitolakDosbing 
                          ? "KIRIM REVISI PROPOSAL" 
                          : isDitolakTendik 
                            ? "KIRIM ULANG BERKAS" 
                            : "KIRIM PENGAJUAN BERKAS"}
                      </>
                    )}
                  </button>
                </div>
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

interface UploadSlotProps {
  label: string;
  fileName: string | undefined;
  viewUrl: string | null | undefined;
  disabled: boolean;
  statusText: string;
  statusColor: string;
  onFileSelect: (file: File) => void;
}

function FileUploadSlot({ label, fileName, viewUrl, disabled, statusText, statusColor, onFileSelect }: UploadSlotProps) {
  return (
    <div className={`p-4 border bg-slate-50/50 rounded-2xl space-y-3 transition-colors ${disabled ? 'border-slate-100' : 'border-blue-100 hover:border-blue-200'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
             <h4 className="text-xs font-black text-slate-700 tracking-tight">{label}</h4>
             {statusText === 'Valid' && <CheckCircle size={14} className="text-emerald-500"/>}
             {statusText === 'Ditolak (Wajib Diganti)' && <XCircle size={14} className="text-red-500"/>}
          </div>
          
          <div className="flex items-center gap-2">
             <span className={`text-[9px] font-black uppercase tracking-widest ${statusColor}`}>{statusText}</span>
             <span className="text-slate-300">•</span>
             <p className="text-[10px] text-slate-400 font-bold truncate max-w-[200px]">
               {fileName ? fileName : "Belum ada berkas terpilih."}
             </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {viewUrl && (
            <a href={viewUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-blue-100 hover:text-blue-700 transition flex items-center gap-1">
              <FileText size={12} /> Lihat
            </a>
          )}
          <label className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition shadow-sm flex items-center gap-1.5
            ${disabled 
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60' 
              : 'bg-slate-900 text-white hover:bg-blue-600 cursor-pointer active:scale-95'}`}>
            <CloudUpload size={12} /> {fileName ? "Ganti" : "Pilih"}
            {!disabled && (
              <input type="file" accept="application/pdf" hidden onChange={(e) => e.target.files && onFileSelect(e.target.files[0])} />
            )}
          </label>
        </div>
      </div>
    </div>
  );
}