import { db, schema } from "@notestack/db";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, publicProcedure } from "../index";

// Public routes - accessible to all authenticated users
export const publicRouter = {
	// Health check
	healthCheck: publicProcedure.handler(() => {
		return "OK";
	}),

	// Get current user session
	getCurrentUser: publicProcedure.handler(({ context }) => {
		return {
			user: context.user,
			session: context.session,
		};
	}),

	// Check if user is authenticated
	isAuthenticated: publicProcedure.handler(({ context }) => {
		return {
			isAuthenticated: !!context.user && !!context.session,
			user: context.user,
		};
	}),

	// Get all subjects
	getSubjects: protectedProcedure.handler(async () => {
		const subjects = await db
			.select()
			.from(schema.subjects)
			.orderBy(schema.subjects.code);
		return subjects;
	}),

	// Get single subject by ID
	getSubject: protectedProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ input }) => {
			const subject = await db
				.select()
				.from(schema.subjects)
				.where(eq(schema.subjects.id, input.id))
				.limit(1);
			return subject[0] || null;
		}),

	// Get modules for a subject
	getModules: protectedProcedure
		.input(z.object({ subjectId: z.string() }))
		.handler(async ({ input }) => {
			const modules = await db
				.select()
				.from(schema.modules)
				.where(eq(schema.modules.subjectId, input.subjectId))
				.orderBy(schema.modules.moduleNumber);
			return modules;
		}),

	// Get single module with notes
	getModule: protectedProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ input }) => {
			const module = await db
				.select()
				.from(schema.modules)
				.where(eq(schema.modules.id, input.id))
				.limit(1);

			if (!module[0]) return null;

			const notes = await db
				.select()
				.from(schema.notes)
				.where(eq(schema.notes.moduleId, input.id))
				.orderBy(schema.notes.createdAt);

			return { ...module[0], notes };
		}),

	// Get notes for a module
	getNotes: protectedProcedure
		.input(z.object({ moduleId: z.string() }))
		.handler(async ({ input }) => {
			const notes = await db
				.select()
				.from(schema.notes)
				.where(eq(schema.notes.moduleId, input.moduleId))
				.orderBy(schema.notes.createdAt);
			return notes;
		}),

	// Get single note
	getNote: protectedProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ input }) => {
			const note = await db
				.select()
				.from(schema.notes)
				.where(eq(schema.notes.id, input.id))
				.limit(1);
			return note[0] || null;
		}),

	// Increment download count
	trackDownload: protectedProcedure
		.input(z.object({ noteId: z.string() }))
		.handler(async ({ input }) => {
			await db
				.update(schema.notes)
				.set({
					downloadCount: sql`${schema.notes.downloadCount} + 1`,
				})
				.where(eq(schema.notes.id, input.noteId));
			return { success: true };
		}),
};
