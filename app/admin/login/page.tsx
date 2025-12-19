"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { HiLockClosed, HiEnvelope, HiArrowRight } from "react-icons/hi2";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import Image from "next/image";
import { publicEnv } from "@/lib/env";
import { useTranslations } from 'next-intl';

export default function AdminLoginPage() {
  const t = useTranslations('admin');
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const { error } = await supabaseBrowser.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/admin/dashboard");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4">
      {/* Form: on mobile sits directly on background; card style only on large screens */}
      <div className="w-full max-w-md flex items-center justify-center lg:bg-white/80 lg:backdrop-blur-md lg:p-8 lg:rounded-2xl lg:shadow-2xl lg:border lg:border-white/40">
        <div className="w-full space-y-8">
          <div className="text-center lg:text-left">
            <div className="mx-auto lg:mx-0 mb-6 h-16 w-16 relative rounded-xl overflow-hidden">
              <Image
                src="/logo.jpg"
                alt="Logo"
                fill
                className="object-cover"
              />
            </div>
            <h2 className="text-3xl font-bold text-slate-900">{t('welcomeBack')}</h2>
            <p className="mt-2 text-slate-600">{t('signInPrompt')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('emailAddress')}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <HiEnvelope className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-slate-900 placeholder-slate-400 focus:border-[#4169E1] focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                    placeholder="admin@woreda.gov.et"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('password')}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <HiLockClosed className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-slate-900 placeholder-slate-400 focus:border-[#4169E1] focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-red-600" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-[#4169E1] hover:bg-[#3557c7] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('verifying')}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {t('signIn')}
                  <HiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              )}
            </button>
          </form>

          <div className="pt-6 text-center">
            <p className="text-xs text-slate-400">
              {t('protectedMessage')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
