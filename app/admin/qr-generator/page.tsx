"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { HiQrCode, HiArrowDownTray, HiCheckCircle, HiArrowPath } from "react-icons/hi2";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useTranslations } from 'next-intl';
import { motion } from "framer-motion";

export default function QrGeneratorPage() {
  const t = useTranslations('admin');
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [qrCode, setQrCode] = useState<string>("");
  const [requestUrl, setRequestUrl] = useState<string>("");

  const generateQR = () => {
    // Generate a unique QR code
    const code = `WRD-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    setQrCode(code);
    
    // Create the request URL
    const url = typeof window !== "undefined" 
      ? `${window.location.origin}/request-access?code=${code}`
      : "";
    setRequestUrl(url);
    
    if (url) {
      // Generate QR code
      QRCode.toDataURL(url, {
        width: 600,
        margin: 2,
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
      })
        .then((dataUrl) => {
          setQrDataUrl(dataUrl);
        })
        .catch((err) => {
          console.error("Error generating QR code:", err);
        });
    }
  };

  useEffect(() => {
    generateQR();
  }, []);

  const handleDownload = () => {
    if (qrDataUrl) {
      const link = document.createElement("a");
      link.download = `woreda-qr-${qrCode}.png`;
      link.href = qrDataUrl;
      link.click();
    }
  };

  return (
    <div className="space-y-8 pb-20 md:pb-0">
      <AdminPageHeader
        icon="qr"
        titleKey="generateQR"
        descriptionKey="generateQRDescription"
        gradient="from-emerald-600 via-teal-600 to-cyan-600"
      />

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-slate-200 bg-white p-8 md:p-12 shadow-xl"
      >
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50">
              <HiCheckCircle className="h-7 w-7 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {t('generateNewQR')}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {t('generateQRSubtitle')}
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={generateQR}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700"
          >
            <HiArrowPath className="h-5 w-5" />
            {t('generateNew')}
          </motion.button>
        </div>

        {qrDataUrl ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-8"
          >
            <div className="rounded-3xl border-4 border-slate-200 bg-gradient-to-br from-white to-slate-50 p-8 shadow-2xl">
              <img
                src={qrDataUrl}
                alt="QR Code for document access request"
                className="h-auto w-full max-w-md"
              />
            </div>
            <div className="flex flex-col items-center gap-3 w-full max-w-md">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                {t('requestCode')}
              </p>
              <p className="font-mono text-xl font-bold text-slate-900 bg-slate-100 px-4 py-2 rounded-xl">
                {qrCode}
              </p>
              <p className="mt-2 max-w-md break-all text-center text-xs text-slate-500 bg-slate-50 px-4 py-2 rounded-lg">
                {requestUrl}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDownload}
              className="inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-4 text-sm font-bold text-white shadow-lg transition hover:from-emerald-700 hover:to-teal-700 hover:shadow-xl"
            >
              <HiArrowDownTray className="h-5 w-5" />
              {t('downloadQRCode')}
            </motion.button>
          </motion.div>
        ) : (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600"></div>
              <p className="text-sm font-medium text-slate-600">{t('generatingQR')}</p>
            </div>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 px-6 py-4"
        >
          <p className="text-sm font-medium text-emerald-800">
            {t('qrCodeInstructions')}
          </p>
        </motion.div>
      </motion.section>
    </div>
  );
}

