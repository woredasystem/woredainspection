import { Metadata } from "next";
import { listRecentQrRequests } from "@/lib/access";
import { AdminRequestsClient } from "@/components/admin/AdminRequestsClient";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export const metadata: Metadata = {
  title: "Admin : QR Requests",
  description: "Manage QR access requests.",
};

export const dynamic = "force-dynamic";

export default async function AdminRequestsPage() {
  const recentRequests = await listRecentQrRequests(100);

  return (
    <div className="space-y-8 pb-20 md:pb-0">
      <AdminPageHeader
        icon="requests"
        titleKey="qrRequests"
        descriptionKey="qrRequestsDescription"
        gradient="from-emerald-600 via-teal-600 to-cyan-600"
      />
      <AdminRequestsClient requests={recentRequests} />
    </div>
  );
}
