"use client";

import React from 'react';
import { 
  LayoutDashboard, Users, FolderOpen, 
  Settings, HelpCircle, LogOut, 
  Bell, Search, MessageSquare 
} from 'lucide-react';

// --- TYPES ---
interface StatCardProps {
  count: string | number;
  label: string;
  subLabel: string;
}

interface StudentBimbingan {
  name: string;
  npm: string;
  status: string;
  lecturer2: string;
  statusColor: string;
}

// --- MAIN COMPONENT ---
export default function DashboardDosen() {
  return (
    <div className="flex min-h-screen bg-[#f8f9fa] font-sans text-slate-700">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full">
        <div className="p-6 flex items-center gap-3 border-b border-gray-50">
          <div className="w-10 h-10 bg-[#2b5a9e] rounded-full flex items-center justify-center text-white font-bold text-lg">G</div>
          <div>
            <p className="text-sm font-bold text-[#1e3a8a] leading-none">Dr. Asep Sholahuddin, MT.</p>
            <p className="text-[10px] text-blue-400 mt-1 uppercase font-semibold">Dosen</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">Menu</p>
          <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" active />
          <NavItem icon={<Users size={18} />} label="Mahasiswa bimbingan" />
          <NavItem icon={<FolderOpen size={18} />} label="Akses Proposal" />

          <div className="pt-8">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">Others</p>
            <NavItem icon={<Settings size={18} />} label="Settings" />
            <NavItem icon={<HelpCircle size={18} />} label="Help" />
          </div>
        </nav>

        <div className="p-6 border-t border-gray-100 flex items-center gap-3 text-gray-400 text-sm">
          <LogOut size={18} className="rotate-180" />
          <span className="font-medium text-xs">V.1.0.0</span>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 ml-64 min-h-screen">
        
        {/* TOP HEADER */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-20">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <input 
              type="text" 
              placeholder="Search" 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-5 text-gray-400">
            <MessageSquare size={20} className="cursor-pointer hover:text-blue-600 transition" />
            <div className="relative cursor-pointer hover:text-blue-600 transition">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-[1200px]">
          <h1 className="text-xl font-bold text-gray-800 mb-8">Selamat Datang, Dr. Asep Sholahuddin, MT.</h1>

          {/* STATS CARDS (3 Cards as per reference) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <StatCard count="5" label="Mahasiswa" subLabel="Bimbingan" />
            <StatCard count="4" label="Proposal" subLabel="Menunggu Persetujuan" />
            <StatCard count="1" label="Menunggu" subLabel="Persetujuan Seminar" />
          </div>

          {/* TABLE SECTION */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-800">Mahasiswa Bimbingan</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 border-y border-gray-100">
                  <tr className="text-[11px] uppercase tracking-wider text-gray-500 font-bold">
                    <th className="px-6 py-4">Nama Mahasiswa</th>
                    <th className="px-6 py-4">NPM</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Pembimbing 2</th>
                    <th className="px-6 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <TableRow 
                    name="Gerald Christopher Andreas" 
                    npm="140810220014" 
                    lecturer2="Dr. Juli Rejito, M.Kom"
                    status="Proses Kesiapan Seminar" 
                    statusColor="bg-blue-100 text-blue-600 border-blue-200"
                  />
                  <TableRow 
                    name="Vera Setiawati" 
                    npm="140810220013" 
                    lecturer2="-"
                    status="Pengajuan Proposal" 
                    statusColor="bg-yellow-100 text-yellow-600 border-yellow-200"
                  />
                  <TableRow 
                    name="Dobi Nugraha" 
                    npm="140810220012" 
                    lecturer2="Rudi Rosadi, S.Si, M.Kom"
                    status="Proses Bimbingan" 
                    statusColor="bg-emerald-100 text-emerald-600 border-emerald-200"
                  />
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

// --- HELPER COMPONENTS ---

function NavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer ${
      active ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
    }`}>
      {icon}
      <span>{label}</span>
    </div>
  );
}

function StatCard({ count, label, subLabel }: StatCardProps) {
  return (
    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
      <span className="text-4xl font-bold text-gray-800 mb-2">{count}</span>
      <p className="text-sm font-bold text-gray-700 leading-tight">{label}</p>
      <p className="text-sm font-bold text-gray-700 leading-tight">{subLabel}</p>
    </div>
  );
}

function TableRow({ name, npm, status, lecturer2, statusColor }: StudentBimbingan) {
  return (
    <tr className="hover:bg-gray-50/50 transition text-[13px] font-semibold text-gray-700">
      <td className="px-6 py-5">{name}</td>
      <td className="px-6 py-5 font-medium">{npm}</td>
      <td className="px-6 py-5">
        <span className={`px-4 py-1.5 rounded-full border text-[11px] font-bold ${statusColor}`}>
          {status}
        </span>
      </td>
      <td className="px-6 py-5 font-medium">{lecturer2}</td>
      <td className="px-6 py-5 text-center">
        <button className="px-4 py-1.5 bg-[#67a38a] text-white text-[11px] font-bold rounded-lg hover:bg-[#5a8f79] transition shadow-sm">
          Lihat Detail
        </button>
      </td>
    </tr>
  );
}