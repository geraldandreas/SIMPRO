import SidebarTendik from "@/components/sidebar-tendik";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import TableClient from "./tableClient";

export default async function VerifikasiBerkasPage() {
  const supabase = await supabaseAdmin;

  const { data, error } = await supabase
    .from("seminar_documents")
    .select(`
      id,
      nama_dokumen,
      file_url,
      status,
      created_at,
      proposal:proposal_id (
        user:user_id (
          nama
        )
      )
    `)
    .eq("status", "Menunggu Verifikasi")
    .order("created_at", { ascending: false });


  if (error) {
    console.error("DB Error:", error.message);
  }

  return (
    <div className="flex min-h-screen bg-white font-sans text-slate-700">
      <SidebarTendik />

      <main className="flex-1 ml-64 p-8">
        <h1 className="text-xl font-bold mb-6">
          Verifikasi Berkas Mahasiswa
        </h1>

        {/* ⬇️ kirim data ke client */}
        <TableClient documents={data ?? []} />
      </main>
    </div>
  );
}
