import { type NextRequest, NextResponse } from "next/server";

// Convert Google Drive URL to direct download URL
function getDirectDownloadUrl(url: string): string {
	// Handle Google Drive file links: https://drive.google.com/file/d/FILE_ID/view
	const driveMatch = url.match(/\/file\/d\/([^/]+)/);
	if (driveMatch) {
		const fileId = driveMatch[1];
		return `https://drive.google.com/uc?export=download&id=${fileId}`;
	}

	// Handle Google Drive open links: https://drive.google.com/open?id=FILE_ID
	const openMatch = url.match(/[?&]id=([^&]+)/);
	if (openMatch) {
		const fileId = openMatch[1];
		return `https://drive.google.com/uc?export=download&id=${fileId}`;
	}

	// Return original URL if not a Google Drive link
	return url;
}

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const url = searchParams.get("url");

	if (!url) {
		return NextResponse.json(
			{ error: "URL parameter is required" },
			{ status: 400 },
		);
	}

	try {
		const directUrl = getDirectDownloadUrl(url);

		// Fetch the PDF from Google Drive
		const response = await fetch(directUrl, {
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
			},
			redirect: "follow",
		});

		if (!response.ok) {
			return NextResponse.json(
				{ error: `Failed to fetch PDF: ${response.status}` },
				{ status: response.status },
			);
		}

		const contentType = response.headers.get("content-type");

		// Check if we got HTML instead of PDF (Google Drive might show a confirmation page for large files)
		if (contentType?.includes("text/html")) {
			// Try to extract the confirm token and retry
			const html = await response.text();
			const confirmMatch = html.match(/confirm=([^&"]+)/);

			if (confirmMatch) {
				const confirmToken = confirmMatch[1];
				const confirmedUrl = `${directUrl}&confirm=${confirmToken}`;

				const confirmedResponse = await fetch(confirmedUrl, {
					headers: {
						"User-Agent":
							"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
					},
					redirect: "follow",
				});

				if (!confirmedResponse.ok) {
					return NextResponse.json(
						{ error: "Failed to fetch PDF after confirmation" },
						{ status: confirmedResponse.status },
					);
				}

				const pdfBuffer = await confirmedResponse.arrayBuffer();
				return new NextResponse(pdfBuffer, {
					headers: {
						"Content-Type": "application/pdf",
						"Cache-Control": "public, max-age=3600",
					},
				});
			}

			return NextResponse.json(
				{
					error:
						"Unable to download PDF - file may require authentication or be too large",
				},
				{ status: 403 },
			);
		}

		const pdfBuffer = await response.arrayBuffer();

		return new NextResponse(pdfBuffer, {
			headers: {
				"Content-Type": "application/pdf",
				"Cache-Control": "public, max-age=3600",
			},
		});
	} catch (error) {
		console.error("PDF proxy error:", error);
		return NextResponse.json({ error: "Failed to fetch PDF" }, { status: 500 });
	}
}
