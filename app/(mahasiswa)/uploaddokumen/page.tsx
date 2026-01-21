"use client";

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/sidebar';
import { supabase } from '@/lib/supabaseClient';
import { Bell, Search, Check, X, Clock, Layout, AlertCircle } from 'lucide-react';

interface DocumentData {
  id?: string;
  status: string;
  file_url?: string;
}

export default function UnggahDokumenSeminar() {
  const [documents, setDocuments] = useState<{ [key: string]: DocumentData }>({});
  const [loading, setLoading] = useState(true);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [proposalStatus, setProposalStatus] = useState<string | null>(null); // Untuk debugging status proposal

  // List Dokumen
  const academicDocs = [
    { id: 'berita_acara_bimbingan', label: "Berita Acara Bimbingan", subLabel: "Download di SIAT" },
    { id: 'transkrip_nilai', label: "Transkrip Nilai", subLabel: "Disahkan dosen wali" },
    { id: 'matriks_perbaikan', label: "Formulir Matriks Perbaikan Skripsi" },
    { id: 'toefl', label: "Sertifikat TOEFL", subLabel: "Skor min 475" },
    { id: 'print_jurnal', label: "Print Out Jurnal Skripsi" },
    { id: 'sertifikat_publikasi', label: "Sertifikat Publikasi / Jurnal" },
  ];

  const adminDocs = [
    { id: 'pengajuan_sidang', label: "Formulir Pengajuan Sidang" },
    { id: 'bukti_bayar', label: "Bukti Pembayaran Registrasi" },
    { id: 'bebas_pus_univ', label: "Bebas Pinjaman Perpustakaan Univ" },
    { id: 'bebas_pus_fak', label: "Bebas Pinjaman Perpustakaan Fak" },
    { id: 'bukti_pengajuan_judul', label: "Bukti pengajuan Topik/Judul" },
    { id: 'skpi', label: "SKPI" },
    { id: 'biodata_sidang', label: "Biodata Sidang" },
    { id: 'foto', label: "Foto Hitam Putih Cerah" },
    { id: 'pengantar_ijazah', label: "Surat Pengantar Ijazah" },
    { id: 'print_skripsi', label: "Print Out Skripsi 3 buah" },
    { id: 'flyer', label: "FLYER Skripsi" },
  ];

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. CEK PROPOSAL (Syarat Utama)
      const { data: proposal, error: propError } = await supabase
        .from('proposals')
        .select('id, status') // Ambil ID dan Status
        .eq('user_id', user.id)
        .maybeSingle();

      if (propError) {
        console.error("Error ambil proposal:", propError);
      }

      if (!proposal) {
        setProposalStatus("missing"); // Tandai bahwa proposal tidak ditemukan
        setLoading(false);
        return; 
      }
      
      setProposalStatus("found"); // Proposal ada

      // 2. PROPOSAL ADA -> CARI/BUAT SEMINAR REQUEST
      let { data: request, error: reqError } = await supabase
        .from('seminar_requests')
        .select('id')
        .eq('proposal_id', proposal.id)
        .maybeSingle();

      // Jika belum ada request seminar, buatkan otomatis
      if (!request) {
        const { data: newReq, error: createError } = await supabase
          .from('seminar_requests')
          .insert({ 
            proposal_id: proposal.id, 
            status: 'draft',
            tipe: 'seminar' // Pastikan ini sesuai constraint database (huruf kecil)
          })
          .select().single();
        
        if (createError) {
          console.error("Gagal buat request:", createError);
          setLoading(false);
          return;
        }
        request = newReq;
      }

      if (request) {
        setRequestId(request.id);
        
        // 3. AMBIL DOKUMEN YANG SUDAH DIUPLOAD
        const { data: docs } = await supabase
          .from('seminar_documents')
          .select('*')
          .eq('seminar_request_id', request.id);

        if (docs) {
          const docMap: { [key: string]: DocumentData } = {};
          docs.forEach(d => {
            docMap[d.nama_dokumen] = { id: d.id, status: d.status, file_url: d.file_url };
          });
          setDocuments(docMap);
        }
      }
    } catch (err: any) {
      console.error("System Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (docId: string, file: File) => {
    if (proposalStatus === "missing") {
      alert("⚠️ Anda belum mengunggah proposal! Silakan unggah proposal skripsi Anda terlebih dahulu di menu 'Unggah Proposal'.");
      return;
    }

    if (!requestId) {
      alert("Sedang memuat data... coba refresh halaman.");
      return;
    }

    const confirmUpload = window.confirm(`Unggah dokumen ${file.name}?`);
    if (!confirmUpload) return;

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      // Gunakan Request ID untuk nama folder agar rapi
      const filePath = `${requestId}/${docId}_${Date.now()}.pdf`;

      // 1. Upload Storage
      const { error: storageError } = await supabase.storage
        .from('docseminar')
        .upload(filePath, file);

      if (storageError) throw storageError;

      // 2. Simpan Database
      const { error: dbError } = await supabase
        .from('seminar_documents')
        .upsert({
          seminar_request_id: requestId,
          nama_dokumen: docId,
          file_url: filePath,
          status: 'Menunggu Verifikasi'
        }, { onConflict: 'seminar_request_id,nama_dokumen' });

      if (dbError) throw dbError;

      alert("✅ Berhasil diunggah!");
      await fetchInitialData(); // Refresh UI otomatis

    } catch (error: any) {
      alert("Gagal: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (docId: string, filePath: string) => {
    if (!window.confirm("Hapus file ini?")) return;
    try {
      setLoading(true);
      await supabase.storage.from('docseminar').remove([filePath]);
      
      await supabase.from('seminar_documents')
        .delete()
        .match({ seminar_request_id: requestId, nama_dokumen: docId });
      
      await fetchInitialData();
    } catch (error: any) {
      alert("Gagal hapus: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIKA PERSENTASE (Menghitung Lengkap + Menunggu Verifikasi) ---
  const countUploaded = (docList: typeof academicDocs) => {
    return docList.filter(d => {
      const s = documents[d.id]?.status;
      return s === 'Lengkap' || s === 'Menunggu Verifikasi';
    }).length;
  };

  const currentAcademic = countUploaded(academicDocs);
  const currentAdmin = countUploaded(adminDocs);
  const totalUploaded = currentAcademic + currentAdmin;
  const percentage = Math.round((totalUploaded / 17) * 100);

  return (
    <div className="flex h-screen bg-[#f8f9fa] font-sans text-slate-700 overflow-hidden">
      <Sidebar />
      <main className="flex-1 ml-64 flex flex-col h-full">
        {/* HEADER */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 shrink-0 z-20">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <input type="text" placeholder="Search" className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none" />
          </div>
          <Bell size={20} className="text-gray-400" />
        </header>

        <div className="flex-1 flex flex-col p-8 overflow-hidden">
          
          {/* WARNING JIKA PROPOSAL BELUM ADA */}
          {proposalStatus === "missing" && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700">
              <AlertCircle size={24} />
              <div>
                <h3 className="font-bold">Proposal Belum Ditemukan</h3>
                <p className="text-sm">Anda harus mengunggah proposal skripsi terlebih dahulu di menu "Unggah Proposal" sebelum bisa melengkapi dokumen seminar.</p>
              </div>
            </div>
          )}

          {/* PROGRESS CARD */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-6 shrink-0 flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-800 mb-2">Kelengkapan Dokumen Seminar</h1>
              <p className="text-lg font-bold text-gray-800 mb-4">{totalUploaded} dari 17 <span className="text-gray-400 font-medium">dokumen terunggah</span></p>
              <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden">
                <div className="bg-blue-400 h-full transition-all duration-700" style={{ width: `${percentage}%` }}></div>
              </div>
            </div>
            <div className="ml-12 relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="58" stroke="#f3f4f6" strokeWidth="12" fill="transparent" />
                <circle cx="64" cy="64" r="58" stroke="#60a5fa" strokeWidth="12" fill="transparent" strokeDasharray="364.4" strokeDashoffset={364.4 - (364.4 * percentage) / 100} className="transition-all duration-1000" />
              </svg>
              <span className="absolute text-3xl font-bold text-blue-500">{percentage}%</span>
            </div>
          </div>

          {/* LIST DOKUMEN */}
          <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-y-auto flex-1 p-8 space-y-10 custom-scrollbar">
              
              <section>
                <div className="flex items-center justify-between mb-6 border-b pb-2">
                  <div className="flex items-center gap-3">
                    <Layout className="text-blue-400" size={20} />
                    <h2 className="text-lg font-bold text-gray-800">Akademik</h2>
                  </div>
                  <span className="text-sm font-bold text-gray-400">{currentAcademic}/6 Terunggah</span>
                </div>
                <div className="space-y-1">
                  {academicDocs.map(doc => (
                    <DocumentRow key={doc.id} {...doc} data={documents[doc.id]} onUpload={(f: File) => handleUpload(doc.id, f)} onDelete={() => handleDelete(doc.id, documents[doc.id]?.file_url || '')} />
                  ))}
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-6 border-b pb-2">
                  <div className="flex items-center gap-3">
                    <Layout className="text-blue-400" size={20} />
                    <h2 className="text-lg font-bold text-gray-800">Administrasi</h2>
                  </div>
                  <span className="text-sm font-bold text-gray-400">{currentAdmin}/11 Terunggah</span>
                </div>
                <div className="space-y-1">
                  {adminDocs.map(doc => (
                    <DocumentRow key={doc.id} {...doc} data={documents[doc.id]} onUpload={(f: File) => handleUpload(doc.id, f)} onDelete={() => handleDelete(doc.id, documents[doc.id]?.file_url || '')} />
                  ))}
                </div>
              </section>

              <div className="pt-6 border-t flex justify-end">
                <button disabled={percentage < 100} className={`px-10 py-3 rounded-lg font-bold transition ${percentage === 100 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                  Ajukan Seminar
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function DocumentRow({ label, subLabel, data, onUpload, onDelete }: any) {
  const fileRef = useRef<HTMLInputElement>(null);
  const status = data?.status || 'Belum Lengkap';
  const isPending = status === 'Menunggu Verifikasi';
  const isComplete = status === 'Lengkap';
  const hasFile = !!data?.file_url;

  const handleView = async () => {
    if (!data?.file_url) return;
    const { data: signed } = await supabase.storage.from('docseminar').createSignedUrl(data.file_url, 60);
    if (signed) window.open(signed.signedUrl, '_blank');
  };

  return (
    <div className="flex items-center justify-between p-4 hover:bg-gray-50/50 border-b border-gray-50 last:border-0 transition-colors">
      <div className="flex items-center gap-4 flex-1">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isComplete ? 'bg-emerald-100 text-emerald-600' : (isPending ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-500')}`}>
          {isComplete ? <Check size={20} /> : (isPending ? <Clock size={20} /> : <X size={20} />)}
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800">{label}</p>
          {subLabel && <p className="text-[11px] text-gray-400 font-medium">{subLabel}</p>}
        </div>
      </div>

      <div className="flex items-center gap-6">
        {hasFile && (
          <button onClick={handleView} className="px-4 py-1.5 border border-gray-300 rounded-lg text-xs font-bold text-gray-600 hover:bg-white shadow-sm transition">Lihat File</button>
        )}

        {isPending && (
          <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1.5 rounded-full border border-yellow-100">
            <span className="text-[10px] font-bold text-yellow-600 uppercase">Menunggu Verifikasi</span>
          </div>
        )}
        
        {status === 'Belum Lengkap' && <span className="text-[12px] font-bold text-red-500 uppercase mr-4">Belum Lengkap</span>}

        {hasFile ? (
          <button onClick={onDelete} className="px-6 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold active:scale-95 transition">Hapus</button>
        ) : (
          <>
            <button onClick={() => fileRef.current?.click()} className="px-6 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-xs font-bold cursor-pointer hover:bg-gray-50 transition shadow-sm">Unggah</button>
            <input ref={fileRef} type="file" className="hidden" accept=".pdf" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
              e.target.value = "";
            }} />
          </>
        )}
      </div>
    </div>
  );
}