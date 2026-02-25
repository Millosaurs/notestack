import { db, schema } from "@notestack/db";
import { env } from "@notestack/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, username } from "better-auth/plugins";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "sqlite",
		schema: {
			user: schema.users,
			session: schema.sessions,
			account: schema.accounts,
			verification: schema.verifications,
		},
	}),
	emailAndPassword: {
		enabled: true,
	},
	plugins: [
		username(),
		admin({
			defaultRole: "user",
		}),
	],
	secret: env.BETTERAUTH_SECRET,
	baseURL: env.CORS_ORIGIN,
});
