"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	BookOpen,
	Copy,
	Download,
	FileText,
	Key,
	Pencil,
	Plus,
	Search,
	ShieldBan,
	ShieldCheck,
	Trash2,
	UserPlus,
	Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import {
	Select,
	SelectItem,
	SelectPopup,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { client, orpc } from "@/utils/orpc";

type Subject = {
	id: string;
	code: string;
	name: string;
	description: string | null;
	createdAt: Date;
	updatedAt: Date;
	createdBy: string;
	moduleCount: number;
	noteCount: number;
	totalDownloads: number;
};

type User = {
	id: string;
	name: string;
	username: string | null;
	displayUsername: string | null;
	email: string;
	role: "user" | "reps" | "admin";
	banned: boolean | null;
	banReason: string | null;
	banExpires: Date | null;
	createdAt: Date;
};

type Credentials = {
	userId: string;
	email: string;
	password: string;
};

export function AdminDashboard() {
	return (
		<div className="mt-6">
			<Tabs defaultValue="subjects">
				<TabsList>
					<TabsTab value="subjects">
						<BookOpen className="mr-1 size-4" />
						Subjects
					</TabsTab>
					<TabsTab value="users">
						<Users className="mr-1 size-4" />
						Users
					</TabsTab>
				</TabsList>

				<TabsPanel value="subjects">
					<SubjectsManagement />
				</TabsPanel>

				<TabsPanel value="users">
					<UsersManagement />
				</TabsPanel>
			</Tabs>
		</div>
	);
}

// Subjects Management
function SubjectsManagement() {
	const queryClient = useQueryClient();

	const { data: subjects, isLoading } = useQuery(
		orpc.admin.getSubjectsWithStats.queryOptions(),
	);

	// Helper to get query key
	const getSubjectsQueryKey = () =>
		orpc.admin.getSubjectsWithStats.queryOptions().queryKey;

	const createSubjectMutation = useMutation({
		mutationFn: (data: { code: string; name: string; description?: string }) =>
			client.admin.createSubject(data),
		onMutate: async (newSubject) => {
			const queryKey = getSubjectsQueryKey();
			await queryClient.cancelQueries({ queryKey });

			const previousSubjects = queryClient.getQueryData<Subject[]>(queryKey);

			queryClient.setQueryData<Subject[]>(queryKey, (old) => [
				...(old || []),
				{
					id: `temp-${Date.now()}`,
					code: newSubject.code,
					name: newSubject.name,
					description: newSubject.description || null,
					createdAt: new Date(),
					updatedAt: new Date(),
					createdBy: "",
					moduleCount: 0,
					noteCount: 0,
					totalDownloads: 0,
				},
			]);

			return { previousSubjects, queryKey };
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: getSubjectsQueryKey() });
			toast.success("Subject created successfully");
		},
		onError: (error, _newSubject, context) => {
			if (context?.previousSubjects && context?.queryKey) {
				queryClient.setQueryData(context.queryKey, context.previousSubjects);
			}
			toast.error(`Failed to create subject: ${error.message}`);
		},
	});

	const updateSubjectMutation = useMutation({
		mutationFn: (data: {
			id: string;
			code?: string;
			name?: string;
			description?: string;
		}) => client.admin.updateSubject(data),
		onMutate: async (updatedSubject) => {
			const queryKey = getSubjectsQueryKey();
			await queryClient.cancelQueries({ queryKey });

			const previousSubjects = queryClient.getQueryData<Subject[]>(queryKey);

			queryClient.setQueryData<Subject[]>(queryKey, (old) =>
				old?.map((subject) =>
					subject.id === updatedSubject.id
						? {
								...subject,
								code: updatedSubject.code ?? subject.code,
								name: updatedSubject.name ?? subject.name,
								description: updatedSubject.description ?? subject.description,
								updatedAt: new Date(),
							}
						: subject,
				),
			);

			return { previousSubjects, queryKey };
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: getSubjectsQueryKey() });
			toast.success("Subject updated successfully");
		},
		onError: (error, _updatedSubject, context) => {
			if (context?.previousSubjects && context?.queryKey) {
				queryClient.setQueryData(context.queryKey, context.previousSubjects);
			}
			toast.error(`Failed to update subject: ${error.message}`);
		},
	});

	const deleteSubjectMutation = useMutation({
		mutationFn: (id: string) => client.admin.deleteSubject({ id }),
		onMutate: async (deletedId) => {
			const queryKey = getSubjectsQueryKey();
			await queryClient.cancelQueries({ queryKey });

			const previousSubjects = queryClient.getQueryData<Subject[]>(queryKey);

			queryClient.setQueryData<Subject[]>(queryKey, (old) =>
				old?.filter((subject) => subject.id !== deletedId),
			);

			return { previousSubjects, queryKey };
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: getSubjectsQueryKey() });
			toast.success("Subject deleted successfully");
		},
		onError: (error, _deletedId, context) => {
			if (context?.previousSubjects && context?.queryKey) {
				queryClient.setQueryData(context.queryKey, context.previousSubjects);
			}
			toast.error(`Failed to delete subject: ${error.message}`);
		},
	});

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Spinner className="size-8" />
			</div>
		);
	}

	return (
		<div className="mt-6 space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<h2 className="font-semibold text-lg sm:text-xl">Manage Subjects</h2>
				<CreateSubjectDialog
					onCreate={(data) => createSubjectMutation.mutate(data)}
					isPending={createSubjectMutation.isPending}
				/>
			</div>

			{subjects && subjects.length > 0 ? (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{subjects.map((subject) => (
						<SubjectCard
							key={subject.id}
							subject={subject as Subject}
							onUpdate={(data) => updateSubjectMutation.mutate(data)}
							onDelete={(id) => deleteSubjectMutation.mutate(id)}
							isUpdating={updateSubjectMutation.isPending}
							isDeleting={deleteSubjectMutation.isPending}
						/>
					))}
				</div>
			) : (
				<Card className="p-8 text-center text-muted-foreground">
					No subjects found. Create your first subject above.
				</Card>
			)}
		</div>
	);
}

// Subject Card
function SubjectCard({
	subject,
	onUpdate,
	onDelete,
	isUpdating,
	isDeleting,
}: {
	subject: Subject;
	onUpdate: (data: {
		id: string;
		code?: string;
		name?: string;
		description?: string;
	}) => void;
	onDelete: (id: string) => void;
	isUpdating: boolean;
	isDeleting: boolean;
}) {
	return (
		<Card className="p-4">
			<div className="mb-3 flex items-start justify-between">
				<div>
					<Badge variant="secondary" className="mb-2">
						{subject.code}
					</Badge>
					<h3 className="font-semibold">{subject.name}</h3>
					{subject.description && (
						<p className="mt-1 line-clamp-2 text-muted-foreground text-sm">
							{subject.description}
						</p>
					)}
				</div>
				<div className="flex items-center gap-1">
					<EditSubjectDialog
						subject={subject}
						onUpdate={onUpdate}
						isPending={isUpdating}
					/>
					<DeleteConfirmDialog
						title="Delete Subject"
						description={`Are you sure you want to delete "${subject.name}"? This will also delete all modules and notes in this subject.`}
						onConfirm={() => onDelete(subject.id)}
						isPending={isDeleting}
					/>
				</div>
			</div>

			<div className="flex items-center gap-4 border-t pt-3 text-muted-foreground text-sm">
				<div className="flex items-center gap-1">
					<BookOpen className="size-4" />
					<span>{subject.moduleCount} modules</span>
				</div>
				<div className="flex items-center gap-1">
					<FileText className="size-4" />
					<span>{subject.noteCount} notes</span>
				</div>
				<div className="flex items-center gap-1">
					<Download className="size-4" />
					<span>{subject.totalDownloads}</span>
				</div>
			</div>
		</Card>
	);
}

// Create Subject Dialog
function CreateSubjectDialog({
	onCreate,
	isPending,
}: {
	onCreate: (data: {
		code: string;
		name: string;
		description?: string;
	}) => void;
	isPending: boolean;
}) {
	const [open, setOpen] = useState(false);
	const [code, setCode] = useState("");
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onCreate({
			code,
			name,
			description: description || undefined,
		});
		setOpen(false);
		setCode("");
		setName("");
		setDescription("");
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger render={<Button />}>
				<Plus className="mr-1 size-4" />
				Add Subject
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create New Subject</DialogTitle>
					<DialogDescription>
						Add a new subject to the system.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4 p-6">
					<div className="space-y-2">
						<label className="font-medium text-sm">Subject Code</label>
						<Input
							value={code}
							onChange={(e) => setCode(e.target.value.toUpperCase())}
							placeholder="CS101"
							required
							maxLength={20}
						/>
						<p className="text-muted-foreground text-xs">
							A short unique identifier (e.g., CS101, MATH202)
						</p>
					</div>
					<div className="space-y-2">
						<label className="font-medium text-sm">Subject Name</label>
						<Input
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Introduction to Computer Science"
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
							placeholder="Subject description..."
						/>
					</div>
				</form>
				<DialogFooter>
					<DialogClose render={<Button variant="outline" />}>
						Cancel
					</DialogClose>
					<Button onClick={handleSubmit} disabled={isPending || !code || !name}>
						{isPending ? <Spinner className="mr-2 size-4" /> : null}
						Create Subject
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// Edit Subject Dialog
function EditSubjectDialog({
	subject,
	onUpdate,
	isPending,
}: {
	subject: Subject;
	onUpdate: (data: {
		id: string;
		code?: string;
		name?: string;
		description?: string;
	}) => void;
	isPending: boolean;
}) {
	const [open, setOpen] = useState(false);
	const [code, setCode] = useState(subject.code);
	const [name, setName] = useState(subject.name);
	const [description, setDescription] = useState(subject.description || "");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onUpdate({
			id: subject.id,
			code,
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
					<DialogTitle>Edit Subject</DialogTitle>
					<DialogDescription>Update subject details.</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4 p-6">
					<div className="space-y-2">
						<label className="font-medium text-sm">Subject Code</label>
						<Input
							value={code}
							onChange={(e) => setCode(e.target.value.toUpperCase())}
							required
							maxLength={20}
						/>
					</div>
					<div className="space-y-2">
						<label className="font-medium text-sm">Subject Name</label>
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

// Users Management
function UsersManagement() {
	const queryClient = useQueryClient();
	const [credentials, setCredentials] = useState<Credentials | null>(null);
	const [searchQuery, setSearchQuery] = useState("");

	const { data: users, isLoading } = useQuery(
		orpc.admin.getUsers.queryOptions(),
	);

	// Filter users based on search query
	const filteredUsers = useMemo(() => {
		if (!users || !searchQuery.trim()) return users;
		const query = searchQuery.toLowerCase();
		return users.filter(
			(user) =>
				user.name?.toLowerCase().includes(query) ||
				user.username?.toLowerCase().includes(query) ||
				user.displayUsername?.toLowerCase().includes(query) ||
				user.email.toLowerCase().includes(query),
		);
	}, [users, searchQuery]);

	// Helper to get query key
	const getUsersQueryKey = () => orpc.admin.getUsers.queryOptions().queryKey;

	const createUserMutation = useMutation({
		mutationFn: (data: { userId: string; role: "user" | "reps" | "admin" }) =>
			client.admin.createUser(data),
		onSuccess: (result) => {
			queryClient.invalidateQueries({ queryKey: getUsersQueryKey() });
			setCredentials(result.credentials);
			toast.success("User created successfully");
		},
		onError: (error) => {
			toast.error(`Failed to create user: ${error.message}`);
		},
	});

	const updateRoleMutation = useMutation({
		mutationFn: (data: { userId: string; role: "user" | "reps" | "admin" }) =>
			client.admin.updateUserRole(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: getUsersQueryKey() });
			toast.success("User role updated successfully");
		},
		onError: (error) => {
			toast.error(`Failed to update role: ${error.message}`);
		},
	});

	const banUserMutation = useMutation({
		mutationFn: (data: {
			userId: string;
			banReason?: string;
			banExpiresInDays?: number;
		}) => client.admin.banUser(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: getUsersQueryKey() });
			toast.success("User banned successfully");
		},
		onError: (error) => {
			toast.error(`Failed to ban user: ${error.message}`);
		},
	});

	const unbanUserMutation = useMutation({
		mutationFn: (userId: string) => client.admin.unbanUser({ userId }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: getUsersQueryKey() });
			toast.success("User unbanned successfully");
		},
		onError: (error) => {
			toast.error(`Failed to unban user: ${error.message}`);
		},
	});

	const resetPasswordMutation = useMutation({
		mutationFn: (userId: string) => client.admin.resetUserPassword({ userId }),
		onSuccess: (result) => {
			setCredentials(result.credentials);
			toast.success("Password reset successfully");
		},
		onError: (error) => {
			toast.error(`Failed to reset password: ${error.message}`);
		},
	});

	const deleteUserMutation = useMutation({
		mutationFn: (userId: string) => client.admin.deleteUser({ userId }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: getUsersQueryKey() });
			toast.success("User deleted successfully");
		},
		onError: (error) => {
			toast.error(`Failed to delete user: ${error.message}`);
		},
	});

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Spinner className="size-8" />
			</div>
		);
	}

	return (
		<div className="mt-6 space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<h2 className="font-semibold text-lg sm:text-xl">Manage Users</h2>
				<CreateUserDialog
					onCreate={(data) => createUserMutation.mutate(data)}
					isPending={createUserMutation.isPending}
				/>
			</div>

			{/* Search Input */}
			<div className="relative">
				<Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					type="text"
					placeholder="Search by name, username, or email..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="pl-9"
				/>
			</div>

			{filteredUsers && filteredUsers.length > 0 ? (
				<>
					{/* Mobile: Card layout */}
					<div className="space-y-4 md:hidden">
						{filteredUsers.map((user) => (
							<Card key={user.id} className="p-4">
								<div className="mb-3 flex items-start justify-between">
									<div className="min-w-0 flex-1">
										<p className="truncate font-medium">{user.name || "-"}</p>
										<p className="truncate text-muted-foreground text-sm">
											{user.displayUsername || user.username || "-"}
										</p>
									</div>
									<div className="ml-2 flex flex-col items-end gap-1">
										<Badge
											variant={
												user.role === "admin"
													? "default"
													: user.role === "reps"
														? "secondary"
														: "outline"
											}
										>
											{user.role}
										</Badge>
										{user.banned ? (
											<Badge variant="destructive">Banned</Badge>
										) : (
											<Badge variant="outline">Active</Badge>
										)}
									</div>
								</div>
								<p className="mb-3 truncate text-muted-foreground text-sm">
									{user.email}
								</p>
								{user.banned && user.banReason && (
									<p className="mb-3 text-destructive text-xs">
										Reason: {user.banReason}
									</p>
								)}
								<div className="flex flex-wrap items-center gap-1 border-t pt-3">
									<ChangeRoleDialog
										user={user as User}
										onUpdate={(role) =>
											updateRoleMutation.mutate({
												userId: user.id,
												role,
											})
										}
										isPending={updateRoleMutation.isPending}
									/>
									<Button
										size="icon"
										variant="ghost"
										title="Reset Password"
										onClick={() => resetPasswordMutation.mutate(user.id)}
										disabled={resetPasswordMutation.isPending}
									>
										<Key className="size-4" />
									</Button>
									{user.banned ? (
										<Button
											size="icon"
											variant="ghost"
											title="Unban User"
											onClick={() => unbanUserMutation.mutate(user.id)}
											disabled={unbanUserMutation.isPending}
										>
											<ShieldCheck className="size-4 text-green-600" />
										</Button>
									) : (
										<BanUserDialog
											user={user as User}
											onBan={(data) => banUserMutation.mutate(data)}
											isPending={banUserMutation.isPending}
										/>
									)}
									<DeleteConfirmDialog
										title="Delete User"
										description={`Are you sure you want to delete "${user.name || user.email}"? This action cannot be undone.`}
										onConfirm={() => deleteUserMutation.mutate(user.id)}
										isPending={deleteUserMutation.isPending}
									/>
								</div>
							</Card>
						))}
					</div>

					{/* Desktop: Table layout */}
					<Card className="hidden md:block">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Name</TableHead>
									<TableHead>Username</TableHead>
									<TableHead>Email</TableHead>
									<TableHead>Role</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredUsers.map((user) => (
									<TableRow key={user.id}>
										<TableCell className="font-medium">
											{user.name || "-"}
										</TableCell>
										<TableCell>
											{user.displayUsername || user.username || "-"}
										</TableCell>
										<TableCell>{user.email}</TableCell>
										<TableCell>
											<Badge
												variant={
													user.role === "admin"
														? "default"
														: user.role === "reps"
															? "secondary"
															: "outline"
												}
											>
												{user.role}
											</Badge>
										</TableCell>
										<TableCell>
											{user.banned ? (
												<div>
													<Badge variant="destructive">Banned</Badge>
													{user.banReason && (
														<p className="mt-1 text-muted-foreground text-xs">
															{user.banReason}
														</p>
													)}
												</div>
											) : (
												<Badge variant="outline">Active</Badge>
											)}
										</TableCell>
										<TableCell>
											<div className="flex items-center justify-end gap-1">
												<ChangeRoleDialog
													user={user as User}
													onUpdate={(role) =>
														updateRoleMutation.mutate({
															userId: user.id,
															role,
														})
													}
													isPending={updateRoleMutation.isPending}
												/>
												<Button
													size="icon"
													variant="ghost"
													title="Reset Password"
													onClick={() => resetPasswordMutation.mutate(user.id)}
													disabled={resetPasswordMutation.isPending}
												>
													<Key className="size-4" />
												</Button>
												{user.banned ? (
													<Button
														size="icon"
														variant="ghost"
														title="Unban User"
														onClick={() => unbanUserMutation.mutate(user.id)}
														disabled={unbanUserMutation.isPending}
													>
														<ShieldCheck className="size-4 text-green-600" />
													</Button>
												) : (
													<BanUserDialog
														user={user as User}
														onBan={(data) => banUserMutation.mutate(data)}
														isPending={banUserMutation.isPending}
													/>
												)}
												<DeleteConfirmDialog
													title="Delete User"
													description={`Are you sure you want to delete "${user.name || user.email}"? This action cannot be undone.`}
													onConfirm={() => deleteUserMutation.mutate(user.id)}
													isPending={deleteUserMutation.isPending}
												/>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</Card>
				</>
			) : (
				<Card className="p-8 text-center text-muted-foreground">
					{searchQuery.trim()
						? `No users found matching "${searchQuery}"`
						: "No users found."}
				</Card>
			)}

			{/* Credentials Modal */}
			<CredentialsModal
				credentials={credentials}
				onClose={() => setCredentials(null)}
			/>
		</div>
	);
}

// Create User Dialog
function CreateUserDialog({
	onCreate,
	isPending,
}: {
	onCreate: (data: { userId: string; role: "user" | "reps" | "admin" }) => void;
	isPending: boolean;
}) {
	const [open, setOpen] = useState(false);
	const [userId, setUserId] = useState("");
	const [role, setRole] = useState<"user" | "reps" | "admin">("user");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onCreate({ userId: userId.toUpperCase(), role });
		setOpen(false);
		setUserId("");
		setRole("user");
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger render={<Button />}>
				<UserPlus className="mr-1 size-4" />
				Add User
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create New User</DialogTitle>
					<DialogDescription>
						Enter the User ID (e.g., 1ST25CS134). Email will be auto-generated
						and password will be shown after creation.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4 p-6">
					<div className="space-y-2">
						<label className="font-medium text-sm">User ID</label>
						<Input
							value={userId}
							onChange={(e) => setUserId(e.target.value.toUpperCase())}
							placeholder="1ST25CS134"
							required
							minLength={3}
							className="uppercase"
						/>
						<p className="text-muted-foreground text-xs">
							Email will be: {userId.toLowerCase() || "userid"}@notestack.local
						</p>
					</div>
					<div className="space-y-2">
						<label className="font-medium text-sm">Role</label>
						<Select
							value={role}
							onValueChange={(value) =>
								setRole(value as "user" | "reps" | "admin")
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectPopup>
								<SelectItem value="user">User</SelectItem>
								<SelectItem value="reps">Reps</SelectItem>
								<SelectItem value="admin">Admin</SelectItem>
							</SelectPopup>
						</Select>
					</div>
				</form>
				<DialogFooter>
					<DialogClose render={<Button variant="outline" />}>
						Cancel
					</DialogClose>
					<Button onClick={handleSubmit} disabled={isPending || !userId}>
						{isPending ? <Spinner className="mr-2 size-4" /> : null}
						Create User
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// Change Role Dialog
function ChangeRoleDialog({
	user,
	onUpdate,
	isPending,
}: {
	user: User;
	onUpdate: (role: "user" | "reps" | "admin") => void;
	isPending: boolean;
}) {
	const [open, setOpen] = useState(false);
	const [role, setRole] = useState<"user" | "reps" | "admin">(user.role);

	const handleSubmit = () => {
		onUpdate(role);
		setOpen(false);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger
				render={<Button size="icon" variant="ghost" title="Change Role" />}
			>
				<Pencil className="size-4" />
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Change User Role</DialogTitle>
					<DialogDescription>
						Update the role for{" "}
						{user.displayUsername || user.username || user.email}
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 p-6">
					<div className="space-y-2">
						<label className="font-medium text-sm">Role</label>
						<Select
							value={role}
							onValueChange={(value) =>
								setRole(value as "user" | "reps" | "admin")
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectPopup>
								<SelectItem value="user">User</SelectItem>
								<SelectItem value="reps">Reps</SelectItem>
								<SelectItem value="admin">Admin</SelectItem>
							</SelectPopup>
						</Select>
						<p className="text-muted-foreground text-xs">
							<strong>User:</strong> Can view and download notes
							<br />
							<strong>Reps:</strong> Can manage modules and notes
							<br />
							<strong>Admin:</strong> Can manage subjects, users, and everything
							else
						</p>
					</div>
				</div>
				<DialogFooter>
					<DialogClose render={<Button variant="outline" />}>
						Cancel
					</DialogClose>
					<Button
						onClick={handleSubmit}
						disabled={isPending || role === user.role}
					>
						{isPending ? <Spinner className="mr-2 size-4" /> : null}
						Update Role
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// Ban User Dialog
function BanUserDialog({
	user,
	onBan,
	isPending,
}: {
	user: User;
	onBan: (data: {
		userId: string;
		banReason?: string;
		banExpiresInDays?: number;
	}) => void;
	isPending: boolean;
}) {
	const [open, setOpen] = useState(false);
	const [banReason, setBanReason] = useState("");
	const [banDuration, setBanDuration] = useState<string>("");

	const handleSubmit = () => {
		onBan({
			userId: user.id,
			banReason: banReason || undefined,
			banExpiresInDays: banDuration
				? Number.parseInt(banDuration, 10)
				: undefined,
		});
		setOpen(false);
		setBanReason("");
		setBanDuration("");
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger
				render={<Button size="icon" variant="ghost" title="Ban User" />}
			>
				<ShieldBan className="size-4 text-destructive" />
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Ban User</DialogTitle>
					<DialogDescription>
						Ban {user.displayUsername || user.username || user.email} from
						accessing the system.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 p-6">
					<div className="space-y-2">
						<label className="font-medium text-sm">Reason (Optional)</label>
						<Textarea
							value={banReason}
							onChange={(e) => setBanReason(e.target.value)}
							placeholder="Reason for ban..."
						/>
					</div>
					<div className="space-y-2">
						<label className="font-medium text-sm">
							Duration in Days (Optional)
						</label>
						<Input
							type="number"
							value={banDuration}
							onChange={(e) => setBanDuration(e.target.value)}
							placeholder="Leave empty for permanent ban"
							min={1}
						/>
						<p className="text-muted-foreground text-xs">
							Leave empty for a permanent ban
						</p>
					</div>
				</div>
				<DialogFooter>
					<DialogClose render={<Button variant="outline" />}>
						Cancel
					</DialogClose>
					<Button
						variant="destructive"
						onClick={handleSubmit}
						disabled={isPending}
					>
						{isPending ? <Spinner className="mr-2 size-4" /> : null}
						Ban User
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// Credentials Modal - shows generated password after user creation or reset
function CredentialsModal({
	credentials,
	onClose,
}: {
	credentials: Credentials | null;
	onClose: () => void;
}) {
	const copyToClipboard = (text: string, label: string) => {
		navigator.clipboard.writeText(text);
		toast.success(`${label} copied to clipboard`);
	};

	const copyAll = () => {
		if (!credentials) return;
		const text = `User ID: ${credentials.userId}
Email: ${credentials.email}
Password: ${credentials.password}`;
		navigator.clipboard.writeText(text);
		toast.success("All credentials copied to clipboard");
	};

	return (
		<Dialog open={!!credentials} onOpenChange={() => onClose()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>User Credentials</DialogTitle>
					<DialogDescription>
						Save these credentials securely. The password will not be shown
						again.
					</DialogDescription>
				</DialogHeader>
				{credentials && (
					<div className="space-y-4 p-6">
						<div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
							<div className="mb-2 flex items-center justify-between">
								<span className="text-muted-foreground">User ID:</span>
								<div className="flex items-center gap-2">
									<span>{credentials.userId}</span>
									<Button
										size="icon"
										variant="ghost"
										className="size-6"
										onClick={() =>
											copyToClipboard(credentials.userId, "User ID")
										}
									>
										<Copy className="size-3" />
									</Button>
								</div>
							</div>
							<div className="mb-2 flex items-center justify-between">
								<span className="text-muted-foreground">Email:</span>
								<div className="flex items-center gap-2">
									<span>{credentials.email}</span>
									<Button
										size="icon"
										variant="ghost"
										className="size-6"
										onClick={() => copyToClipboard(credentials.email, "Email")}
									>
										<Copy className="size-3" />
									</Button>
								</div>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground">Password:</span>
								<div className="flex items-center gap-2">
									<span className="font-bold text-primary">
										{credentials.password}
									</span>
									<Button
										size="icon"
										variant="ghost"
										className="size-6"
										onClick={() =>
											copyToClipboard(credentials.password, "Password")
										}
									>
										<Copy className="size-3" />
									</Button>
								</div>
							</div>
						</div>
						<Button onClick={copyAll} className="w-full">
							<Copy className="mr-2 size-4" />
							Copy All Credentials
						</Button>
					</div>
				)}
				<DialogFooter>
					<Button onClick={onClose}>Done</Button>
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
