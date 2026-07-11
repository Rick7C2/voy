import { describe, expect, test } from "vitest";
import {
	assertPublicSignUpEnabled,
	PUBLIC_SIGNUP_ROLE,
	PublicSignUpDisabledError,
} from "./signup-policy";

describe("assertPublicSignUpEnabled", () => {
	test("throws PublicSignUpDisabledError when registrationEnabled is false", () => {
		expect(() =>
			assertPublicSignUpEnabled({ registrationEnabled: false }),
		).toThrow(PublicSignUpDisabledError);
	});

	test("does not throw when registrationEnabled is true", () => {
		expect(() =>
			assertPublicSignUpEnabled({ registrationEnabled: true }),
		).not.toThrow();
	});
});

describe("PUBLIC_SIGNUP_ROLE", () => {
	test("is 'user' — public sign-ups must never mint admin accounts", () => {
		// A regression test: if this constant is ever widened the public
		// sign-up endpoint could hand out admin privileges to anyone.
		expect(PUBLIC_SIGNUP_ROLE).toBe("user");
	});
});
