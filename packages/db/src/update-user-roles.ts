import { eq } from "drizzle-orm";
import { db } from "./index";
import { users } from "./schema";

async function updateRoles() {
	console.log("Updating user roles...");

	// Update 1ST25CS134 to admin
	const admin = await db
		.update(users)
		.set({ role: "admin" })
		.where(eq(users.username, "1st25cs134"))
		.returning();
	console.log("Updated admin:", admin);

	// Update 1ST25CS002 to reps
	const reps = await db
		.update(users)
		.set({ role: "reps" })
		.where(eq(users.username, "1st25cs002"))
		.returning();
	console.log("Updated reps:", reps);

	// Verify all users
	const allUsers = await db
		.select({
			id: users.id,
			username: users.username,
			email: users.email,
			role: users.role,
		})
		.from(users);

	console.log("\nAll users:");
	console.table(allUsers);

	process.exit(0);
}

updateRoles().catch((error) => {
	console.error("Error updating roles:", error);
	process.exit(1);
});
