import { createClient } from "@libsql/client/http";
import { env } from "@notestack/env/server";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "./schema";

// Use HTTP-only client for Vercel/serverless compatibility (no native bindings needed)
const client = createClient({
	url: env.DATABASE_URL,
	authToken: env.DATABASE_AUTH_TOKEN,
});

export const db = drizzle({ client, schema });

export { schema };
