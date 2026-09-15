import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { buttonClasses } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/form-controls";
import { RegistrationStatusBadge } from "@/components/users/registration-status-badge";
import { UserActionButton } from "@/components/users/user-action-button";
import { registrationStatusValues, userRoleValues } from "@/lib/users/schema";
import { listUsers } from "@/lib/users/service";

type RegistrationStatus = (typeof registrationStatusValues)[number];
type UserRole = (typeof userRoleValues)[number];

function isRegistrationStatus(value: string | undefined): value is RegistrationStatus {
  return !!value && (registrationStatusValues as readonly string[]).includes(value);
}

function isUserRole(value: string | undefined): value is UserRole {
  return !!value && (userRoleValues as readonly string[]).includes(value);
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (session?.user.role !== "admin") {
    redirect("/");
  }

  const params = await searchParams;
  const registrationStatusParam =
    typeof params.registrationStatus === "string" ? params.registrationStatus : undefined;
  const roleParam = typeof params.role === "string" ? params.role : undefined;
  const isActiveParam = typeof params.isActive === "string" ? params.isActive : undefined;

  const registrationStatus = isRegistrationStatus(registrationStatusParam)
    ? registrationStatusParam
    : undefined;
  const role = isUserRole(roleParam) ? roleParam : undefined;
  const isActive =
    isActiveParam === "true" ? true : isActiveParam === "false" ? false : undefined;

  const userList = await listUsers({ registrationStatus, role, isActive });

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-8">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Users</h1>

      <form
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div className="flex flex-col gap-1">
          <Label htmlFor="registrationStatus">Registration status</Label>
          <Select
            id="registrationStatus"
            name="registrationStatus"
            defaultValue={registrationStatus ?? ""}
          >
            <option value="">All statuses</option>
            {registrationStatusValues.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="role">Role</Label>
          <Select id="role" name="role" defaultValue={role ?? ""}>
            <option value="">All roles</option>
            {userRoleValues.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="isActive">Active</Label>
          <Select id="isActive" name="isActive" defaultValue={isActiveParam ?? ""}>
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </Select>
        </div>

        <button type="submit" className={buttonClasses("secondary")}>
          Apply filters
        </button>
        {registrationStatus || role || isActiveParam ? (
          <Link href="/admin/users" className={buttonClasses("secondary")}>
            Clear
          </Link>
        ) : null}
      </form>

      {userList.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          No users match your filters.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Name</th>
                <th scope="col" className="px-4 py-3 font-medium">Email</th>
                <th scope="col" className="px-4 py-3 font-medium">Role</th>
                <th scope="col" className="px-4 py-3 font-medium">Registration</th>
                <th scope="col" className="px-4 py-3 font-medium">Active</th>
                <th scope="col" className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {userList.map((item) => {
                const isSelf = item.id === session.user.id;
                return (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                      {item.name}
                      {isSelf ? " (you)" : ""}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{item.email}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{item.role}</td>
                    <td className="px-4 py-3">
                      <RegistrationStatusBadge status={item.registrationStatus} />
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {item.isActive ? "Active" : "Inactive"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {item.registrationStatus === "pending" ? (
                          <>
                            <UserActionButton
                              endpoint={`/api/users/${item.id}/approve`}
                              label="Approve"
                              pendingLabel="Approving..."
                              variant="primary"
                            />
                            <UserActionButton
                              endpoint={`/api/users/${item.id}/reject`}
                              label="Reject"
                              pendingLabel="Rejecting..."
                              variant="danger"
                              confirmMessage={`Reject the registration for "${item.name}"?`}
                            />
                          </>
                        ) : null}
                        {item.registrationStatus === "approved" && !isSelf ? (
                          item.isActive ? (
                            <UserActionButton
                              endpoint={`/api/users/${item.id}/deactivate`}
                              label="Deactivate"
                              pendingLabel="Deactivating..."
                              variant="danger"
                              confirmMessage={`Deactivate "${item.name}"?`}
                            />
                          ) : (
                            <UserActionButton
                              endpoint={`/api/users/${item.id}/activate`}
                              label="Activate"
                              pendingLabel="Activating..."
                              variant="primary"
                            />
                          )
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
