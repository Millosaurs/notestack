import type { auth } from "@notestack/auth";
import type { Context as HonoContext } from "hono";

type Session = typeof auth.$Infer.Session;

export type CreateContextOptions = {
	context: HonoContext<{
		Variables: {
			user: Session["user"] | null;
			session: Session["session"] | null;
		};
	}>;
};

export async function createContext({ context }: CreateContextOptions) {
	const user = context.get("user");
	const session = context.get("session");
	// Extract headers for use with Better Auth internal APIs
	const headers = context.req.raw.headers;
	return { user, session, headers };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
