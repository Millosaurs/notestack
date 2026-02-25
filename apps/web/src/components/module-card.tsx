"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PdfViewer } from "@/components/pdf-viewer";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { client, orpc } from "@/utils/orpc";

interface Module {
	id: string;
	moduleNumber: number;
	name: string;
	description: string | null;
	subjectId: string;
	createdAt: Date;
	updatedAt: Date;
	createdBy: string;
}

interface Note {
	id: string;
	name: string;
	pdfUrl: string;
	moduleId: string;
	downloadCount: number;
	createdAt: Date;
	updatedAt: Date;
	createdBy: string;
}

interface ModuleCardProps {
	module: Module;
}

export function ModuleCard({ module }: ModuleCardProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [selectedNote, setSelectedNote] = useState<Note | null>(null);
	const [showPdfViewer, setShowPdfViewer] = useState(false);
	const queryClient = useQueryClient();

	const { data: notes, isLoading } = useQuery({
		...orpc.getNotes.queryOptions({ input: { moduleId: module.id } }),
		enabled: isOpen,
	});

	const trackDownload = useMutation({
		mutationFn: (noteId: string) => client.trackDownload({ noteId }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["getNotes"] });
		},
	});

	const handleDownload = (note: Note) => {
		// Track the download
		trackDownload.mutate(note.id);

		// Convert Google Drive view link to direct download link
		const downloadUrl = convertToDownloadUrl(note.pdfUrl);

		// Open in new tab to trigger download
		window.open(downloadUrl, "_blank");
	};

	const handlePreview = (note: Note) => {
		setSelectedNote(note);
		setShowPdfViewer(true);
	};

	return (
		<>
			<button
				type="button"
				onClick={() => setIsOpen(true)}
				className="w-full cursor-pointer rounded-lg border p-4 text-left transition-colors hover:border-primary hover:bg-accent/50"
			>
				<div className="flex items-center gap-3">
					<span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 font-semibold text-primary">
						{module.moduleNumber}
					</span>
					<div>
						<h3 className="font-medium">{module.name}</h3>
						{module.description && (
							<p className="line-clamp-1 text-muted-foreground text-sm">
								{module.description}
							</p>
						)}
					</div>
				</div>
			</button>

			{/* Notes Dialog */}
			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>
							Module {module.moduleNumber}: {module.name}
						</DialogTitle>
						<DialogDescription>
							{module.description || "Select a note to view or download"}
						</DialogDescription>
					</DialogHeader>

					<div className="mt-4 space-y-3">
						{isLoading ? (
							<div className="space-y-2">
								{[1, 2].map((i) => (
									<div
										key={i}
										className="h-16 animate-pulse rounded-lg bg-muted"
									/>
								))}
							</div>
						) : notes && notes.length > 0 ? (
							notes.map((note) => (
								<div
									key={note.id}
									className="flex items-center justify-between rounded-lg border p-3"
								>
									<div className="min-w-0 flex-1">
										<p className="truncate font-medium">{note.name}</p>
										<p className="text-muted-foreground text-xs">
											{note.downloadCount} downloads
										</p>
									</div>
									<div className="ml-3 flex gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => handlePreview(note)}
										>
											Preview
										</Button>
										<Button size="sm" onClick={() => handleDownload(note)}>
											Download
										</Button>
									</div>
								</div>
							))
						) : (
							<p className="py-4 text-center text-muted-foreground">
								No notes available for this module.
							</p>
						)}
					</div>
				</DialogContent>
			</Dialog>

			{/* PDF Viewer Dialog */}
			{selectedNote && (
				<PdfViewer
					open={showPdfViewer}
					onOpenChange={setShowPdfViewer}
					pdfUrl={selectedNote.pdfUrl}
					title={selectedNote.name}
				/>
			)}
		</>
	);
}

// Helper function to convert Google Drive URLs to embeddable/downloadable format
function convertToDownloadUrl(url: string): string {
	// Handle Google Drive links
	// Format: https://drive.google.com/file/d/FILE_ID/view
	const driveMatch = url.match(/\/file\/d\/([^/]+)/);
	if (driveMatch) {
		const fileId = driveMatch[1];
		return `https://drive.google.com/uc?export=download&id=${fileId}`;
	}

	// Handle Google Drive open links
	// Format: https://drive.google.com/open?id=FILE_ID
	const openMatch = url.match(/[?&]id=([^&]+)/);
	if (openMatch) {
		const fileId = openMatch[1];
		return `https://drive.google.com/uc?export=download&id=${fileId}`;
	}

	// Return original URL if not a Google Drive link
	return url;
}
