"use client";

import React from 'react';
import { 
  LayoutDashboard, FileUp, MessageSquare, 
  FileText, Settings, HelpCircle, LogOut, 
  Bell, Search, MoreHorizontal, Filter,
  Mail
} from 'lucide-react';

// --- TYPES ---
interface StatCardProps {
  count: number;
  label: string;
  trend: string;
  trendColor: string;
}

interface StudentTask {
  name: string;
  npm: string;
  title: string;
  status: string;
  lecturer: string;
}

interface VerificationItem {
  name: string;
  task: string;
  date: string;
}

// --- MAIN COMPONENT ---
export default function DashboardTendik() {
  return (
    <div className="flex min-h-screen bg-[#f8f9fa] font-sans text-slate-700">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full">
        <div className="p-6 flex items-center gap-3 border-b border-gray-50">
          <div className="w-10 h-10 bg-[#2b5a9e] rounded-full flex items-center justify-center text-white font-bold text-lg">A</div>
          <div>
            <p className="text-sm font-bold text-[#1e3a8a] leading-none">Anton</p>
            <p className="text-[10px] text-blue-400 mt-1 uppercase font-semibold">Tenaga Kependidikan</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">Menu</p>
          <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" active />
          <NavItem icon={<FileUp size={18} />} label="Unggah Proposal" />
          <NavItem icon={<MessageSquare size={18} />} label="Bimbingan" />
          <NavItem icon={<FileText size={18} />} label="Unggah Dokumen Seminar" />

          <div className="pt-8">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">Others</p>
            <NavItem icon={<Settings size={18} />} label="Settings" />
            <NavItem icon={<HelpCircle size={18} />} label="Help" />
          </div>
        </nav>

        <div className="p-6 border-t border-gray-100">
          <div className="flex items-center gap-3 text-gray-400 text-sm">
            <LogOut size={18} className="rotate-180" />
            <span className="font-medium text-xs">V.1.0.0</span>
          </div>
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
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-5 text-gray-400">
            <Mail size={20} className="cursor-pointer hover:text-blue-600 transition" />
            <div className="relative cursor-pointer hover:text-blue-600 transition">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-[1200px]">
          <h1 className="text-xl font-bold text-gray-800 mb-8">Selamat Datang, Anton</h1>

          {/* STATS CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <StatCard count={12} label="Usulan Judul Baru" trend="5 judul minggu ini" trendColor="text-emerald-500" />
            <StatCard count={26} label="Dokumen Perlu Diverifikasi" trend="20 dokumen minggu ini" trendColor="text-emerald-500" />
            <StatCard count={8} label="Jadwal Seminar Bulan Ini" trend="tetap minggu ini" trendColor="text-orange-300" />
          </div>

          {/* TABLE MANAGEMENT */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-8 overflow-hidden">
            <div className="p-6 flex flex-wrap items-center justify-between gap-4 border-b border-gray-50">
              <h2 className="text-lg font-bold text-gray-800">Manajemen Skripsi Mahasiswa</h2>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold border border-blue-100 cursor-pointer">
                  <Filter size={14} />
                  <span>Proses Bimbingan</span>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                  <input 
                    type="text" 
                    placeholder="Cari Data Mahasiswa" 
                    className="pl-9 pr-4 py-1.5 border border-gray-200 rounded-lg text-xs w-48 focus:outline-none"
                  />
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 text-[11px] uppercase tracking-wider text-gray-500 font-bold">
                    <th className="px-6 py-4">Nama Mahasiswa</th>
                    <th className="px-6 py-4 text-center">NPM</th>
                    <th className="px-6 py-4">Judul Skripsi</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4">Pembimbing</th>
                    <th className="px-6 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  <StudentRow 
                    name="Gerald Christopher"
                    npm="140810220014"
                    title="Rancang Bangun Sistem Informasi Manajemen Bidang Skripsi Menggunakan Metode Extreme Programming"
                    status="Disetujui"
                    lecturer="Dr. Juli Rejito, M.Kom"
                  />
                </tbody>
              </table>
            </div>
          </section>

          {/* VERIFICATION LIST */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50">
              <h2 className="text-lg font-bold text-gray-800">Verifikasi Berkas</h2>
            </div>
            <div className="divide-y divide-gray-50">
              <VerificationRow name="Gerald Christopher" task="Unggah Berita Acara Bimbingan" date="18 April 2026" />
              <VerificationRow name="Vera Setiawati" task="Unggah Berita Acara Bimbingan" date="19 April 2026" />
              <div className="h-12 bg-white"></div> {/* Placeholder gap like in image */}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

// --- SUB-COMPONENTS ---

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

function StatCard({ count, label, trend, trendColor }: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
      <div className="p-3 bg-gray-50 rounded-xl">
        <FileText size={24} className="text-blue-900/40" />
      </div>
      <div>
        <p className="text-3xl font-bold text-gray-800">{count}</p>
        <p className="text-sm font-semibold text-gray-700 mt-1">{label}</p>
        <div className={`flex items-center gap-2 mt-3 text-[11px] font-bold ${trendColor}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
          {trend}
        </div>
      </div>
    </div>
  );
}

function StudentRow({ name, npm, title, status, lecturer }: StudentTask) {
  return (
    <tr className="hover:bg-gray-50/50 transition">
      <td className="px-6 py-5 font-bold text-gray-800">{name}</td>
      <td className="px-6 py-5 text-center font-medium text-gray-600">{npm}</td>
      <td className="px-6 py-5 max-w-xs leading-relaxed text-[13px] font-semibold text-gray-700">{title}</td>
      <td className="px-6 py-5 text-center">
        <span className="px-4 py-1.5 bg-emerald-100 text-emerald-600 text-[11px] font-bold rounded-full border border-emerald-200">
          {status}
        </span>
      </td>
      <td className="px-6 py-5 font-semibold text-gray-700">{lecturer}</td>
      <td className="px-6 py-5 text-center">
        <button className="px-4 py-1.5 bg-gray-400 text-white text-[11px] font-bold rounded-lg hover:bg-gray-500 transition">
          Lihat Detail
        </button>
      </td>
    </tr>
  );
}

function VerificationRow({ name, task, date }: VerificationItem) {
  return (
    <div className="px-8 py-5 flex items-center justify-between hover:bg-gray-50/50 transition">
      <div className="grid grid-cols-3 w-full items-center">
        <span className="font-bold text-gray-800">{name}</span>
        <span className="font-semibold text-gray-700 text-[13px]">{task}</span>
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-500 text-[13px]">{date}</span>
          <MoreHorizontal className="text-gray-300 cursor-pointer hover:text-gray-600" size={20} />
        </div>
      </div>
    </div>
  );
}