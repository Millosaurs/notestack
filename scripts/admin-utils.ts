import { auth } from "@notestack/auth";
import { db, schema } from "@notestack/db";
import { eq } from "drizzle-orm";

interface CreateUserInput {
	username: string;
	name: string;
	email: string;
	password: string;
	role?: "user" | "reps" | "admin";
}

export async function createUserWithPassword(input: CreateUserInput) {
	const { username, name, email, password, role = "user" } = input;

	try {
		// Check if user already exists
		const existing = await db
			.select()
			.from(schema.users)
			.where(eq(schema.users.username, username))
			.limit(1);

		if (existing.length > 0) {
			throw new Error(`User ${username} already exists`);
		}

		// Use Better Auth to create the user properly
		// Note: Better Auth's signUp API should be used, but we need custom role assignment

		// Create user
		const userId = crypto.randomUUID();
		await db.insert(schema.users).values({
			id: userId,
			name,
			email,
			username,
			displayUsername: username,
			role,
			emailVerified: true, // Auto-verify for seeded users
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		// We'll rely on Better Auth API to set password via signup
		return {
			success: true,
			message: `User ${username} created. Use signup endpoint to set password.`,
			userId,
		};
	} catch (error) {
		return {
			success: false,
			message: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

// Seed function to create initial users
export async function seedInitialUsers() {
	const usersToCreate: CreateUserInput[] = [
		{
			username: "1ST25CS134",
			name: "Admin User",
			email: "admin@notestack.local",
			password: "admin123",
			role: "admin",
		},
		{
			username: "1ST25CS001",
			name: "Test User 1",
			email: "user1@notestack.local",
			password: "password123",
			role: "user",
		},
		{
			username: "1ST25CS002",
			name: "Test Rep",
			email: "rep1@notestack.local",
			password: "password123",
			role: "reps",
		},
	];

	const results = [];
	for (const user of usersToCreate) {
		const result = await createUserWithPassword(user);
		results.push({ username: user.username, ...result });
	}

	return results;
}
