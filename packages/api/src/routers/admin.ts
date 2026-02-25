import { auth } from "@notestack/auth";
import { db, schema } from "@notestack/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { adminProcedure } from "../index";

const generateId = () => crypto.randomUUID().replace(/-/g, "").slice(0, 32);

// Generate a random password with letters, numbers, and symbols
const generatePassword = (length = 12) => {
	const chars =
		"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";
	let password = "";
	const array = new Uint32Array(length);
	crypto.getRandomValues(array);
	for (let i = 0; i < length; i++) {
		password += chars[array[i]! % chars.length];
	}
	return password;
};

// Admin routes - accessible to admin only
export const adminRouter = {
	// Create a new subject
	createSubject: adminProcedure
		.input(
			z.object({
				code: z.string().min(1).max(20),
				name: z.string().min(1).max(255),
				description: z.string().optional(),
			}),
		)
		.handler(async ({ input, context }) => {
			const now = new Date();
			const subject = await db
				.insert(schema.subjects)
				.values({
					id: generateId(),
					code: input.code.toUpperCase(),
					name: input.name,
					description: input.description || null,
					createdAt: now,
					updatedAt: now,
					createdBy: context.user!.id,
				})
				.returning();
			return subject[0];
		}),

	// Update a subject
	updateSubject: adminProcedure
		.input(
			z.object({
				id: z.string(),
				code: z.string().min(1).max(20).optional(),
				name: z.string().min(1).max(255).optional(),
				description: z.string().optional(),
			}),
		)
		.handler(async ({ input }) => {
			const { id, code, ...rest } = input;
			const subject = await db
				.update(schema.subjects)
				.set({
					...rest,
					...(code ? { code: code.toUpperCase() } : {}),
					updatedAt: new Date(),
				})
				.where(eq(schema.subjects.id, id))
				.returning();
			return subject[0];
		}),

	// Delete a subject
	deleteSubject: adminProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ input }) => {
			await db.delete(schema.subjects).where(eq(schema.subjects.id, input.id));
			return { success: true };
		}),

	// Get all subjects with stats
	getSubjectsWithStats: adminProcedure.handler(async () => {
		const subjects = await db
			.select()
			.from(schema.subjects)
			.orderBy(schema.subjects.code);

		const subjectsWithStats = await Promise.all(
			subjects.map(async (subject) => {
				const modules = await db
					.select()
					.from(schema.modules)
					.where(eq(schema.modules.subjectId, subject.id));

				let totalNotes = 0;
				let totalDownloads = 0;

				for (const module of modules) {
					const notes = await db
						.select()
						.from(schema.notes)
						.where(eq(schema.notes.moduleId, module.id));
					totalNotes += notes.length;
					totalDownloads += notes.reduce((sum, n) => sum + n.downloadCount, 0);
				}

				return {
					...subject,
					moduleCount: modules.length,
					noteCount: totalNotes,
					totalDownloads,
				};
			}),
		);

		return subjectsWithStats;
	}),

	// Get all users (for admin management)
	getUsers: adminProcedure.handler(async () => {
		const users = await db
			.select({
				id: schema.users.id,
				name: schema.users.name,
				username: schema.users.username,
				displayUsername: schema.users.displayUsername,
				email: schema.users.email,
				role: schema.users.role,
				banned: schema.users.banned,
				banReason: schema.users.banReason,
				banExpires: schema.users.banExpires,
				createdAt: schema.users.createdAt,
			})
			.from(schema.users)
			.orderBy(schema.users.createdAt);
		return users;
	}),

	// Create a new user with auto-generated password
	createUser: adminProcedure
		.input(
			z.object({
				userId: z
					.string()
					.min(3)
					.max(50)
					.transform((val) => val.toUpperCase()),
				role: z.enum(["user", "reps", "admin"]).default("user"),
			}),
		)
		.handler(async ({ input, context }) => {
			const password = generatePassword(12);
			// Auto-generate email from userId (e.g., 1ST25CS134 -> 1st25cs134@notestack.local)
			const email = `${input.userId.toLowerCase()}@notestack.local`;
			const username = input.userId.toUpperCase();
			// Username plugin normalizes to lowercase for storage
			const normalizedUsername = input.userId.toLowerCase();

			// Better Auth only supports "user" and "admin" roles by default
			// We'll create with "user" role and update to custom role afterward
			const betterAuthRole = input.role === "admin" ? "admin" : "user";

			// Use Better Auth's internal API to create the user
			const result = await auth.api.createUser({
				body: {
					email: email,
					password: password,
					name: username, // Use username as name
					role: betterAuthRole,
				},
				headers: context.headers,
			});

			if (!result?.user) {
				throw new Error("Failed to create user");
			}

			// Update the user with username fields and custom role
			// The admin createUser API doesn't properly set username plugin fields,
			// so we need to update them manually
			await db
				.update(schema.users)
				.set({
					username: normalizedUsername,
					displayUsername: username,
					role: input.role,
					updatedAt: new Date(),
				})
				.where(eq(schema.users.id, result.user.id));

			// Return the user info along with the generated password
			// (password is only returned once, at creation time)
			return {
				user: {
					id: result.user.id,
					name: username,
					email: email,
					username: username,
					role: input.role,
				},
				credentials: {
					userId: username,
					email: email,
					password: password,
				},
			};
		}),

	// Update user role
	updateUserRole: adminProcedure
		.input(
			z.object({
				userId: z.string(),
				role: z.enum(["user", "reps", "admin"]),
			}),
		)
		.handler(async ({ input }) => {
			const user = await db
				.update(schema.users)
				.set({
					role: input.role,
					updatedAt: new Date(),
				})
				.where(eq(schema.users.id, input.userId))
				.returning();
			return user[0];
		}),

	// Ban a user
	banUser: adminProcedure
		.input(
			z.object({
				userId: z.string(),
				banReason: z.string().optional(),
				banExpiresInDays: z.number().optional(), // Number of days until ban expires
			}),
		)
		.handler(async ({ input, context }) => {
			// Use Better Auth's internal API to ban the user
			await auth.api.banUser({
				body: {
					userId: input.userId,
					banReason: input.banReason,
					banExpiresIn: input.banExpiresInDays
						? input.banExpiresInDays * 24 * 60 * 60
						: undefined,
				},
				headers: context.headers,
			});

			// Return updated user
			const user = await db
				.select()
				.from(schema.users)
				.where(eq(schema.users.id, input.userId));

			return user[0];
		}),

	// Unban a user
	unbanUser: adminProcedure
		.input(z.object({ userId: z.string() }))
		.handler(async ({ input, context }) => {
			// Use Better Auth's internal API to unban the user
			await auth.api.unbanUser({
				body: {
					userId: input.userId,
				},
				headers: context.headers,
			});

			// Return updated user
			const user = await db
				.select()
				.from(schema.users)
				.where(eq(schema.users.id, input.userId));

			return user[0];
		}),

	// Change user password (generates new password)
	resetUserPassword: adminProcedure
		.input(z.object({ userId: z.string() }))
		.handler(async ({ input, context }) => {
			const newPassword = generatePassword(12);

			// Use Better Auth's internal API to set the password
			await auth.api.setUserPassword({
				body: {
					userId: input.userId,
					newPassword: newPassword,
				},
				headers: context.headers,
			});

			// Get user info to return with the new password
			const user = await db
				.select({
					id: schema.users.id,
					name: schema.users.name,
					email: schema.users.email,
					username: schema.users.username,
				})
				.from(schema.users)
				.where(eq(schema.users.id, input.userId));

			if (!user[0]) {
				throw new Error("User not found");
			}

			const foundUser = user[0];
			const emailPart = foundUser.email?.split("@")[0] ?? "";

			return {
				user: foundUser,
				credentials: {
					userId: foundUser.username ?? emailPart.toUpperCase(),
					email: foundUser.email,
					password: newPassword,
				},
			};
		}),

	// Delete a user
	deleteUser: adminProcedure
		.input(z.object({ userId: z.string() }))
		.handler(async ({ input, context }) => {
			// Prevent admin from deleting themselves
			if (input.userId === context.user!.id) {
				throw new Error("Cannot delete your own account");
			}

			// Delete the user (cascades to sessions and accounts)
			await db.delete(schema.users).where(eq(schema.users.id, input.userId));

			return { success: true };
		}),
};
