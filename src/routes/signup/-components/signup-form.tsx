import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Button } from "@/client/components/ui/button";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "@/client/components/ui/field";
import { Input } from "@/client/components/ui/input";
import { cn } from "@/client/utils";
import { sessionQueryOptions } from "@/routes/_authed";
import { publicSignUp } from "@/server/infrastructure/functions/public-signup";

const signUpSchema = z.object({
	name: z.string().min(1, "Name is required"),
	email: z.email("Invalid email address"),
	password: z.string().min(8, "Password must be at least 8 characters"),
});

export function SignUpForm({
	className,
	...props
}: React.ComponentProps<"form">) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const publicSignUpFn = useServerFn(publicSignUp);
	const [error, setError] = useState<string | null>(null);
	const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
	const nameId = useId();
	const emailId = useId();
	const passwordId = useId();

	const form = useForm({
		defaultValues: {
			name: "",
			email: "",
			password: "",
		},
		validators: {
			onChange: signUpSchema,
		},
		onSubmit: async ({ value }) => {
			setError(null);
			try {
				await publicSignUpFn({ data: value });
			} catch (err) {
				setError(err instanceof Error ? err.message : t("common.genericError"));
				return;
			}

			await queryClient.invalidateQueries({
				queryKey: sessionQueryOptions.queryKey,
			});

			navigate({ to: "/", replace: true });
		},
	});

	return (
		<form
			className={cn("flex flex-col gap-6", className)}
			onSubmit={(e) => {
				e.preventDefault();
				setHasAttemptedSubmit(true);
				form.handleSubmit();
			}}
			{...props}
		>
			<FieldGroup>
				<div className="flex flex-col items-center gap-1 text-center">
					<h1 className="text-2xl font-bold">{t("signup.title")}</h1>
					<p className="text-muted-foreground text-sm text-balance">
						{t("signup.subtitle")}
					</p>
				</div>

				{error && (
					<div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm text-center">
						{error}
					</div>
				)}

				<form.Field name="name">
					{(field) => (
						<Field>
							<FieldLabel htmlFor={nameId}>{t("signup.name")}</FieldLabel>
							<Input
								id={nameId}
								type="text"
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								autoComplete="name"
								required
							/>
							{hasAttemptedSubmit && field.state.meta.errors?.[0] && (
								<FieldDescription className="text-destructive">
									{field.state.meta.errors[0].message}
								</FieldDescription>
							)}
						</Field>
					)}
				</form.Field>

				<form.Field name="email">
					{(field) => (
						<Field>
							<FieldLabel htmlFor={emailId}>{t("signup.email")}</FieldLabel>
							<Input
								id={emailId}
								type="email"
								placeholder="m@example.com"
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								autoComplete="email"
								required
							/>
							{hasAttemptedSubmit && field.state.meta.errors?.[0] && (
								<FieldDescription className="text-destructive">
									{field.state.meta.errors[0].message}
								</FieldDescription>
							)}
						</Field>
					)}
				</form.Field>

				<form.Field name="password">
					{(field) => (
						<Field>
							<FieldLabel htmlFor={passwordId}>
								{t("signup.password")}
							</FieldLabel>
							<Input
								id={passwordId}
								type="password"
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								autoComplete="new-password"
								minLength={8}
								required
							/>
							{hasAttemptedSubmit && field.state.meta.errors?.[0] && (
								<FieldDescription className="text-destructive">
									{field.state.meta.errors[0].message}
								</FieldDescription>
							)}
						</Field>
					)}
				</form.Field>

				<Field>
					<form.Subscribe selector={(state) => state.isSubmitting}>
						{(isSubmitting) => (
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting ? t("signup.creating") : t("signup.submit")}
							</Button>
						)}
					</form.Subscribe>
					<div className="text-center text-sm text-muted-foreground">
						{t("signup.haveAccount")}{" "}
						<Link
							to="/login"
							search={{ redirect: undefined }}
							className="text-primary underline-offset-4 hover:underline"
						>
							{t("signup.loginLink")}
						</Link>
					</div>
				</Field>
			</FieldGroup>
		</form>
	);
}
