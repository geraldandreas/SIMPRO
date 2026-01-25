"use client";

import { useState } from "react";
import {
  MoreHorizontal,
  Eye,
  Download,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface VerificationItem {
  id: string;
  nama_dokumen: string;
  file_url: string;
  status: string;
  created_at: string;
  proposal?: {
    user?: {
      nama: string;
    }| null;
  } | null;
}

export default function TableClient({
  documents,
}: {
  documents: VerificationItem[];
}) {
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  const toggleDropdown = (id: string) => {
    setActiveDropdownId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="border rounded-xl bg-white shadow-sm">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="px-6 py-4 text-left">Nama</th>
            <th className="px-6 py-4 text-left">File</th>
            <th className="px-6 py-4 text-left">Tanggal</th>
            <th className="px-6 py-4 text-right">Aksi</th>
          </tr>
        </thead>

        <tbody>
          {documents.map((item) => (
            <tr key={item.id} className="border-b">
              <td className="px-6 py-4">
                {item.proposal?.user?.nama ?? "-"}
                
              </td>

              <td className="px-6 py-4">
                {item.nama_dokumen}
              </td>

              <td className="px-6 py-4">
                {new Date(item.created_at).toLocaleDateString("id-ID")}
              </td>

              <td className="px-6 py-4 text-right relative">
                <button onClick={() => toggleDropdown(item.id)}>
                  <MoreHorizontal />
                </button>

                {activeDropdownId === item.id && (
                  <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg p-2">
                    <button className="flex gap-2 items-center w-full p-2 hover:bg-gray-100">
                      <Eye size={16} /> Preview
                    </button>

                    <button className="flex gap-2 items-center w-full p-2 hover:bg-gray-100">
                      <Download size={16} /> Download
                    </button>

                    <button className="flex gap-2 items-center w-full p-2 text-green-600 hover:bg-green-50">
                      <CheckCircle size={16} /> Verifikasi
                    </button>

                    <button className="flex gap-2 items-center w-full p-2 text-red-600 hover:bg-red-50">
                      <XCircle size={16} /> Tolak
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
