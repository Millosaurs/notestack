import type { RouterClient } from "@orpc/server";

import { protectedProcedure, publicProcedure } from "../index";

export const appRouter = {
	healthCheck: publicProcedure.handler(() => {
		return "OK";
	}),

	// Get current user session
	getCurrentUser: publicProcedure.handler(({ context }) => {
		return {
			user: context.user,
			session: context.session,
		};
	}),

	// Check if user is authenticated
	isAuthenticated: publicProcedure.handler(({ context }) => {
		return {
			isAuthenticated: !!context.user && !!context.session,
			user: context.user,
		};
	}),

	// Protected example - only for authenticated users
	getProfile: protectedProcedure.handler(({ context }) => {
		return {
			user: context.user,
		};
	}),
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
