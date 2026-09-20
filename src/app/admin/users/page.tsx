import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { buttonClasses } from "@/components/ui/button";
import { CARD_CLASSES } from "@/components/ui/card";
import { DataCard } from "@/components/ui/data-card";
import { Label, Select } from "@/components/ui/form-controls";
import { RegistrationStatusBadge } from "@/components/users/registration-status-badge";
import { ResetPasswordButton } from "@/components/users/reset-password-button";
import { UserActionButton } from "@/components/users/user-action-button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageContainer, PageHeader } from "@/components/ui/page";
import { OutlinePill, StatusBadge } from "@/components/ui/status-badge";
import { buildFilterKey } from "@/lib/filters";
import { registrationStatusValues, userRoleValues } from "@/lib/users/schema";
import { listUsers } from "@/lib/users/service";

type RegistrationStatus = (typeof registrationStatusValues)[number];
type UserRole = (typeof userRoleValues)[number];
type UserRow = Awaited<ReturnType<typeof listUsers>>[number];

function isRegistrationStatus(value: string | undefined): value is RegistrationStatus {
  return !!value && (registrationStatusValues as readonly string[]).includes(value);
}

function isUserRole(value: string | undefined): value is UserRole {
  return !!value && (userRoleValues as readonly string[]).includes(value);
}

const ACCESS_CLASSES = {
  active: "bg-[#DFF0E3] text-[#17602B] dark:bg-[#1F3A27] dark:text-[#8FD6A0]",
  inactive: "bg-[#E7E5DF] text-[#4A463E] dark:bg-[#2C2F2D] dark:text-[#B8BAB3]",
};

function UserRowActions({ item, isSelf }: { item: UserRow; isSelf: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-3.5">
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
            confirmMessage={`"${item.name}" will not be able to sign in.`}
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
            confirmMessage={`They can no longer sign in. You can activate "${item.name}" again later.`}
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
      {!isSelf ? <ResetPasswordButton userId={item.id} userName={item.name} /> : null}
    </div>
  );
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
  const hasFilters = Boolean(registrationStatus || role || isActiveParam);

  const userList = await listUsers({ registrationStatus, role, isActive });
  const filterKey = buildFilterKey([registrationStatus, role, isActiveParam]);

  return (
    <PageContainer>
      <PageHeader title="Users" />

      <form
        key={filterKey}
        method="get"
        className={`flex flex-wrap items-end gap-3 p-4 ${CARD_CLASSES}`}
      >
        <div className="flex flex-col gap-1.5">
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

        <div className="flex flex-col gap-1.5">
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

        <div className="flex flex-col gap-1.5">
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
        {hasFilters ? (
          <Link href="/admin/users" className={buttonClasses("ghost")}>
            Clear Filters
          </Link>
        ) : null}
      </form>

      {userList.length === 0 ? (
        <EmptyState
          title="No users match these filters"
          description="Try a different search, or clear the filters to see everything."
        />
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-card border border-border bg-surface shadow-card md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-2 text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 text-xs font-medium">User</th>
                  <th scope="col" className="px-4 py-3 text-xs font-medium">Role</th>
                  <th scope="col" className="px-4 py-3 text-xs font-medium">Registration</th>
                  <th scope="col" className="px-4 py-3 text-xs font-medium">Access</th>
                  <th scope="col" className="px-4 py-3 text-xs font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {userList.map((item) => {
                  const isSelf = item.id === session.user.id;
                  return (
                    <tr key={item.id} className="hover:bg-surface-2/60">
                      <td className="px-4 py-3">
                        <div className="font-medium text-ink">
                          {item.name}
                          {isSelf ? " (you)" : ""}
                        </div>
                        <div className="text-xs text-muted">{item.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <OutlinePill label={item.role} />
                      </td>
                      <td className="px-4 py-3">
                        <RegistrationStatusBadge status={item.registrationStatus} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          label={item.isActive ? "Active" : "Inactive"}
                          className={
                            item.isActive ? ACCESS_CLASSES.active : ACCESS_CLASSES.inactive
                          }
                        />
                      </td>
                      <td className="px-4 py-3">
                        <UserRowActions item={item} isSelf={isSelf} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 md:hidden">
            {userList.map((item) => {
              const isSelf = item.id === session.user.id;
              return (
                <DataCard key={item.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-ink">
                        {item.name}
                        {isSelf ? " (you)" : ""}
                      </div>
                      <div className="text-xs text-muted">{item.email}</div>
                    </div>
                    <OutlinePill label={item.role} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <RegistrationStatusBadge status={item.registrationStatus} />
                    <StatusBadge
                      label={item.isActive ? "Active" : "Inactive"}
                      className={item.isActive ? ACCESS_CLASSES.active : ACCESS_CLASSES.inactive}
                    />
                  </div>
                  <div className="border-t border-border pt-3">
                    <UserRowActions item={item} isSelf={isSelf} />
                  </div>
                </DataCard>
              );
            })}
          </div>
        </>
      )}
    </PageContainer>
  );
}
