// Pure business rules for admin-scoped user management.
//
// Extracted from the `user-management.ts` server functions so that the
// role check, the self-delete refusal, and the role assigned to
// admin-created users can be unit-tested without spinning up
// better-auth or a request context.

/**
 * Role assigned to accounts created by an admin through the Users
 * settings page. Hardcoded so the admin UI can never mint another
 * administrator (a deliberate footgun mitigation — role escalation
 * should be a separate, explicit action).
 */
export const ADMIN_CREATED_USER_ROLE = "user" as const;

export class UnauthorizedAdminError extends Error {
	constructor() {
		super("Unauthorized: Admin access required");
		this.name = "UnauthorizedAdminError";
	}
}

export class SelfDeleteError extends Error {
	constructor() {
		super("You cannot delete your own account");
		this.name = "SelfDeleteError";
	}
}

/**
 * Minimal session shape the guards read. Matches the subset of the
 * better-auth session object we depend on so tests don't have to
 * fabricate the full type.
 */
export interface AdminSessionLike {
	user: {
		id: string;
		role?: string | null;
	};
}

/**
 * Throws unless the caller is an authenticated admin. Narrows the
 * session type on the happy path so downstream code can dereference
 * `session.user` without a null check.
 */
export function assertAdminSession(
	session: AdminSessionLike | null | undefined,
): asserts session is AdminSessionLike {
	if (!session || session.user.role !== "admin") {
		throw new UnauthorizedAdminError();
	}
}

/**
 * Throws if the target user id matches the caller's own id. Prevents
 * an admin from accidentally locking themselves out (or maliciously
 * removing the sole administrator).
 */
export function assertNotSelfDelete(
	session: AdminSessionLike,
	targetUserId: string,
): void {
	if (session.user.id === targetUserId) {
		throw new SelfDeleteError();
	}
}
