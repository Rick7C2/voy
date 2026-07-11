import { describe, expect, test } from "vitest";
import {
	ADMIN_CREATED_USER_ROLE,
	assertAdminSession,
	assertNotSelfDelete,
	SelfDeleteError,
	UnauthorizedAdminError,
} from "./admin-policy";

describe("assertAdminSession", () => {
	test("throws when session is null", () => {
		expect(() => assertAdminSession(null)).toThrow(UnauthorizedAdminError);
	});

	test("throws when session is undefined", () => {
		expect(() => assertAdminSession(undefined)).toThrow(UnauthorizedAdminError);
	});

	test("throws when the user has no role", () => {
		expect(() =>
			assertAdminSession({ user: { id: "u1", role: null } }),
		).toThrow(UnauthorizedAdminError);
	});

	test("throws when the user has a non-admin role", () => {
		expect(() =>
			assertAdminSession({ user: { id: "u1", role: "user" } }),
		).toThrow(UnauthorizedAdminError);
	});

	test("does not throw when the user role is 'admin'", () => {
		expect(() =>
			assertAdminSession({ user: { id: "u1", role: "admin" } }),
		).not.toThrow();
	});
});

describe("assertNotSelfDelete", () => {
	test("throws SelfDeleteError when target id matches caller id", () => {
		expect(() =>
			assertNotSelfDelete({ user: { id: "u1", role: "admin" } }, "u1"),
		).toThrow(SelfDeleteError);
	});

	test("does not throw when target id differs from caller id", () => {
		expect(() =>
			assertNotSelfDelete({ user: { id: "u1", role: "admin" } }, "u2"),
		).not.toThrow();
	});
});

describe("ADMIN_CREATED_USER_ROLE", () => {
	test("is 'user' — the Users settings page must never mint admins", () => {
		// A regression test: if this constant is ever widened, an admin
		// could grant admin rights through the standard "Add user" form.
		expect(ADMIN_CREATED_USER_ROLE).toBe("user");
	});
});
