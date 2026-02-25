"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ModuleCard } from "@/components/module-card";
import { Button } from "@/components/ui/button";
import { orpc } from "@/utils/orpc";

export default function SubjectPage() {
	const params = useParams();
	const subjectId = params.id as string;

	const { data: subject, isLoading: isSubjectLoading } = useQuery(
		orpc.getSubject.queryOptions({ input: { id: subjectId } }),
	);
	const { data: modules, isLoading: isModulesLoading } = useQuery({
		...orpc.getModules.queryOptions({ input: { subjectId } }),
		enabled: !!subjectId,
	});

	if (isSubjectLoading) {
		return (
			<div className="flex items-center justify-center p-8">
				<p className="text-muted-foreground">Loading...</p>
			</div>
		);
	}

	if (!subject) {
		return (
			<div className="container mx-auto max-w-6xl px-4 py-6">
				<p className="text-muted-foreground">Subject not found.</p>
				<Link href="/">
					<Button variant="outline" className="mt-4">
						Back to Subjects
					</Button>
				</Link>
			</div>
		);
	}

	return (
		<div className="container mx-auto max-w-6xl px-4 py-6">
			<div className="mb-6">
				<Link
					href="/"
					className="text-muted-foreground text-sm transition-colors hover:text-foreground"
				>
					&larr; Back to Subjects
				</Link>
			</div>

			<div className="mb-8">
				<span className="inline-block rounded bg-primary/10 px-2 py-1 font-semibold text-primary text-sm">
					{subject.code}
				</span>
				<h1 className="mt-3 font-bold text-3xl">{subject.name}</h1>
				{subject.description && (
					<p className="mt-2 text-muted-foreground">{subject.description}</p>
				)}
			</div>

			<div className="mb-4">
				<h2 className="font-semibold text-xl">Modules</h2>
			</div>

			{isModulesLoading ? (
				<div className="grid gap-4 sm:grid-cols-2">
					{[1, 2, 3, 4].map((i) => (
						<div
							key={i}
							className="h-24 animate-pulse rounded-lg border bg-muted"
						/>
					))}
				</div>
			) : modules && modules.length > 0 ? (
				<div className="grid gap-4 sm:grid-cols-2">
					{modules.map((module) => (
						<ModuleCard key={module.id} module={module} />
					))}
				</div>
			) : (
				<div className="rounded-lg border py-12 text-center">
					<p className="text-muted-foreground">No modules available yet.</p>
				</div>
			)}
		</div>
	);
}
