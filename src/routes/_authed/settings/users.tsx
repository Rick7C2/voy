import { createFileRoute, redirect } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { sessionQueryOptions } from "@/routes/_authed";
import { UsersSection } from "../-components/settings/users-section";

export const Route = createFileRoute("/_authed/settings/users")({
	beforeLoad: async ({ context }) => {
		const queryClient = context.queryClient;
		const session = await queryClient.ensureQueryData(sessionQueryOptions);

		if (session?.user.role !== "admin") {
			throw redirect({ to: "/settings" });
		}
	},
	head: () => ({
		meta: [{ title: "Users - Settings" }],
	}),
	component: UsersSettingsPage,
});

function UsersSettingsPage() {
	const { t } = useTranslation();

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-medium">{t("settings.users.title")}</h3>
				<p className="text-sm text-muted-foreground">
					{t("settings.users.description")}
				</p>
			</div>
			<UsersSection />
		</div>
	);
}
