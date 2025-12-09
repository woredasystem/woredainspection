"use client";

import { HiDocumentArrowUp, HiDocumentText, HiQrCode, HiChartBar } from "react-icons/hi2";
import { useTranslations } from 'next-intl';
import { motion } from "framer-motion";

interface AdminPageHeaderProps {
  icon: "upload" | "documents" | "qr" | "requests" | "dashboard";
  titleKey: string;
  descriptionKey: string;
  gradient: string;
}

const iconMap = {
  upload: HiDocumentArrowUp,
  documents: HiDocumentText,
  qr: HiQrCode,
  requests: HiQrCode,
  dashboard: HiChartBar,
};

export function AdminPageHeader({ icon, titleKey, descriptionKey, gradient }: AdminPageHeaderProps) {
  const t = useTranslations('admin');
  const Icon = iconMap[icon];

  return (
    <section className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-8 md:p-12 text-white shadow-2xl`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex items-center gap-6"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30">
          <Icon className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3 leading-tight">
            {t(titleKey)}
          </h1>
          <p className="text-lg text-white/90 leading-relaxed max-w-2xl">
            {t(descriptionKey)}
          </p>
        </div>
      </motion.div>
    </section>
  );
}

