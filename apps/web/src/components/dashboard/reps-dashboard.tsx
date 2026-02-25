"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	BookOpen,
	ChevronDown,
	FileText,
	Pencil,
	Plus,
	Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { client, orpc } from "@/utils/orpc";

type Subject = {
	id: string;
	code: string;
	name: string;
	description: string | null;
};

type Module = {
	id: string;
	subjectId: string;
	moduleNumber: number;
	name: string;
	description: string | null;
	createdAt: Date;
	updatedAt: Date;
	createdBy: string;
	notes: Note[];
};

type Note = {
	id: string;
	moduleId: string;
	name: string;
	pdfUrl: string;
	downloadCount: number;
	createdAt: Date;
	updatedAt: Date;
	createdBy: string;
};

export function RepsDashboard() {
	const { data: subjects, isLoading } = useQuery(
		orpc.getSubjects.queryOptions(),
	);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Spinner className="size-8" />
			</div>
		);
	}

	return (
		<div className="mt-6 space-y-6">
			<h2 className="font-semibold text-lg sm:text-xl">
				Manage Modules & Notes
			</h2>
			<p className="text-muted-foreground text-sm">
				Click on a subject to manage its modules and notes.
			</p>

			{subjects && subjects.length > 0 ? (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{subjects.map((subject) => (
						<SubjectCard key={subject.id} subject={subject as Subject} />
					))}
				</div>
			) : (
				<Card className="p-8 text-center text-muted-foreground">
					No subjects available. Please contact an admin to create subjects.
				</Card>
			)}
		</div>
	);
}

// Subject Card - opens modal on click
function SubjectCard({ subject }: { subject: Subject }) {
	const [open, setOpen] = useState(false);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger
				render={
					<Card className="cursor-pointer p-4 transition-colors hover:bg-muted/50" />
				}
			>
				<div className="flex items-start gap-3">
					<div className="rounded-lg bg-primary/10 p-2">
						<BookOpen className="size-5 text-primary" />
					</div>
					<div className="min-w-0 flex-1">
						<Badge variant="secondary" className="mb-1">
							{subject.code}
						</Badge>
						<h3 className="font-semibold">{subject.name}</h3>
						{subject.description && (
							<p className="mt-1 line-clamp-2 text-muted-foreground text-sm">
								{subject.description}
							</p>
						)}
					</div>
				</div>
			</DialogTrigger>
			<DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden p-0">
				<SubjectModulesModal subject={subject} />
			</DialogContent>
		</Dialog>
	);
}

// Modal content showing modules and notes for a subject
function SubjectModulesModal({ subject }: { subject: Subject }) {
	const queryClient = useQueryClient();

	// Fetch modules with notes for this subject
	const { data: modules, isLoading } = useQuery({
		...orpc.reps.getAllModulesWithNotes.queryOptions({
			input: { subjectId: subject.id },
		}),
	});

	// Helper to get query key
	const getModulesQueryKey = () =>
		orpc.reps.getAllModulesWithNotes.queryOptions({
			input: { subjectId: subject.id },
		}).queryKey;

	// Module mutations
	const createModuleMutation = useMutation({
		mutationFn: (data: {
			subjectId: string;
			moduleNumber: number;
			name: string;
			description?: string;
		}) => client.reps.createModule(data),
		onMutate: async (newModule) => {
			const queryKey = getModulesQueryKey();
			await queryClient.cancelQueries({ queryKey });

			const previousModules = queryClient.getQueryData<Module[]>(queryKey);

			queryClient.setQueryData<Module[]>(queryKey, (old) =>
				[
					...(old || []),
					{
						id: `temp-${Date.now()}`,
						subjectId: newModule.subjectId,
						moduleNumber: newModule.moduleNumber,
						name: newModule.name,
						description: newModule.description || null,
						createdAt: new Date(),
						updatedAt: new Date(),
						createdBy: "",
						notes: [],
					},
				].sort((a, b) => a.moduleNumber - b.moduleNumber),
			);

			return { previousModules, queryKey };
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: getModulesQueryKey() });
			toast.success("Module created successfully");
		},
		onError: (error, _newModule, context) => {
			if (context?.previousModules && context?.queryKey) {
				queryClient.setQueryData(context.queryKey, context.previousModules);
			}
			toast.error(`Failed to create module: ${error.message}`);
		},
	});

	const updateModuleMutation = useMutation({
		mutationFn: (data: {
			id: string;
			moduleNumber?: number;
			name?: string;
			description?: string;
		}) => client.reps.updateModule(data),
		onMutate: async (updatedModule) => {
			const queryKey = getModulesQueryKey();
			await queryClient.cancelQueries({ queryKey });

			const previousModules = queryClient.getQueryData<Module[]>(queryKey);

			queryClient.setQueryData<Module[]>(queryKey, (old) =>
				old
					?.map((module) =>
						module.id === updatedModule.id
							? {
									...module,
									moduleNumber:
										updatedModule.moduleNumber ?? module.moduleNumber,
									name: updatedModule.name ?? module.name,
									description: updatedModule.description ?? module.description,
									updatedAt: new Date(),
								}
							: module,
					)
					.sort((a, b) => a.moduleNumber - b.moduleNumber),
			);

			return { previousModules, queryKey };
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: getModulesQueryKey() });
			toast.success("Module updated successfully");
		},
		onError: (error, _updatedModule, context) => {
			if (context?.previousModules && context?.queryKey) {
				queryClient.setQueryData(context.queryKey, context.previousModules);
			}
			toast.error(`Failed to update module: ${error.message}`);
		},
	});

	const deleteModuleMutation = useMutation({
		mutationFn: (id: string) => client.reps.deleteModule({ id }),
		onMutate: async (deletedId) => {
			const queryKey = getModulesQueryKey();
			await queryClient.cancelQueries({ queryKey });

			const previousModules = queryClient.getQueryData<Module[]>(queryKey);

			queryClient.setQueryData<Module[]>(queryKey, (old) =>
				old?.filter((module) => module.id !== deletedId),
			);

			return { previousModules, queryKey };
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: getModulesQueryKey() });
			toast.success("Module deleted successfully");
		},
		onError: (error, _deletedId, context) => {
			if (context?.previousModules && context?.queryKey) {
				queryClient.setQueryData(context.queryKey, context.previousModules);
			}
			toast.error(`Failed to delete module: ${error.message}`);
		},
	});

	// Note mutations
	const createNoteMutation = useMutation({
		mutationFn: (data: { moduleId: string; name: string; pdfUrl: string }) =>
			client.reps.createNote(data),
		onMutate: async (newNote) => {
			const queryKey = getModulesQueryKey();
			await queryClient.cancelQueries({ queryKey });

			const previousModules = queryClient.getQueryData<Module[]>(queryKey);

			queryClient.setQueryData<Module[]>(queryKey, (old) =>
				old?.map((module) =>
					module.id === newNote.moduleId
						? {
								...module,
								notes: [
									...module.notes,
									{
										id: `temp-${Date.now()}`,
										moduleId: newNote.moduleId,
										name: newNote.name,
										pdfUrl: newNote.pdfUrl,
										downloadCount: 0,
										createdAt: new Date(),
										updatedAt: new Date(),
										createdBy: "",
									},
								],
							}
						: module,
				),
			);

			return { previousModules, queryKey };
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: getModulesQueryKey() });
			toast.success("Note created successfully");
		},
		onError: (error, _newNote, context) => {
			if (context?.previousModules && context?.queryKey) {
				queryClient.setQueryData(context.queryKey, context.previousModules);
			}
			toast.error(`Failed to create note: ${error.message}`);
		},
	});

	const updateNoteMutation = useMutation({
		mutationFn: (data: { id: string; name?: string; pdfUrl?: string }) =>
			client.reps.updateNote(data),
		onMutate: async (updatedNote) => {
			const queryKey = getModulesQueryKey();
			await queryClient.cancelQueries({ queryKey });

			const previousModules = queryClient.getQueryData<Module[]>(queryKey);

			queryClient.setQueryData<Module[]>(queryKey, (old) =>
				old?.map((module) => ({
					...module,
					notes: module.notes.map((note) =>
						note.id === updatedNote.id
							? {
									...note,
									name: updatedNote.name ?? note.name,
									pdfUrl: updatedNote.pdfUrl ?? note.pdfUrl,
									updatedAt: new Date(),
								}
							: note,
					),
				})),
			);

			return { previousModules, queryKey };
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: getModulesQueryKey() });
			toast.success("Note updated successfully");
		},
		onError: (error, _updatedNote, context) => {
			if (context?.previousModules && context?.queryKey) {
				queryClient.setQueryData(context.queryKey, context.previousModules);
			}
			toast.error(`Failed to update note: ${error.message}`);
		},
	});

	const deleteNoteMutation = useMutation({
		mutationFn: (id: string) => client.reps.deleteNote({ id }),
		onMutate: async (deletedId) => {
			const queryKey = getModulesQueryKey();
			await queryClient.cancelQueries({ queryKey });

			const previousModules = queryClient.getQueryData<Module[]>(queryKey);

			queryClient.setQueryData<Module[]>(queryKey, (old) =>
				old?.map((module) => ({
					...module,
					notes: module.notes.filter((note) => note.id !== deletedId),
				})),
			);

			return { previousModules, queryKey };
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: getModulesQueryKey() });
			toast.success("Note deleted successfully");
		},
		onError: (error, _deletedId, context) => {
			if (context?.previousModules && context?.queryKey) {
				queryClient.setQueryData(context.queryKey, context.previousModules);
			}
			toast.error(`Failed to delete note: ${error.message}`);
		},
	});

	return (
		<div className="flex h-full max-h-[90vh] flex-col">
			<DialogHeader className="border-b px-6 py-4">
				<div className="flex items-center gap-2">
					<Badge variant="secondary">{subject.code}</Badge>
					<DialogTitle>{subject.name}</DialogTitle>
				</div>
				{subject.description && (
					<DialogDescription>{subject.description}</DialogDescription>
				)}
			</DialogHeader>

			<div className="flex-1 overflow-y-auto p-4 sm:p-6">
				<div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<h3 className="font-semibold">Modules</h3>
					<CreateModuleDialog
						subjectId={subject.id}
						onCreate={(data) => createModuleMutation.mutate(data)}
						isPending={createModuleMutation.isPending}
					/>
				</div>

				{isLoading ? (
					<div className="flex items-center justify-center py-12">
						<Spinner className="size-6" />
					</div>
				) : modules && modules.length > 0 ? (
					<div className="space-y-3">
						{modules.map((module) => (
							<ModuleCard
								key={module.id}
								module={module as Module}
								onUpdate={(data) => updateModuleMutation.mutate(data)}
								onDelete={(id) => deleteModuleMutation.mutate(id)}
								onCreateNote={(data) => createNoteMutation.mutate(data)}
								onUpdateNote={(data) => updateNoteMutation.mutate(data)}
								onDeleteNote={(id) => deleteNoteMutation.mutate(id)}
								isUpdating={updateModuleMutation.isPending}
								isDeleting={deleteModuleMutation.isPending}
							/>
						))}
					</div>
				) : (
					<Card className="p-8 text-center text-muted-foreground">
						No modules found. Create your first module above.
					</Card>
				)}
			</div>
		</div>
	);
}

// Create Module Dialog
function CreateModuleDialog({
	subjectId,
	onCreate,
	isPending,
}: {
	subjectId: string;
	onCreate: (data: {
		subjectId: string;
		moduleNumber: number;
		name: string;
		description?: string;
	}) => void;
	isPending: boolean;
}) {
	const [open, setOpen] = useState(false);
	const [moduleNumber, setModuleNumber] = useState("");
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onCreate({
			subjectId,
			moduleNumber: Number.parseInt(moduleNumber, 10),
			name,
			description: description || undefined,
		});
		setOpen(false);
		setModuleNumber("");
		setName("");
		setDescription("");
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger render={<Button size="sm" />}>
				<Plus className="mr-1 size-4" />
				Add Module
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create New Module</DialogTitle>
					<DialogDescription>
						Add a new module to this subject.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4 p-6">
					<div className="space-y-2">
						<label className="font-medium text-sm">Module Number</label>
						<Input
							type="number"
							value={moduleNumber}
							onChange={(e) => setModuleNumber(e.target.value)}
							placeholder="1"
							required
							min={1}
						/>
					</div>
					<div className="space-y-2">
						<label className="font-medium text-sm">Module Name</label>
						<Input
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Introduction to..."
							required
						/>
					</div>
					<div className="space-y-2">
						<label className="font-medium text-sm">
							Description (Optional)
						</label>
						<Textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Module description..."
						/>
					</div>
				</form>
				<DialogFooter>
					<DialogClose render={<Button variant="outline" />}>
						Cancel
					</DialogClose>
					<Button
						onClick={handleSubmit}
						disabled={isPending || !moduleNumber || !name}
					>
						{isPending ? <Spinner className="mr-2 size-4" /> : null}
						Create Module
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// Module Card Component with collapsible notes
function ModuleCard({
	module,
	onUpdate,
	onDelete,
	onCreateNote,
	onUpdateNote,
	onDeleteNote,
	isUpdating,
	isDeleting,
}: {
	module: Module;
	onUpdate: (data: {
		id: string;
		moduleNumber?: number;
		name?: string;
		description?: string;
	}) => void;
	onDelete: (id: string) => void;
	onCreateNote: (data: {
		moduleId: string;
		name: string;
		pdfUrl: string;
	}) => void;
	onUpdateNote: (data: { id: string; name?: string; pdfUrl?: string }) => void;
	onDeleteNote: (id: string) => void;
	isUpdating: boolean;
	isDeleting: boolean;
}) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<Card className="overflow-hidden">
			<Collapsible open={isOpen} onOpenChange={setIsOpen}>
				<div className="flex items-center justify-between p-4">
					<CollapsibleTrigger className="flex flex-1 items-center gap-3 text-left">
						<ChevronDown
							className={`size-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
						/>
						<div>
							<h3 className="font-semibold">
								Module {module.moduleNumber}: {module.name}
							</h3>
							{module.description && (
								<p className="text-muted-foreground text-sm">
									{module.description}
								</p>
							)}
							<p className="mt-1 text-muted-foreground text-xs">
								{module.notes.length} note{module.notes.length !== 1 ? "s" : ""}
							</p>
						</div>
					</CollapsibleTrigger>

					<div className="flex items-center gap-2">
						<EditModuleDialog
							module={module}
							onUpdate={onUpdate}
							isPending={isUpdating}
						/>
						<DeleteConfirmDialog
							title="Delete Module"
							description={`Are you sure you want to delete "${module.name}"? This will also delete all notes in this module.`}
							onConfirm={() => onDelete(module.id)}
							isPending={isDeleting}
						/>
					</div>
				</div>

				<CollapsibleContent>
					<div className="border-t bg-muted/30 p-4">
						<div className="mb-4 flex items-center justify-between">
							<h4 className="font-medium text-sm">Notes</h4>
							<CreateNoteDialog moduleId={module.id} onCreate={onCreateNote} />
						</div>

						{module.notes.length > 0 ? (
							<div className="space-y-2">
								{module.notes.map((note) => (
									<NoteRow
										key={note.id}
										note={note}
										onUpdate={onUpdateNote}
										onDelete={onDeleteNote}
									/>
								))}
							</div>
						) : (
							<p className="py-4 text-center text-muted-foreground text-sm">
								No notes yet. Add your first note above.
							</p>
						)}
					</div>
				</CollapsibleContent>
			</Collapsible>
		</Card>
	);
}

// Edit Module Dialog
function EditModuleDialog({
	module,
	onUpdate,
	isPending,
}: {
	module: Module;
	onUpdate: (data: {
		id: string;
		moduleNumber?: number;
		name?: string;
		description?: string;
	}) => void;
	isPending: boolean;
}) {
	const [open, setOpen] = useState(false);
	const [moduleNumber, setModuleNumber] = useState(String(module.moduleNumber));
	const [name, setName] = useState(module.name);
	const [description, setDescription] = useState(module.description || "");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onUpdate({
			id: module.id,
			moduleNumber: Number.parseInt(moduleNumber, 10),
			name,
			description: description || undefined,
		});
		setOpen(false);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger render={<Button size="icon" variant="ghost" />}>
				<Pencil className="size-4" />
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit Module</DialogTitle>
					<DialogDescription>Update module details.</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4 p-6">
					<div className="space-y-2">
						<label className="font-medium text-sm">Module Number</label>
						<Input
							type="number"
							value={moduleNumber}
							onChange={(e) => setModuleNumber(e.target.value)}
							required
							min={1}
						/>
					</div>
					<div className="space-y-2">
						<label className="font-medium text-sm">Module Name</label>
						<Input
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
						/>
					</div>
					<div className="space-y-2">
						<label className="font-medium text-sm">
							Description (Optional)
						</label>
						<Textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
						/>
					</div>
				</form>
				<DialogFooter>
					<DialogClose render={<Button variant="outline" />}>
						Cancel
					</DialogClose>
					<Button onClick={handleSubmit} disabled={isPending}>
						{isPending ? <Spinner className="mr-2 size-4" /> : null}
						Save Changes
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// Create Note Dialog
function CreateNoteDialog({
	moduleId,
	onCreate,
}: {
	moduleId: string;
	onCreate: (data: { moduleId: string; name: string; pdfUrl: string }) => void;
}) {
	const [open, setOpen] = useState(false);
	const [name, setName] = useState("");
	const [pdfUrl, setPdfUrl] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onCreate({ moduleId, name, pdfUrl });
		setOpen(false);
		setName("");
		setPdfUrl("");
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger render={<Button size="sm" variant="outline" />}>
				<Plus className="mr-1 size-4" />
				Add Note
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add New Note</DialogTitle>
					<DialogDescription>
						Add a PDF note to this module. You can use Google Drive links or
						direct PDF URLs.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4 p-6">
					<div className="space-y-2">
						<label className="font-medium text-sm">Note Name</label>
						<Input
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Lecture 1 Notes"
							required
						/>
					</div>
					<div className="space-y-2">
						<label className="font-medium text-sm">PDF URL</label>
						<Input
							type="url"
							value={pdfUrl}
							onChange={(e) => setPdfUrl(e.target.value)}
							placeholder="https://drive.google.com/file/d/..."
							required
						/>
						<p className="text-muted-foreground text-xs">
							Supports Google Drive links and direct PDF URLs
						</p>
					</div>
				</form>
				<DialogFooter>
					<DialogClose render={<Button variant="outline" />}>
						Cancel
					</DialogClose>
					<Button onClick={handleSubmit} disabled={!name || !pdfUrl}>
						Add Note
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// Note Row Component
function NoteRow({
	note,
	onUpdate,
	onDelete,
}: {
	note: Note;
	onUpdate: (data: { id: string; name?: string; pdfUrl?: string }) => void;
	onDelete: (id: string) => void;
}) {
	return (
		<div className="flex items-center justify-between rounded-lg bg-background p-3">
			<div className="flex items-center gap-3">
				<FileText className="size-4 text-muted-foreground" />
				<div>
					<p className="font-medium text-sm">{note.name}</p>
					<p className="text-muted-foreground text-xs">
						{note.downloadCount} download{note.downloadCount !== 1 ? "s" : ""}
					</p>
				</div>
			</div>
			<div className="flex items-center gap-1">
				<EditNoteDialog note={note} onUpdate={onUpdate} />
				<DeleteConfirmDialog
					title="Delete Note"
					description={`Are you sure you want to delete "${note.name}"?`}
					onConfirm={() => onDelete(note.id)}
				/>
			</div>
		</div>
	);
}

// Edit Note Dialog
function EditNoteDialog({
	note,
	onUpdate,
}: {
	note: Note;
	onUpdate: (data: { id: string; name?: string; pdfUrl?: string }) => void;
}) {
	const [open, setOpen] = useState(false);
	const [name, setName] = useState(note.name);
	const [pdfUrl, setPdfUrl] = useState(note.pdfUrl);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onUpdate({ id: note.id, name, pdfUrl });
		setOpen(false);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger render={<Button size="icon" variant="ghost" />}>
				<Pencil className="size-4" />
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit Note</DialogTitle>
					<DialogDescription>Update note details.</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4 p-6">
					<div className="space-y-2">
						<label className="font-medium text-sm">Note Name</label>
						<Input
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
						/>
					</div>
					<div className="space-y-2">
						<label className="font-medium text-sm">PDF URL</label>
						<Input
							type="url"
							value={pdfUrl}
							onChange={(e) => setPdfUrl(e.target.value)}
							required
						/>
					</div>
				</form>
				<DialogFooter>
					<DialogClose render={<Button variant="outline" />}>
						Cancel
					</DialogClose>
					<Button onClick={handleSubmit}>Save Changes</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// Delete Confirm Dialog
function DeleteConfirmDialog({
	title,
	description,
	onConfirm,
	isPending,
}: {
	title: string;
	description: string;
	onConfirm: () => void;
	isPending?: boolean;
}) {
	const [open, setOpen] = useState(false);

	const handleConfirm = () => {
		onConfirm();
		setOpen(false);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger render={<Button size="icon" variant="ghost" />}>
				<Trash2 className="size-4 text-destructive" />
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<DialogClose render={<Button variant="outline" />}>
						Cancel
					</DialogClose>
					<Button
						variant="destructive"
						onClick={handleConfirm}
						disabled={isPending}
					>
						{isPending ? <Spinner className="mr-2 size-4" /> : null}
						Delete
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
