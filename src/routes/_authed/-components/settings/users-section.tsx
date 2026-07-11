import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Trash2, UserCog } from "lucide-react";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/client/components/ui/alert-dialog";
import { Badge } from "@/client/components/ui/badge";
import { Button } from "@/client/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/client/components/ui/card";
import { Input } from "@/client/components/ui/input";
import { Label } from "@/client/components/ui/label";
import { Switch } from "@/client/components/ui/switch";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/client/components/ui/table";
import { useSettingsLayout } from "@/routes/_authed/settings";
import {
	createUser,
	deleteUser,
	listUsers,
} from "@/server/infrastructure/functions/user-management";

const usersQueryOptions = {
	queryKey: ["users"] as const,
	queryFn: () => listUsers(),
};

export function UsersSection() {
	const { t } = useTranslation();
	const { instanceConfig, handleInstanceConfigChange } = useSettingsLayout();

	const queryClient = useQueryClient();
	const { data: users, isLoading } = useQuery(usersQueryOptions);
	const createUserFn = useServerFn(createUser);
	const deleteUserFn = useServerFn(deleteUser);

	const nameId = useId();
	const emailId = useId();
	const passwordId = useId();
	const registrationSwitchId = useId();

	const [newName, setNewName] = useState("");
	const [newEmail, setNewEmail] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [isCreating, setIsCreating] = useState(false);
	const [pendingDelete, setPendingDelete] = useState<{
		id: string;
		email: string;
	} | null>(null);
	const [isDeleting, setIsDeleting] = useState<string | null>(null);

	const handleCreate = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newName.trim() || !newEmail.trim() || newPassword.length < 8) return;

		setIsCreating(true);
		try {
			await createUserFn({
				data: {
					name: newName.trim(),
					email: newEmail.trim(),
					password: newPassword,
				},
			});
			setNewName("");
			setNewEmail("");
			setNewPassword("");
			await queryClient.invalidateQueries({
				queryKey: usersQueryOptions.queryKey,
			});
			toast.success(t("settings.users.createSuccess"));
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: t("settings.users.createError"),
			);
		} finally {
			setIsCreating(false);
		}
	};

	const confirmDelete = async () => {
		if (!pendingDelete) return;
		const id = pendingDelete.id;
		setPendingDelete(null);
		setIsDeleting(id);
		try {
			await deleteUserFn({ data: { userId: id } });
			await queryClient.invalidateQueries({
				queryKey: usersQueryOptions.queryKey,
			});
			toast.success(t("settings.users.deleteSuccess"));
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: t("settings.users.deleteError"),
			);
		} finally {
			setIsDeleting(null);
		}
	};

	return (
		<section className="settings-section space-y-4">
			<Card className="settings-card">
				<CardHeader className="pb-2">
					<CardTitle className="text-sm font-medium">
						{t("settings.users.registrationTitle")}
					</CardTitle>
					<CardDescription className="text-xs">
						{t("settings.users.registrationDescription")}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-between gap-4">
						<Label
							htmlFor={registrationSwitchId}
							className="text-sm font-normal cursor-pointer"
						>
							{t("settings.users.registrationToggle")}
						</Label>
						<Switch
							id={registrationSwitchId}
							checked={instanceConfig?.registrationEnabled ?? false}
							onCheckedChange={(checked) =>
								handleInstanceConfigChange("registrationEnabled", checked)
							}
						/>
					</div>
				</CardContent>
			</Card>

			<Card className="settings-card">
				<CardHeader className="pb-2">
					<CardTitle className="text-sm font-medium">
						{t("settings.users.createTitle")}
					</CardTitle>
					<CardDescription className="text-xs">
						{t("settings.users.createDescription")}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleCreate} className="space-y-3">
						<div className="grid gap-3 md:grid-cols-3">
							<div className="space-y-1">
								<Label htmlFor={nameId} className="text-xs">
									{t("settings.users.name")}
								</Label>
								<Input
									id={nameId}
									value={newName}
									onChange={(e) => setNewName(e.target.value)}
									autoComplete="off"
									required
								/>
							</div>
							<div className="space-y-1">
								<Label htmlFor={emailId} className="text-xs">
									{t("settings.users.email")}
								</Label>
								<Input
									id={emailId}
									type="email"
									value={newEmail}
									onChange={(e) => setNewEmail(e.target.value)}
									autoComplete="off"
									required
								/>
							</div>
							<div className="space-y-1">
								<Label htmlFor={passwordId} className="text-xs">
									{t("settings.users.password")}
								</Label>
								<Input
									id={passwordId}
									type="password"
									value={newPassword}
									onChange={(e) => setNewPassword(e.target.value)}
									autoComplete="new-password"
									minLength={8}
									required
								/>
							</div>
						</div>
						<div className="flex justify-end">
							<Button type="submit" size="sm" disabled={isCreating}>
								<Plus className="h-4 w-4" />
								<span>
									{isCreating
										? t("settings.users.creating")
										: t("settings.users.create")}
								</span>
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			<Card className="settings-card">
				<CardHeader className="pb-2">
					<CardTitle className="text-sm font-medium">
						{t("settings.users.listTitle")}
					</CardTitle>
					<CardDescription className="text-xs">
						{t("settings.users.listDescription")}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<p className="text-sm text-muted-foreground">
							{t("common.loading")}
						</p>
					) : !users || users.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							{t("settings.users.empty")}
						</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{t("settings.users.name")}</TableHead>
									<TableHead>{t("settings.users.email")}</TableHead>
									<TableHead>{t("settings.users.role")}</TableHead>
									<TableHead className="w-[80px] text-right" />
								</TableRow>
							</TableHeader>
							<TableBody>
								{users.map((u) => (
									<TableRow key={u.id}>
										<TableCell className="font-medium">{u.name}</TableCell>
										<TableCell className="text-muted-foreground">
											{u.email}
										</TableCell>
										<TableCell>
											<Badge
												variant={u.role === "admin" ? "default" : "secondary"}
												className="gap-1"
											>
												{u.role === "admin" ? (
													<UserCog className="h-3 w-3" />
												) : null}
												{u.role}
											</Badge>
										</TableCell>
										<TableCell className="text-right">
											<Button
												type="button"
												size="sm"
												variant="ghost"
												disabled={isDeleting === u.id}
												onClick={() =>
													setPendingDelete({ id: u.id, email: u.email })
												}
												aria-label={t("settings.users.delete")}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			<AlertDialog
				open={pendingDelete !== null}
				onOpenChange={(open) => {
					if (!open) setPendingDelete(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("settings.users.deleteTitle")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("settings.users.deleteConfirm", {
								email: pendingDelete?.email ?? "",
							})}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
						<AlertDialogAction onClick={confirmDelete}>
							{t("settings.users.delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</section>
	);
}
