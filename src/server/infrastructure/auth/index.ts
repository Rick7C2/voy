import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { config } from "@/server/config";
import { db } from "@/server/infrastructure/persistence/drizzle/connection";

export const auth = betterAuth({
	appName: config.instance.name,
	baseURL: config.instance.url,
	database: drizzleAdapter(db, {
		provider: "sqlite",
	}),
	emailAndPassword: {
		enabled: true,
		autoSignIn: true,
		// Disable the default /api/auth/sign-up/email HTTP endpoint. Public
		// sign-ups go through our /signup route, which checks the runtime
		// `registrationEnabled` flag on the instance config and calls
		// `auth.api.createUser` server-side with role="user" hardcoded.
		// Setup / admin-created users continue to work via the admin plugin.
		disableSignUp: true,
		minPasswordLength: 8,
		maxPasswordLength: 128,
	},
	plugins: [
		tanstackStartCookies(),
		admin({
			defaultRole: "user",
			adminRoles: ["admin"],
		}),
	],
});
