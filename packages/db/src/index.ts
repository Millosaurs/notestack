import { env } from "@notestack/env/server";
import { drizzle } from "drizzle-orm/libsql/http";

import * as schema from "./schema";

// Use HTTP-only drizzle driver for Vercel/serverless compatibility (no native bindings needed)
export const db = drizzle({
	connection: {
		url: env.DATABASE_URL,
		authToken: env.DATABASE_AUTH_TOKEN,
	},
	schema,
});

export { schema };
