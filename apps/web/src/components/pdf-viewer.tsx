"use client";
import { useCallback, useMemo, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

// Configure PDF.js worker using CDN (more reliable with Next.js/Turbopack)
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	pdfUrl: string;
	title: string;
}

export function PdfViewer({
	open,
	onOpenChange,
	pdfUrl,
	title,
}: PdfViewerProps) {
	const [numPages, setNumPages] = useState<number>(0);
	const [scale, setScale] = useState(1);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Convert Google Drive URL to proxy URL
	const proxyUrl = `/api/pdf-proxy?url=${encodeURIComponent(pdfUrl)}`;

	// Generate array of page numbers for rendering all pages
	const pageNumbers = useMemo(() => {
		return Array.from({ length: numPages }, (_, i) => i + 1);
	}, [numPages]);

	const onDocumentLoadSuccess = useCallback(
		({ numPages }: { numPages: number }) => {
			setNumPages(numPages);
			setIsLoading(false);
			setError(null);
		},
		[],
	);

	const onDocumentLoadError = useCallback((err: Error) => {
		console.error("PDF load error:", err);
		setError(
			"Failed to load PDF. The file may be unavailable or require authentication.",
		);
		setIsLoading(false);
	}, []);

	const handleZoomIn = useCallback(() => {
		setScale((prev) => Math.min(prev + 0.25, 3));
	}, []);

	const handleZoomOut = useCallback(() => {
		setScale((prev) => Math.max(prev - 0.25, 0.5));
	}, []);

	const handleResetZoom = useCallback(() => {
		setScale(1);
	}, []);

	const handleDownload = useCallback(() => {
		const downloadUrl = convertToDownloadUrl(pdfUrl);
		// Use anchor element with download attribute to force download on mobile
		const link = document.createElement("a");
		link.href = downloadUrl;
		link.download = `${title}.pdf`;
		link.target = "_blank";
		link.rel = "noopener noreferrer";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}, [pdfUrl, title]);

	// Reset state when dialog opens
	const handleOpenChange = useCallback(
		(newOpen: boolean) => {
			if (newOpen) {
				setScale(1);
				setIsLoading(true);
				setError(null);
			}
			onOpenChange(newOpen);
		},
		[onOpenChange],
	);

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="flex h-[90vh] max-w-5xl flex-col p-0">
				<DialogHeader className="flex-shrink-0 border-b px-6 py-4">
					<div className="flex items-center justify-between">
						<DialogTitle className="truncate pr-4">{title}</DialogTitle>
					</div>
				</DialogHeader>

				{/* Toolbar */}
				<div className="flex flex-shrink-0 items-center justify-between border-b bg-muted/30 px-4 py-2">
					<div className="flex items-center gap-2">
						{/* Page Info */}
						<span className="px-2 text-muted-foreground text-sm">
							{isLoading
								? "Loading..."
								: `${numPages} page${numPages !== 1 ? "s" : ""}`}
						</span>

						<div className="mx-2 h-6 w-px bg-border" />

						{/* Zoom Controls */}
						<div className="flex items-center gap-1">
							<Button
								variant="outline"
								size="icon-sm"
								onClick={handleZoomOut}
								disabled={scale <= 0.5 || isLoading}
							>
								<MinusIcon />
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={handleResetZoom}
								className="min-w-[60px] tabular-nums"
								disabled={isLoading}
							>
								{Math.round(scale * 100)}%
							</Button>
							<Button
								variant="outline"
								size="icon-sm"
								onClick={handleZoomIn}
								disabled={scale >= 3 || isLoading}
							>
								<PlusIcon />
							</Button>
						</div>
					</div>

					<Button variant="outline" size="sm" onClick={handleDownload}>
						<DownloadIcon />
						Download
					</Button>
				</div>

				{/* PDF Content - Scrollable vertical layout */}
				<div className="flex-1 overflow-auto bg-muted/50">
					<div className="flex flex-col items-center gap-4 p-4">
						{error ? (
							<div className="flex flex-col items-center justify-center gap-4 py-20">
								<div className="text-destructive">
									<ErrorIcon />
								</div>
								<p className="text-center text-muted-foreground">{error}</p>
								<Button
									variant="outline"
									onClick={() => handleOpenChange(true)}
								>
									Retry
								</Button>
							</div>
						) : (
							<Document
								file={proxyUrl}
								onLoadSuccess={onDocumentLoadSuccess}
								onLoadError={onDocumentLoadError}
								loading={
									<div className="flex items-center justify-center py-20">
										<LoadingSpinner />
									</div>
								}
								className="flex flex-col items-center gap-4"
							>
								{pageNumbers.map((pageNumber) => (
									<div key={pageNumber} className="relative">
										{/* Page number indicator */}
										<div className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-background/80 px-2 py-0.5 text-muted-foreground text-xs backdrop-blur-sm">
											Page {pageNumber}
										</div>
										<Page
											pageNumber={pageNumber}
											scale={scale}
											className="shadow-lg"
											renderTextLayer={true}
											renderAnnotationLayer={true}
											loading={
												<div className="flex h-[600px] w-[500px] items-center justify-center bg-white shadow-lg">
													<LoadingSpinner />
												</div>
											}
										/>
									</div>
								))}
							</Document>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

// Helper function to convert Google Drive URLs to download format
function convertToDownloadUrl(url: string): string {
	const driveMatch = url.match(/\/file\/d\/([^/]+)/);
	if (driveMatch) {
		const fileId = driveMatch[1];
		return `https://drive.google.com/uc?export=download&id=${fileId}`;
	}

	const openMatch = url.match(/[?&]id=([^&]+)/);
	if (openMatch) {
		const fileId = openMatch[1];
		return `https://drive.google.com/uc?export=download&id=${fileId}`;
	}

	return url;
}

// Icons
function MinusIcon() {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M5 12h14" />
		</svg>
	);
}

function PlusIcon() {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M5 12h14" />
			<path d="M12 5v14" />
		</svg>
	);
}

function DownloadIcon() {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
			<polyline points="7 10 12 15 17 10" />
			<line x1="12" x2="12" y1="15" y2="3" />
		</svg>
	);
}

function ErrorIcon() {
	return (
		<svg
			width="48"
			height="48"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<circle cx="12" cy="12" r="10" />
			<line x1="12" x2="12" y1="8" y2="12" />
			<line x1="12" x2="12.01" y1="16" y2="16" />
		</svg>
	);
}

function LoadingSpinner() {
	return (
		<div className="flex flex-col items-center gap-2">
			<svg
				className="h-8 w-8 animate-spin text-primary"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				aria-hidden="true"
			>
				<circle
					className="opacity-25"
					cx="12"
					cy="12"
					r="10"
					stroke="currentColor"
					strokeWidth="4"
				/>
				<path
					className="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
				/>
			</svg>
			<span className="text-muted-foreground text-sm">Loading PDF...</span>
		</div>
	);
}
