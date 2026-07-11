import { createFileRoute, getRouteApi, redirect } from "@tanstack/react-router";
import { GalleryVerticalEndIcon } from "lucide-react";
import { SignUpForm } from "@/routes/signup/-components/signup-form";
import { getRegistrationStatus } from "@/server/infrastructure/functions/public-signup";
import { getSetupStatus } from "@/server/infrastructure/functions/setup";

const rootRoute = getRouteApi("__root__");

export const Route = createFileRoute("/signup")({
	loader: async () => {
		const { setupRequired } = await getSetupStatus();
		if (setupRequired) {
			throw redirect({ to: "/setup" });
		}

		const { registrationEnabled } = await getRegistrationStatus();
		if (!registrationEnabled) {
			throw redirect({ to: "/login", search: { redirect: undefined } });
		}

		return { registrationEnabled };
	},
	head: () => ({
		meta: [{ title: "Sign Up" }],
	}),
	component: SignUpPage,
});

function SignUpPage() {
	const { instanceName } = rootRoute.useLoaderData();

	return (
		<div className="grid min-h-svh lg:grid-cols-2">
			<div className="flex flex-col gap-4 p-6 md:p-10">
				<div className="flex justify-center gap-2 md:justify-start">
					<a href="/" className="flex items-center gap-2 font-medium">
						<div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
							<GalleryVerticalEndIcon className="size-4" />
						</div>
						{instanceName}
					</a>
				</div>
				<div className="flex flex-1 items-center justify-center">
					<div className="w-full max-w-xs">
						<SignUpForm />
					</div>
				</div>
			</div>
			<div className="bg-muted relative hidden lg:block">
				<img
					src="/light.jpg"
					alt="Sign-up page background"
					className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
				/>
			</div>
		</div>
	);
}
