import type { RouterClient } from "@orpc/server";
import { adminRouter } from "./admin";
import { publicRouter } from "./public";
import { repsRouter } from "./reps";

export const appRouter = {
	...publicRouter,
	reps: repsRouter,
	admin: adminRouter,
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
