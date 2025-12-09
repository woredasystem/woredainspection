import { Metadata } from "next";
import { getDocumentsForCurrentWoreda } from "@/lib/uploads";
import { AdminDocumentsClient } from "@/components/admin/AdminDocumentsClient";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export const metadata: Metadata = {
  title: "Admin : View Documents",
  description: "Browse and manage all uploaded documents.",
};

export const dynamic = "force-dynamic";

export default async function AdminDocumentsPage() {
  const documents = await getDocumentsForCurrentWoreda();

  return (
    <div className="space-y-8 pb-20 md:pb-0">
      <AdminPageHeader
        icon="documents"
        titleKey="viewDocuments"
        descriptionKey="viewDocumentsDescription"
        gradient="from-blue-600 via-cyan-600 to-teal-600"
      />
      <AdminDocumentsClient documents={documents} />
    </div>
  );
}
