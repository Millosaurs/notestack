"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { orpc } from "@/utils/orpc";
import { ModeToggle } from "./mode-toggle";

export default function Header() {
	const { data: authData } = useQuery(orpc.isAuthenticated.queryOptions());

	const isRepsOrAdmin =
		authData?.user?.role === "reps" || authData?.user?.role === "admin";

	return (
		<header className="flex items-center justify-between  px-4 py-3">
			<div className="flex items-center gap-6">
				<Link href="/" className="font-semibold text-xl">
					Notestack
				</Link>
			</div>
			<div className="flex items-center gap-3">
				{isRepsOrAdmin && (
					<Link href="/dashboard">
						<Button variant="outline" size="sm">
							Dashboard
						</Button>
					</Link>
				)}
				
				<ModeToggle />
			</div>
		</header>
	);
}
