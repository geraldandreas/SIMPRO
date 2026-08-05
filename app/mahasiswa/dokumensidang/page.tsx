import { Suspense } from "react";
import DokumenSidangMahasiswaClient from "./dokumensidangclient"; 

export const dynamic = "force-dynamic";

function SkeletonDokumenSidang() {
  return (
    <div className="flex h-screen bg-[#F8F9FB] font-sans text-slate-700 overflow-hidden animate-pulse">
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#F8F9FB]">
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <div className="max-w-6xl mx-auto w-full">
            
            <div className="mb-10">
              <div className="h-8 w-64 bg-slate-200 rounded-lg mb-3"></div>
              <div className="h-4 w-96 bg-slate-200 rounded-lg"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">
              
              <div className="lg:col-span-7 bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 flex items-center gap-10 overflow-hidden h-[200px]">
                <div className="w-32 h-32 rounded-full border-[10px] border-slate-100 bg-slate-50 shrink-0"></div>
                <div className="flex flex-col gap-3 w-full">
                  <div className="h-6 w-48 bg-slate-200 rounded-lg"></div>
                  <div className="h-3 w-64 bg-slate-100 rounded-full"></div>
                </div>
              </div>

              <div className="lg:col-span-5 bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm flex flex-col justify-between h-[200px]">
                <div className="h-5 w-48 bg-slate-200 rounded-md"></div>
                <div className="h-16 w-full bg-slate-100 rounded-2xl mt-4"></div>
                <div className="h-2 w-48 bg-slate-100 rounded-full mt-auto"></div>
              </div>
              
            </div>

            <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
              
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                <div className="h-5 w-64 bg-slate-200 rounded-lg"></div>
                <div className="h-8 w-64 bg-slate-200 rounded-xl hidden md:block"></div>
              </div>
              
              <div className="p-8 space-y-4 flex-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between p-6 rounded-[2rem] border border-slate-100 bg-white">
                    
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 rounded-xl bg-slate-200 shrink-0"></div>
                      <div className="space-y-2">
                        <div className="h-4 w-64 bg-slate-200 rounded-md"></div>
                        <div className="h-3 w-40 bg-slate-100 rounded-full"></div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="h-8 w-28 bg-slate-100 rounded-xl"></div>
                    </div>

                  </div>
                ))}

                <div className="mt-8 p-6 bg-slate-100 rounded-[2rem] flex items-center gap-6 h-[100px]">
                  <div className="w-12 h-12 bg-slate-200 rounded-2xl shrink-0"></div>
                  <div className="space-y-2 w-full">
                    <div className="h-4 w-48 bg-slate-300 rounded-md"></div>
                    <div className="h-3 w-64 bg-slate-200 rounded-full"></div>
                  </div>
                </div>
              </div>

              <div className="p-10 bg-slate-50/50 border-t border-slate-100 flex justify-center mt-auto">
                <div className="h-14 w-72 bg-slate-200 rounded-full"></div>
              </div>

            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

export default function DokumenSidangMahasiswaPage() {
  return (
    <Suspense fallback={<SkeletonDokumenSidang />}>
      <DokumenSidangMahasiswaClient />
    </Suspense>
  );
}