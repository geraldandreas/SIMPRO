'use client'

import React, { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function Signup() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // ======================
  // EMAIL SIGNUP
  // ======================
  const handleSignup = async () => {
    if (!email || !password) {
      alert('Email dan password wajib diisi.')
      return
    }

    try {
      setLoading(true)

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'mahasiswa',
          },
        },
      })

      if (error) {
        alert(error.message)
        return
      }

      alert('Signup berhasil! Silakan cek email untuk verifikasi atau langsung login.')
      router.push('/login')
    } catch (err) {
      console.error(err)
      alert('Terjadi kesalahan saat signup.')
    } finally {
      setLoading(false)
    }
  }

  // ======================
  // GOOGLE SIGNUP
  // ======================
  const handleGoogleSignup = async () => {
    try {
      setLoading(true)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            prompt: 'select_account',
          },
        },
      })

      if (error) {
        alert(error.message)
      }
    } catch (err) {
      console.error(err)
      alert('Gagal login dengan Google.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white font-sans">
      
      {/* SISI KIRI (BIRU) */}
      <div className="relative bg-[#1a5fb4] text-white flex flex-col justify-between overflow-hidden">
        
        <div 
          className="hidden lg:block absolute top-0 -right-1 h-full w-[15%] bg-white"
          style={{ 
            borderRadius: "100% 0 0 100% / 50%",
            transform: "scaleY(1.1)"
          }}
        />

        <div className="z-10 px-12 pt-20 text-center lg:text-left">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            Selamat Datang Di <br /> SIMPRO
          </h1>

          <p className="max-w-md text-[15px] leading-relaxed opacity-90 mx-auto lg:mx-0">
            SIMPRO ( Sistem Informasi PROcessing Sidang ) adalah website sistem
            informasi manajemen sidang skripsi yang dapat membantu mahasiswa,
            ketua program prodi serta dosen untuk melakukan monitoring terhadap skripsi.
          </p>
        </div>

        <div className="relative z-10 flex justify-center mt-auto">
          <img
            src="/students.png"
            alt="Students"
            className="w-[85%] max-w-[500px] object-contain block align-bottom"
          />
        </div>
      </div>

      {/* SISI KANAN (FORM) */}
      <div className="flex items-center justify-center px-8 py-16 lg:px-20">
        <div className="w-full max-w-lg">
          
          <h2 className="text-3xl font-medium text-gray-800 mb-8">Daftar</h2>

          {/* GOOGLE SIGNUP */}
          <button
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full border border-gray-300 py-3 rounded-full flex items-center justify-center gap-3 hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
          >
            <img 
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
              className="w-5" 
              alt="Google" 
            />
            <span className="text-gray-700 font-medium">
              {loading ? 'Memproses...' : 'Daftar Dengan Google'}
            </span>
          </button>

          {/* Divider */}
          <div className="flex items-center my-8">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="px-4 text-gray-400 text-sm">Atau</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* FORM INPUTS */}
          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium text-gray-600">Email Unpad</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg mt-2 p-3.5 focus:border-blue-500 outline-none transition" 
              />
            </div>

            <div>
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-600">Kata Sandi</label>
                <button className="text-gray-400 text-sm flex items-center gap-1">
                  <span className="material-icons-outlined text-xs">visibility_off</span> Hide
                </button>
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg mt-2 p-3.5 focus:border-blue-500 outline-none transition" 
              />
            </div>
          </div>

          {/* TERMS */}
          <div className="mt-5 flex items-start gap-3">
            <input 
              type="checkbox" 
              className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
              id="terms"
            />
            <label htmlFor="terms" className="text-[13px] text-gray-700 leading-tight">
              Setuju dengan <span className="underline cursor-pointer">Ketentuan Penggunaan</span> dan <span className="underline cursor-pointer">Kebijakan Privasi</span> kami
            </label>
          </div>

          {/* SIGN UP BUTTON */}
          <button
            onClick={handleSignup}
            disabled={loading}
            className="w-full bg-[#71a1cc] text-white font-semibold py-4 rounded-2xl mt-8 hover:bg-[#6390b8] transition shadow-md disabled:opacity-50"
          >
            {loading ? 'Memproses...' : 'Sign up'}
          </button>

          {/* LOGIN LINK */}
          <p className="mt-6 text-sm text-center text-gray-600">
            Sudah punya akun?{" "}
            <a href="/login" className="text-blue-600 font-semibold hover:underline">
              Masuk
            </a>
          </p>

        </div>
      </div>
    </div>
  )
}
