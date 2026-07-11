import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { auth } from "@/server/infrastructure/auth";
import {
	getServerLogger,
	withLogContext,
} from "@/server/infrastructure/logging/logger";
import { createRequestContext } from "@/server/infrastructure/logging/request-context";

const createUserSchema = z.object({
	name: z.string().min(1, "Name is required"),
	email: z.email("Invalid email address"),
	password: z.string().min(8, "Password must be at least 8 characters"),
});

const deleteUserSchema = z.object({
	userId: z.string().min(1, "User ID is required"),
});

const logger = withLogContext({
	logger: getServerLogger(),
	bindings: {
		component: "user-management-server-fn",
	},
});

interface ManagedUser {
	id: string;
	email: string;
	name: string;
	role: string;
	createdAt: string;
}

async function requireAdminSession() {
	const session = await auth.api.getSession({
		headers: getRequest().headers,
	});
	if (!session || session.user.role !== "admin") {
		throw new Error("Unauthorized: Admin access required");
	}
	return session;
}

export const listUsers = createServerFn({ method: "GET" }).handler(
	async (): Promise<ManagedUser[]> => {
		const requestContext = createRequestContext({
			request: getRequest(),
			logger,
			operation: "serverfn.users.list",
		});

		let session: Awaited<ReturnType<typeof requireAdminSession>>;
		try {
			session = await requireAdminSession();
		} catch (error) {
			requestContext.logger.warn(
				{ event: "serverfn.users.list.unauthorized" },
				"Unauthorized user list request",
			);
			throw error;
		}

		const result = await auth.api.listUsers({
			headers: getRequest().headers,
			query: { limit: 200 },
		});

		const users: ManagedUser[] = (result?.users ?? []).map((u) => ({
			id: u.id,
			email: u.email,
			name: u.name,
			role: (u.role as string | null) ?? "user",
			createdAt:
				u.createdAt instanceof Date
					? u.createdAt.toISOString()
					: String(u.createdAt ?? ""),
		}));

		requestContext.logger.info(
			{
				event: "serverfn.users.list.completed",
				actorId: session.user.id,
				count: users.length,
			},
			"Listed users",
		);
		return users;
	},
);

export const createUser = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => createUserSchema.parse(data))
	.handler(async ({ data }) => {
		const requestContext = createRequestContext({
			request: getRequest(),
			logger,
			operation: "serverfn.users.create",
		});

		let session: Awaited<ReturnType<typeof requireAdminSession>>;
		try {
			session = await requireAdminSession();
		} catch (error) {
			requestContext.logger.warn(
				{ event: "serverfn.users.create.unauthorized", email: data.email },
				"Unauthorized user creation request",
			);
			throw error;
		}

		// role hardcoded to "user" — admins created via this UI would be a
		// footgun; escalation should be a deliberate, separate action.
		const created = await auth.api.createUser({
			body: {
				name: data.name,
				email: data.email,
				password: data.password,
				role: "user",
			},
		});

		requestContext.logger.info(
			{
				event: "serverfn.users.create.completed",
				actorId: session.user.id,
				createdEmail: data.email,
			},
			"Created user",
		);
		return { success: true, user: created };
	});

export const deleteUser = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => deleteUserSchema.parse(data))
	.handler(async ({ data }) => {
		const requestContext = createRequestContext({
			request: getRequest(),
			logger,
			operation: "serverfn.users.delete",
		});

		let session: Awaited<ReturnType<typeof requireAdminSession>>;
		try {
			session = await requireAdminSession();
		} catch (error) {
			requestContext.logger.warn(
				{ event: "serverfn.users.delete.unauthorized" },
				"Unauthorized user deletion request",
			);
			throw error;
		}

		if (session.user.id === data.userId) {
			requestContext.logger.warn(
				{
					event: "serverfn.users.delete.self",
					actorId: session.user.id,
				},
				"Admin attempted to delete their own account",
			);
			throw new Error("You cannot delete your own account");
		}

		await auth.api.removeUser({
			body: { userId: data.userId },
			headers: getRequest().headers,
		});

		requestContext.logger.info(
			{
				event: "serverfn.users.delete.completed",
				actorId: session.user.id,
				deletedUserId: data.userId,
			},
			"Deleted user",
		);
		return { success: true };
	});
