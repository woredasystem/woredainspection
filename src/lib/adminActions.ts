"use server";

import { approveAccessRequest } from "@/lib/access";

export async function approveRequestAction(formData: FormData) {
  const requestId = formData.get("requestId")?.toString();
  if (!requestId) {
    throw new Error("Request ID is required.");
  }

  await approveAccessRequest(requestId);
}

