"use client";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { LoginModal } from "@/components/login-modal";
import { orpc } from "@/utils/orpc";

const TITLE_TEXT = `
 ██████╗ ███████╗████████╗████████╗███████╗██████╗
 ██╔══██╗██╔════╝╚══██╔══╝╚══██╔══╝██╔════╝██╔══██╗
 ██████╔╝█████╗     ██║      ██║   █████╗  ██████╔╝
 ██╔══██╗██╔══╝     ██║      ██║   ██╔══╝  ██╔══██╗
 ██████╔╝███████╗   ██║      ██║   ███████╗██║  ██║
 ╚═════╝ ╚══════╝   ╚═╝      ╚═╝   ╚══════╝╚═╝  ╚═╝

 ████████╗    ███████╗████████╗ █████╗  ██████╗██╗  ██╗
 ╚══██╔══╝    ██╔════╝╚══██╔══╝██╔══██╗██╔════╝██║ ██╔╝
    ██║       ███████╗   ██║   ███████║██║     █████╔╝
    ██║       ╚════██║   ██║   ██╔══██║██║     ██╔═██╗
    ██║       ███████║   ██║   ██║  ██║╚██████╗██║  ██╗
    ╚═╝       ╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝
 `;

export default function Home() {
	const healthCheck = useQuery(orpc.healthCheck.queryOptions());
	const { data: authData, isLoading: isAuthLoading } = useQuery(
		orpc.isAuthenticated.queryOptions(),
	);
	const [showLoginModal, setShowLoginModal] = useState(false);

	useEffect(() => {
		if (!isAuthLoading && authData && !authData.isAuthenticated) {
			setShowLoginModal(true);
		}
	}, [isAuthLoading, authData]);

	return (
		<>
			<LoginModal open={showLoginModal} onOpenChange={setShowLoginModal} />
			<div className="container mx-auto max-w-8xl px-4 py-2">
				<div className="flex items-center justify-between py-4">
					<p className="font-semibold text-5xl">
						Notestack
						<sub className="px-1 text-muted-foreground text-sm">
							by shrivatsav
						</sub>
					</p>
					{authData?.isAuthenticated && authData.user && (
						<div className="flex items-center gap-3">
							<div className="text-right">
								<p className="font-medium">
									{authData.user.displayUsername || authData.user.username}
								</p>
								<p className="text-muted-foreground text-xs capitalize">
									{authData.user.role || "user"}
								</p>
							</div>
						</div>
					)}
				</div>
				<div className="grid gap-6">
					<section className="flex flex-col items-start rounded-lg px-1">
						<h2 className="mb-2 font-medium">API Status</h2>
						<div className="flex items-center gap-2">
							<div
								className={`h-2 w-2 rounded-full ${healthCheck.data ? "bg-green-500" : "bg-red-500"}`}
							/>
							<span className="text-muted-foreground text-sm">
								{healthCheck.isLoading
									? "Checking..."
									: healthCheck.data
										? "Connected"
										: "Disconnected"}
							</span>
						</div>
					</section>
				</div>
			</div>
		</>
	);
}
