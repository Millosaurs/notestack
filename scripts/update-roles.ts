import "dotenv/config";
import { eq } from "drizzle-orm";
import { db, schema } from "./src/index";

async function updateRoles() {
	console.log("Updating user roles...");

	// Update 1ST25CS134 to admin
	await db
		.update(schema.users)
		.set({ role: "admin" })
		.where(eq(schema.users.username, "1st25cs134"));
	console.log("✅ Set 1ST25CS134 as admin");

	// Update 1ST25CS002 to reps
	await db
		.update(schema.users)
		.set({ role: "reps" })
		.where(eq(schema.users.username, "1st25cs002"));
	console.log("✅ Set 1ST25CS002 as reps");

	console.log("\n✨ Roles updated successfully!");
	process.exit(0);
}

updateRoles().catch((error) => {
	console.error("Error updating roles:", error);
	process.exit(1);
});
