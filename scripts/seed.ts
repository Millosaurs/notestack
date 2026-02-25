import { db, schema } from "@notestack/db";
import { eq } from "drizzle-orm";

// Sample users to seed - usernames in format 1ST25CSXXX
const users = [
	{
		username: "1ST25CS134",
		name: "Admin User",
		email: "admin@notestack.local",
		role: "admin",
	},
	{
		username: "1ST25CS001",
		name: "Test User 1",
		email: "user1@notestack.local",
		role: "user",
	},
	{
		username: "1ST25CS002",
		name: "Test Rep",
		email: "rep1@notestack.local",
		role: "reps",
	},
];

async function seed() {
	console.log("🌱 Seeding database...");
	console.log("\n⚠️  Note: Users will be created without passwords.");
	console.log("Use the signup API endpoint to set passwords.\n");

	for (const userData of users) {
		try {
			// Check if user already exists
			const existing = await db
				.select()
				.from(schema.users)
				.where(eq(schema.users.username, userData.username))
				.limit(1);

			if (existing.length > 0) {
				console.log(`⏭️  User ${userData.username} already exists, skipping...`);
				continue;
			}

			// Create user
			const userId = crypto.randomUUID();
			await db.insert(schema.users).values({
				id: userId,
				name: userData.name,
				email: userData.email,
				username: userData.username,
				displayUsername: userData.username,
				role: userData.role,
				emailVerified: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			console.log(`✅ Created user: ${userData.username} (${userData.role})`);
		} catch (error) {
			console.error(`❌ Error creating user ${userData.username}:`, error);
		}
	}

	console.log("\n✨ Seeding complete!");
	console.log("\n📝 To set passwords, use Better Auth signup endpoint:");
	console.log("POST /api/auth/sign-up/email with username and password");
}

seed()
	.catch((error) => {
		console.error("Fatal error during seeding:", error);
		process.exit(1);
	})
	.finally(() => {
		process.exit(0);
	});
