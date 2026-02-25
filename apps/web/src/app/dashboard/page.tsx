"use client";

import { signOut } from "@notestack/auth/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { RepsDashboard } from "@/components/dashboard/reps-dashboard";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import { orpc } from "@/utils/orpc";

export default function DashboardPage() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const { data: authData, isLoading } = useQuery(
		orpc.isAuthenticated.queryOptions(),
	);

	const isAdmin = authData?.user?.role === "admin";
	const isReps = authData?.user?.role === "reps";
	const hasAccess = isAdmin || isReps;

	const handleSignOut = async () => {
		await signOut();
		queryClient.invalidateQueries();
		router.push("/");
	};

	useEffect(() => {
		if (!isLoading && !hasAccess) {
			router.push("/");
		}
	}, [isLoading, hasAccess, router]);

	if (isLoading) {
		return (
			<div className="flex min-h-[50vh] items-center justify-center">
				<Spinner className="size-8" />
			</div>
		);
	}

	if (!hasAccess) {
		return null;
	}

	return (
		<main className="container mx-auto max-w-6xl px-4 py-6 sm:py-8">
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<h1 className="font-bold text-2xl sm:text-3xl">Dashboard</h1>
				<Button
					variant="outline"
					onClick={handleSignOut}
					className="w-full sm:w-auto"
				>
					<LogOutIcon />
					Sign Out
				</Button>
			</div>

			<Tabs defaultValue={isAdmin ? "admin" : "reps"}>
				<TabsList>
					{isAdmin && <TabsTab value="admin">Admin</TabsTab>}
					<TabsTab value="reps">Reps</TabsTab>
				</TabsList>

				{isAdmin && (
					<TabsPanel value="admin">
						<AdminDashboard />
					</TabsPanel>
				)}

				<TabsPanel value="reps">
					<RepsDashboard />
				</TabsPanel>
			</Tabs>
		</main>
	);
}

function LogOutIcon() {
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
			<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
			<polyline points="16 17 21 12 16 7" />
			<line x1="21" x2="9" y1="12" y2="12" />
		</svg>
	);
}
