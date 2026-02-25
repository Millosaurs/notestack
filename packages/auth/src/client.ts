import { env } from "@notestack/env/web";
import { adminClient, usernameClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	baseURL: env.NEXT_PUBLIC_CORS_ORIGIN,
	plugins: [usernameClient(), adminClient()],
});

export const { signIn, signOut, signUp, useSession } = authClient;
