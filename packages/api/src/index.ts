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
