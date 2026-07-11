// Pure business rules for the public sign-up flow.
//
// The server function that fronts this logic (`publicSignUp`) is a thin
// adapter around better-auth's admin plugin. Isolating the rules here
// keeps the security-critical checks unit-testable without mocking the
// better-auth transport layer.

import type { InstanceConfig } from "@/server/domain/value-objects";

/**
 * Role assigned to accounts that come in through the public sign-up
 * route. Exposed as a constant so tests can assert the exact value the
 * server function forwards to `auth.api.createUser`.
 */
export const PUBLIC_SIGNUP_ROLE = "user" as const;

export class PublicSignUpDisabledError extends Error {
	constructor() {
		super("Registration is disabled");
		this.name = "PublicSignUpDisabledError";
	}
}

/**
 * Throws if the instance has public sign-up turned off. Callers should
 * invoke this before touching the user store.
 */
export function assertPublicSignUpEnabled(config: InstanceConfig): void {
	if (!config.registrationEnabled) {
		throw new PublicSignUpDisabledError();
	}
}
