import { db, schema } from "@notestack/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { repsProcedure } from "../index";

const generateId = () => crypto.randomUUID().replace(/-/g, "").slice(0, 32);

// Reps routes - accessible to reps and admin
export const repsRouter = {
	// Create a new module
	createModule: repsProcedure
		.input(
			z.object({
				subjectId: z.string(),
				moduleNumber: z.number().int().positive(),
				name: z.string().min(1).max(255),
				description: z.string().optional(),
			}),
		)
		.handler(async ({ input, context }) => {
			const now = new Date();
			const module = await db
				.insert(schema.modules)
				.values({
					id: generateId(),
					subjectId: input.subjectId,
					moduleNumber: input.moduleNumber,
					name: input.name,
					description: input.description || null,
					createdAt: now,
					updatedAt: now,
					createdBy: context.user!.id,
				})
				.returning();
			return module[0];
		}),

	// Update a module
	updateModule: repsProcedure
		.input(
			z.object({
				id: z.string(),
				moduleNumber: z.number().int().positive().optional(),
				name: z.string().min(1).max(255).optional(),
				description: z.string().optional(),
			}),
		)
		.handler(async ({ input }) => {
			const { id, ...data } = input;
			const module = await db
				.update(schema.modules)
				.set({
					...data,
					updatedAt: new Date(),
				})
				.where(eq(schema.modules.id, id))
				.returning();
			return module[0];
		}),

	// Delete a module
	deleteModule: repsProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ input }) => {
			await db.delete(schema.modules).where(eq(schema.modules.id, input.id));
			return { success: true };
		}),

	// Create a new note
	createNote: repsProcedure
		.input(
			z.object({
				moduleId: z.string(),
				name: z.string().min(1).max(255),
				pdfUrl: z.string().url(),
			}),
		)
		.handler(async ({ input, context }) => {
			const now = new Date();
			const note = await db
				.insert(schema.notes)
				.values({
					id: generateId(),
					moduleId: input.moduleId,
					name: input.name,
					pdfUrl: input.pdfUrl,
					downloadCount: 0,
					createdAt: now,
					updatedAt: now,
					createdBy: context.user!.id,
				})
				.returning();
			return note[0];
		}),

	// Update a note
	updateNote: repsProcedure
		.input(
			z.object({
				id: z.string(),
				name: z.string().min(1).max(255).optional(),
				pdfUrl: z.string().url().optional(),
			}),
		)
		.handler(async ({ input }) => {
			const { id, ...data } = input;
			const note = await db
				.update(schema.notes)
				.set({
					...data,
					updatedAt: new Date(),
				})
				.where(eq(schema.notes.id, id))
				.returning();
			return note[0];
		}),

	// Delete a note
	deleteNote: repsProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ input }) => {
			await db.delete(schema.notes).where(eq(schema.notes.id, input.id));
			return { success: true };
		}),

	// Get all modules with notes for dashboard
	getAllModulesWithNotes: repsProcedure
		.input(z.object({ subjectId: z.string() }))
		.handler(async ({ input }) => {
			const modules = await db
				.select()
				.from(schema.modules)
				.where(eq(schema.modules.subjectId, input.subjectId))
				.orderBy(schema.modules.moduleNumber);

			const modulesWithNotes = await Promise.all(
				modules.map(async (module) => {
					const notes = await db
						.select()
						.from(schema.notes)
						.where(eq(schema.notes.moduleId, module.id))
						.orderBy(schema.notes.createdAt);
					return { ...module, notes };
				}),
			);

			return modulesWithNotes;
		}),
};
