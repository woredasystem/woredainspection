import { NextResponse } from "next/server";
import { validateTemporaryAccess } from "@/lib/access";
import { getDocumentsForWoreda } from "@/lib/uploads";

/**
 * This endpoint validates access and returns the direct R2 public URL
 * for Office documents. Microsoft Office Online Viewer requires a publicly
 * accessible URL, so we can't use our authenticated proxy.
 */
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

    // Convert upload URL to public URL if needed
    let publicUrl = fileUrl;

    // If URL is using upload endpoint (.r2.cloudflarestorage.com), convert to public URL
    if (fileUrl.includes('.r2.cloudflarestorage.com')) {
      const publicUrlBase = process.env.CLOUDFLARE_R2_PUBLIC_URL;

      // Check if public URL is correctly configured
      if (!publicUrlBase || publicUrlBase.includes('.r2.cloudflarestorage.com')) {
        console.error("❌ CLOUDFLARE_R2_PUBLIC_URL is not configured correctly.");
        return NextResponse.json({
          publicUrl: null,
          fileName: document.file_name,
          isAccessible: false,
          error: "Configuration Error",
          message: "The server is not configured with a valid Public R2 URL. Please set CLOUDFLARE_R2_PUBLIC_URL to your Public R2.dev domain (e.g., https://pub-xxxx.r2.dev) in .env.local."
        });
      }

      // Extract the path from the upload URL
      try {
        const urlObj = new URL(fileUrl);
        let path = urlObj.pathname;

        // Remove leading slash if present
        if (path.startsWith('/')) {
          path = path.substring(1);
        }

        const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "woreda-documents";

        // The path from the upload URL typically includes the bucket name (e.g. /bucket-name/path/to/file)
        // But the public URL (if it's a bucket-specific subdomain) maps to the bucket root, so we shouldn't include the bucket name in the path.

        // Remove bucket name from path if it starts with it
        // path currently has leading slash removed, so it looks like "bucket-name/path/to/file"
        if (path.startsWith(bucketName + '/')) {
          path = path.substring(bucketName.length + 1);
        }

        // Construct public URL
        // We assume CLOUDFLARE_R2_PUBLIC_URL points to the root of the bucket
        const base = publicUrlBase.endsWith('/') ? publicUrlBase.slice(0, -1) : publicUrlBase;
        publicUrl = `${base}/${path}`;
      } catch (urlError) {
        console.error("❌ Error parsing URL:", urlError);
        return NextResponse.json(
          { error: "Invalid file URL format." },
          { status: 400 }
        );
      }
    } else if (fileUrl.includes('.r2.dev') || fileUrl.includes('pub-')) {
      // Already a public URL. We need to determine the correct accessible URL.
      // Sometimes URLs are double encoded (e.g. %2520), sometimes they are not.
      // We will try two strategies:
      // 1. Use the URL mostly as-is (just ensuring spaces are encoded).
      // 2. Aggressively decode and re-encode (fixing double encoding).

      let candidate1 = publicUrl;
      let candidate2 = publicUrl;

      // Strategy 1: Minimal touch (Candidate 1)
      try {
        if (candidate1.includes(' ')) {
          candidate1 = candidate1.replace(/ /g, '%20');
        }
      } catch (e) { console.error("Error prep candidate 1", e); }

      // Strategy 2: Aggressive fix (Candidate 2)
      try {
        // Decode path to get raw characters
        const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "woreda-documents";
        const urlObj = new URL(publicUrl.replace(/ /g, '%20')); // ensure parseable
        let path = urlObj.pathname;
        if (path.startsWith('/')) path = path.substring(1);
        if (path.startsWith(bucketName + '/')) path = path.substring(bucketName.length + 1);

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

        // Re-encode properly
        const parts = rawPath.split('/');
        const encodedPath = parts.map(p =>
          encodeURIComponent(p)
            .replace(/\(/g, '%28')
            .replace(/\)/g, '%29')
        ).join('/');

        candidate2 = `${urlObj.origin}/${encodedPath}`;
      } catch (e) {
        console.error("Error prep candidate 2", e);
        candidate2 = candidate1; // Fallback
      }

      // Check which one works
      console.log("Checking URLs:", { candidate1, candidate2 });

      // Helper to check accessibility
      const checkUrl = async (url: string) => {
        try {
          const res = await fetch(url, {
            method: "HEAD",
            headers: { "User-Agent": "Mozilla/5.0" },
            signal: AbortSignal.timeout(3000)
          });
          return res.ok;
        } catch (e) { return false; }
      };

      // If they are the same, just check one
      if (candidate1 === candidate2) {
        publicUrl = candidate1;
      } else {
        // Check Candidate 1 (As-is/Minimal)
        const isC1Ok = await checkUrl(candidate1);
        if (isC1Ok) {
          console.log("Candidate 1 is valid, using it.");
          publicUrl = candidate1;
        } else {
          // Check Candidate 2 (Fixed)
          const isC2Ok = await checkUrl(candidate2);
          if (isC2Ok) {
            console.log("Candidate 2 is valid, using it.");
            publicUrl = candidate2;
          } else {
            console.warn("Both candidates failed HEAD check. Defaulting to Candidate 2 (standard encoding).");
            publicUrl = candidate2;
          }
        }
      }
    } else {
      console.warn("⚠️  Unknown URL format, using as-is:", publicUrl);
      if (publicUrl.includes(' ')) {
        publicUrl = publicUrl.replace(/ /g, '%20');
      }
    }

    // Final accessibility check (to set the flag for the client)
    let isAccessible = false;
    let accessibilityError: string | null = null;

    try {
      const testResponse = await fetch(publicUrl, {
        method: "HEAD",
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(5000),
      });

      if (!testResponse.ok) {
        console.warn("⚠️ Public URL HEAD check failed, but returning as accessible to let client try.");
        console.warn("   URL:", publicUrl);
        console.warn("   Status:", testResponse.status, testResponse.statusText);
        isAccessible = true; // Force true to allow client to try
      } else {
        isAccessible = true;
      }
    } catch (testError: any) {
      console.warn("⚠️ Public URL check error (network/timeout), returning as accessible to let client try.");
      console.warn("   Error:", testError.message);
      isAccessible = true; // Force true to allow client to try
    }

    // Return the public URL with accessibility status
    return NextResponse.json({
      publicUrl: publicUrl,
      fileName: document.file_name,
      isAccessible: isAccessible,
      error: accessibilityError,
      message: !isAccessible
        ? "The file is not publicly accessible. Please ensure 'Public R2.dev Subdomain' is enabled in Cloudflare R2 settings and CLOUDFLARE_R2_PUBLIC_URL is set correctly."
        : null
    });

  } catch (error) {
    console.error("Error in get-public-file-url route:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
