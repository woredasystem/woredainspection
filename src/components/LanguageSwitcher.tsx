"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import { HiLanguage } from "react-icons/hi2";

const languages = [
    { code: "am", name: "Amharic", nativeName: "አማርኛ" },
    { code: "om", name: "Oromifa", nativeName: "Afaan Oromoo" },
    { code: "en", name: "English", nativeName: "English" },
];

export function LanguageSwitcher() {
    const [isPending, startTransition] = useTransition();
    const [currentLocale, setCurrentLocale] = useState("am");
    const [mounted, setMounted] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Only run on client side after mount
        const locale = document.cookie
            .split('; ')
            .find(row => row.startsWith('NEXT_LOCALE='))
            ?.split('=')[1] || 'am';
        setCurrentLocale(locale);
        setMounted(true);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const changeLanguage = (locale: string) => {
        setIsOpen(false);
        startTransition(() => {
            // Set cookie for locale
            document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`;
            // Reload to apply new locale
            window.location.reload();
        });
    };

    // Render a placeholder during SSR to avoid hydration mismatch
    if (!mounted) {
        return (
            <div className="relative group">
                <button
                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                    disabled
                >
                    <HiLanguage className="h-4 w-4" />
                    <span className="hidden sm:inline">አማርኛ</span>
                </button>
            </div>
        );
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                disabled={isPending}
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                <HiLanguage className="h-4 w-4" />
                <span className="hidden sm:inline">
                    {languages.find(l => l.code === currentLocale)?.nativeName || "አማርኛ"}
                </span>
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-slate-200 bg-white shadow-xl z-50">
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => changeLanguage(lang.code)}
                            className={`w-full px-4 py-3 text-left text-sm transition first:rounded-t-2xl last:rounded-b-2xl hover:bg-slate-50 focus:bg-slate-50 focus:outline-none ${currentLocale === lang.code ? "bg-blue-50 font-semibold text-blue-600" : "text-slate-700"
                                }`}
                            disabled={isPending}
                        >
                            <div className="font-medium">{lang.nativeName}</div>
                            <div className="text-xs text-slate-500">{lang.name}</div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
