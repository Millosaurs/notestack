"use client";

import { authClient } from "@notestack/auth/client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LoginModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError("");

		try {
			const result = await authClient.signIn.username({
				username,
				password,
			});

			if (result.error) {
				setError(result.error.message || "Invalid username or password");
			} else {
				onOpenChange(false);
				window.location.reload();
			}
		} catch (err) {
			setError("An error occurred during login");
			console.error(err);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent showCloseButton={false} className="max-w-sm">
				<DialogHeader>
					<DialogTitle>Sign in to Notestack</DialogTitle>
					<DialogDescription>
						Enter your username and password to continue
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleLogin} className="space-y-5 p-6 pt-2">
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="username" className="font-medium text-sm">
								Username
							</Label>
							<Input
								id="username"
								type="text"
								placeholder="1ST25CSXXX"
								value={username}
								onChange={(e) => setUsername(e.target.value.toUpperCase())}
								required
								disabled={isLoading}
								autoComplete="username"
								autoFocus
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="password" className="font-medium text-sm">
								Password
							</Label>
							<Input
								id="password"
								type="password"
								placeholder="Enter password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								disabled={isLoading}
								autoComplete="current-password"
							/>
						</div>
					</div>

					{error && (
						<div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2">
							<p className="text-destructive text-sm">{error}</p>
						</div>
					)}

					<Button
						type="submit"
						className="w-full"
						size="lg"
						disabled={isLoading}
					>
						{isLoading ? "Signing in..." : "Sign in"}
					</Button>
				</form>
			</DialogContent>
		</Dialog>
	);
}
