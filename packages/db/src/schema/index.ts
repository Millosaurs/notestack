import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: integer("emailVerified", { mode: "boolean" })
		.notNull()
		.default(false),
	image: text("image"),
	createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
	username: text("username").unique(),
	displayUsername: text("displayUsername"),
	role: text("role").notNull().default("user"),
	banned: integer("banned", { mode: "boolean" }).default(false),
	banReason: text("banReason"),
	banExpires: integer("banExpires", { mode: "timestamp" }),
});

export const sessions = sqliteTable("session", {
	id: text("id").primaryKey(),
	expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
	token: text("token").notNull().unique(),
	createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
	ipAddress: text("ipAddress"),
	userAgent: text("userAgent"),
	userId: text("userId")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
});

export const accounts = sqliteTable("account", {
	id: text("id").primaryKey(),
	accountId: text("accountId").notNull(),
	providerId: text("providerId").notNull(),
	userId: text("userId")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	accessToken: text("accessToken"),
	refreshToken: text("refreshToken"),
	idToken: text("idToken"),
	accessTokenExpiresAt: integer("accessTokenExpiresAt", { mode: "timestamp" }),
	refreshTokenExpiresAt: integer("refreshTokenExpiresAt", {
		mode: "timestamp",
	}),
	scope: text("scope"),
	password: text("password"),
	createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const verifications = sqliteTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
	createdAt: integer("createdAt", { mode: "timestamp" }),
	updatedAt: integer("updatedAt", { mode: "timestamp" }),
});

// ============ NOTESTACK SCHEMA ============

export const subjects = sqliteTable("subject", {
	id: text("id").primaryKey(),
	code: text("code").notNull().unique(), // e.g., "CS101"
	name: text("name").notNull(), // e.g., "Data Structures"
	description: text("description"),
	createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
	createdBy: text("createdBy")
		.notNull()
		.references(() => users.id),
});

export const modules = sqliteTable("module", {
	id: text("id").primaryKey(),
	moduleNumber: integer("moduleNumber").notNull(), // e.g., 1, 2, 3
	name: text("name").notNull(), // e.g., "Arrays and Linked Lists"
	description: text("description"),
	subjectId: text("subjectId")
		.notNull()
		.references(() => subjects.id, { onDelete: "cascade" }),
	createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
	createdBy: text("createdBy")
		.notNull()
		.references(() => users.id),
});

export const notes = sqliteTable("note", {
	id: text("id").primaryKey(),
	name: text("name").notNull(), // e.g., "Lecture Notes Week 1"
	pdfUrl: text("pdfUrl").notNull(), // Google Drive or direct PDF link
	moduleId: text("moduleId")
		.notNull()
		.references(() => modules.id, { onDelete: "cascade" }),
	downloadCount: integer("downloadCount").notNull().default(0),
	createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
	createdBy: text("createdBy")
		.notNull()
		.references(() => users.id),
});
