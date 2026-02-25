"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LoginModal } from "@/components/login-modal";
import { orpc } from "@/utils/orpc";

export default function Home() {
	const { data: authData, isLoading: isAuthLoading } = useQuery(
		orpc.isAuthenticated.queryOptions(),
	);
	const { data: subjects, isLoading: isSubjectsLoading } = useQuery({
		...orpc.getSubjects.queryOptions(),
		enabled: !!authData?.isAuthenticated,
	});
	const [showLoginModal, setShowLoginModal] = useState(false);

	useEffect(() => {
		if (!isAuthLoading && authData && !authData.isAuthenticated) {
			setShowLoginModal(true);
		}
	}, [isAuthLoading, authData]);

	if (isAuthLoading) {
		return (
			<div className="flex items-center justify-center p-8">
				<p className="text-muted-foreground">Loading...</p>
			</div>
		);
	}

	return (
		<>
			<LoginModal open={showLoginModal} onOpenChange={setShowLoginModal} />

			<div className="container mx-auto max-w-8xl px-4 py-6">
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<div className="py-4 font-semibold text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
						Notestack
						<sub className="px-2 text-muted-foreground text-xs sm:text-sm">
							by shrivatsav
						</sub>
					</div>
					<div>
						{authData?.isAuthenticated && authData.user && (
							<div className="flex items-center gap-2 text-lg sm:text-xl md:text-2xl">
								<span className="font-medium">
									{authData.user.displayUsername || authData.user.username}
								</span>
								{/*<span className="text-muted-foreground capitalize">
									{authData.user.role}
								</span>*/}
							</div>
						)}
					</div>
				</div>
				<div className="mb-6 sm:mb-8">
					<h1 className="font-bold text-2xl sm:text-3xl">Subjects</h1>
					<p className="mt-1 text-muted-foreground text-sm sm:text-base">
						Select a subject to view modules and notes
					</p>
				</div>

				{isSubjectsLoading ? (
					<div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
						{[1, 2, 3].map((i) => (
							<div
								key={i}
								className="h-28 animate-pulse rounded-lg border bg-muted sm:h-32"
							/>
						))}
					</div>
				) : subjects && subjects.length > 0 ? (
					<div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
						{subjects.map((subject) => (
							<Link
								key={subject.id}
								href={`/subject/${subject.id}`}
								className="group rounded-lg border p-4 transition-colors hover:border-primary hover:bg-accent/50 active:bg-accent/70 sm:p-5"
							>
								<div className="flex items-start justify-between">
									<div>
										<span className="inline-block rounded bg-primary/10 px-2 py-1 font-semibold text-primary text-xs">
											{subject.code}
										</span>
										<h2 className="mt-2 font-semibold text-base transition-colors group-hover:text-primary sm:mt-3 sm:text-lg">
											{subject.name}
										</h2>
										{subject.description && (
											<p className="mt-1 line-clamp-2 text-muted-foreground text-xs sm:text-sm">
												{subject.description}
											</p>
										)}
									</div>
								</div>
							</Link>
						))}
					</div>
				) : (
					<div className="py-12 text-center">
						<p className="text-muted-foreground">No subjects available yet.</p>
					</div>
				)}
			</div>
		</>
	);
}
