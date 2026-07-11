import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { getContainer } from "@/server/container";
import { auth } from "@/server/infrastructure/auth";
import {
	getServerLogger,
	withLogContext,
} from "@/server/infrastructure/logging/logger";
import { createRequestContext } from "@/server/infrastructure/logging/request-context";

const signUpSchema = z.object({
	name: z.string().min(1, "Name is required"),
	email: z.email("Invalid email address"),
	password: z.string().min(8, "Password must be at least 8 characters"),
});

const logger = withLogContext({
	logger: getServerLogger(),
	bindings: {
		component: "public-signup-server-fn",
	},
});

export const getRegistrationStatus = createServerFn({ method: "GET" }).handler(
	async (): Promise<{ registrationEnabled: boolean }> => {
		const requestContext = createRequestContext({
			request: getRequest(),
			logger,
			operation: "serverfn.registration.status",
		});
		const container = await getContainer();
		const instanceConfig = await container.usecases.getInstanceConfig();
		requestContext.logger.info(
			{
				event: "serverfn.registration.status.completed",
				registrationEnabled: instanceConfig.registrationEnabled,
			},
			"Registration status fetched",
		);
		return { registrationEnabled: instanceConfig.registrationEnabled };
	},
);

export const publicSignUp = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => signUpSchema.parse(data))
	.handler(async ({ data }) => {
		const requestContext = createRequestContext({
			request: getRequest(),
			logger,
			operation: "serverfn.registration.signup",
		});

		const container = await getContainer();
		const instanceConfig = await container.usecases.getInstanceConfig();

		if (!instanceConfig.registrationEnabled) {
			requestContext.logger.warn(
				{
					event: "serverfn.registration.signup.disabled",
					email: data.email,
				},
				"Sign-up attempt while registration is disabled",
			);
			throw new Error("Registration is disabled");
		}

		// role hardcoded to "user"; the admin plugin's createUser endpoint
		// is used server-side so the emailAndPassword.disableSignUp flag
		// (which blocks the default HTTP endpoint) does not block us.
		await auth.api.createUser({
			body: {
				name: data.name,
				email: data.email,
				password: data.password,
				role: "user",
			},
		});

		// Auto-sign-in the new user so the client can navigate straight to /.
		await auth.api.signInEmail({
			body: {
				email: data.email,
				password: data.password,
			},
			headers: getRequest().headers,
		});

		requestContext.logger.info(
			{
				event: "serverfn.registration.signup.completed",
				email: data.email,
			},
			"Public sign-up completed",
		);
		return { success: true };
	});
