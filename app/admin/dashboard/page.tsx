import { Metadata } from "next";
import { listRecentQrRequests, approveAccessRequest } from "@/lib/access";
import { getDocumentsForCurrentWoreda } from "@/lib/uploads";
import { DashboardClient } from "@/components/admin/DashboardClient";

export const metadata: Metadata = {
  title: "Admin : Dashboard",
  description: "Monitor QR requests, approve access, and upload documents.",
};

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const recentRequests = await listRecentQrRequests(50);
  const documents = await getDocumentsForCurrentWoreda();

  // Filter: Hide approved requests older than 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const filteredRequests = recentRequests.filter((req) => {
    if (req.status === "pending") return true;
    return new Date(req.created_at) > oneDayAgo;
  }).slice(0, 10);

  // Calculate stats
  const pendingCount = recentRequests.filter(r => r.status === "pending").length;
  const approvedCount = recentRequests.filter(r => r.status === "approved").length;
  const deniedCount = recentRequests.filter(r => r.status === "denied").length;
  const totalDocuments = documents.length;
  const totalRequests = recentRequests.length;

  return (
    <DashboardClient
      pendingCount={pendingCount}
      approvedCount={approvedCount}
      deniedCount={deniedCount}
      totalDocuments={totalDocuments}
      totalRequests={totalRequests}
      filteredRequests={filteredRequests}
    />
  );
}

