import { ORPCError, os } from "@orpc/server";

import type { Context } from "./context";

export const o = os.$context<Context>();

export const publicProcedure = o;

export const protectedProcedure = o.use(async ({ context, next }) => {
	if (!context.user || !context.session) {
		throw new ORPCError("UNAUTHORIZED", {
			message: "Not authenticated",
		});
	}
	return next({
		context: { ...context, user: context.user, session: context.session },
	});
});

// Reps or Admin only
export const repsProcedure = protectedProcedure.use(
	async ({ context, next }) => {
		const role = context.user?.role;
		if (role !== "reps" && role !== "admin") {
			throw new ORPCError("FORBIDDEN", {
				message: "Reps or admin access required",
			});
		}
		return next({ context });
	},
);

// Admin only
export const adminProcedure = protectedProcedure.use(
	async ({ context, next }) => {
		if (context.user?.role !== "admin") {
			throw new ORPCError("FORBIDDEN", {
				message: "Admin access required",
			});
		}
		return next({ context });
	},
);
