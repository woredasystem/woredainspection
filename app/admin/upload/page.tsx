import { Metadata } from "next";
import { UploadForm } from "@/components/admin/UploadForm";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export const metadata: Metadata = {
  title: "Admin : Upload Documents",
  description: "Upload multiple documents to the system.",
};

export default function AdminUploadPage() {
  return (
    <div className="space-y-8 pb-20 md:pb-0">
      <AdminPageHeader
        icon="upload"
        titleKey="uploadDocument"
        descriptionKey="uploadDocumentDescription"
        gradient="from-indigo-600 via-purple-600 to-pink-600"
      />

      <section className="rounded-3xl border border-slate-200 bg-white p-8 md:p-12 shadow-xl">
        <UploadForm />
      </section>
    </div>
  );
}
