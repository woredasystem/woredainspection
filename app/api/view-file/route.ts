import { NextResponse } from "next/server";
import { validateTemporaryAccess } from "@/lib/access";
import { getDocumentsForWoreda } from "@/lib/uploads";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get("url");
    const token = searchParams.get("token");

    if (!fileUrl || !token) {
      return NextResponse.json(
        { error: "File URL and token are required." },
        { status: 400 }
      );
    }

    // Validate the temporary access token
    const accessRecord = await validateTemporaryAccess(token);
    if (!accessRecord) {
      return NextResponse.json(
        { error: "Invalid or expired access token." },
        { status: 401 }
      );
    }

    // Verify the file belongs to the user's woreda
    const documents = await getDocumentsForWoreda(accessRecord.woreda_id);
    const document = documents.find((doc) => doc.r2_url === fileUrl);

    if (!document) {
      return NextResponse.json(
        { error: "File not found or access denied." },
        { status: 404 }
      );
    }

    // Fetch the file from R2
    try {
      // 1. Determine the base URL to use
      let initialUrl = fileUrl;

      // Handle conversion from upload URL to public URL if needed
      if (fileUrl.includes('.r2.cloudflarestorage.com')) {
        let publicUrlBase = process.env.CLOUDFLARE_R2_PUBLIC_URL;

        if (!publicUrlBase || publicUrlBase.includes('.r2.cloudflarestorage.com')) {
          publicUrlBase = "https://pub-fcc35482a42b44e989b242c288d0d9e1.r2.dev";
        }

        try {
          const urlObj = new URL(fileUrl);
          const path = urlObj.pathname;
          const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "woreda-documents";

          // Simple construction logic
          const base = publicUrlBase.endsWith('/') ? publicUrlBase.slice(0, -1) : publicUrlBase;
          // If path includes bucket name and public URL is bucket-specific, we might need to strip it
          // But for safety, let's assume the path from upload URL is what we want, 
          // and we rely on the "smart" candidate generation below to fix path issues.
          initialUrl = `${base}${path}`;
        } catch (e) {
          console.error("Error converting upload URL:", e);
        }
      }

      // 2. Generate Candidates (Smart URL Strategy)
      // We try the URL as-is, and a "fixed" version to handle double-encoding/path issues.
      const candidates: string[] = [];

      // Candidate A: The URL as-is (with minimal space encoding)
      let candidateA = initialUrl;
      if (candidateA.includes(' ')) candidateA = candidateA.replace(/ /g, '%20');
      candidates.push(candidateA);

      // Candidate B: Aggressively fixed URL
      try {
        const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "woreda-documents";
        const urlObj = new URL(candidateA);
        let path = urlObj.pathname;
        if (path.startsWith('/')) path = path.substring(1);

        // Remove bucket name if present (common issue with public URLs)
        if (path.startsWith(bucketName + '/')) {
          path = path.substring(bucketName.length + 1);
        }

        // Aggressive Decode
        let rawPath = path;
        let decodeAttempts = 0;
        while (decodeAttempts < 3 && (rawPath.includes('%') || rawPath.includes('+'))) {
          try {
            const decoded = decodeURIComponent(rawPath);
            if (decoded === rawPath) break;
            rawPath = decoded;
          } catch (e) { break; }
          decodeAttempts++;
        }

        // Clean Re-encode
        const parts = rawPath.split('/');
        const encodedPath = parts.map(p => encodeURIComponent(p)).join('/');

        const candidateB = `${urlObj.origin}/${encodedPath}`;

        if (candidateB !== candidateA) {
          candidates.push(candidateB);
        }
      } catch (e) {
        console.error("Error generating candidate B:", e);
      }

      console.log("Fetching file candidates:", candidates);

      // 3. Try fetching candidates
      let fileResponse: Response | null = null;
      let usedUrl = "";

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      try {
        for (const url of candidates) {
          try {
            const res = await fetch(url, {
              method: "GET",
              headers: { "User-Agent": "Mozilla/5.0" },
              signal: controller.signal,
            });

            if (res.ok) {
              fileResponse = res;
              usedUrl = url;
              break;
            } else {
              console.warn(`Failed to fetch candidate: ${url} (${res.status})`);
            }
          } catch (err: any) {
            if (err.name === 'AbortError') throw err;
            console.warn(`Error fetching candidate: ${url}`, err);
          }
        }
      } finally {
        clearTimeout(timeoutId);
      }

      if (!fileResponse || !fileResponse.ok) {
        return NextResponse.json(
          { error: "Failed to fetch file from storage. The file may not be accessible." },
          { status: 404 }
        );
      }

      console.log(`Successfully fetched file using: ${usedUrl}`);

      // 4. Return the file
      const fileBuffer = await fileResponse.arrayBuffer();
      const contentType = fileResponse.headers.get("content-type") || "application/octet-stream";

      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `inline; filename="${encodeURIComponent(document.file_name)}"`,
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET",
          "Cache-Control": "public, max-age=3600",
          "X-Content-Type-Options": "nosniff",
        },
      });

    } catch (fetchError: any) {
      if (fetchError.name === "AbortError") {
        return NextResponse.json(
          { error: "Request timeout." },
          { status: 504 }
        );
      }
      console.error("Error in file fetch process:", fetchError);
      return NextResponse.json(
        { error: "Failed to process file request." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in view-file route:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
