import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { buttonClasses } from "@/components/ui/button";
import { CARD_CLASSES } from "@/components/ui/card";
import { ConfirmDeleteButton } from "@/components/ui/confirm-delete-button";
import { DataCard } from "@/components/ui/data-card";
import { EquipmentStatusBadge } from "@/components/equipment/status-badge";
import { MaintenanceStatusBadge } from "@/components/maintenance/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PlusIcon } from "@/components/ui/icons";
import { PageContainer, PageHeader } from "@/components/ui/page";
import { OutlinePill } from "@/components/ui/status-badge";
import { getCategoryById } from "@/lib/categories/service";
import { getEquipmentById } from "@/lib/equipment/service";
import { listMaintenanceRecords } from "@/lib/maintenance/service";
import { listActiveTechnicians } from "@/lib/users/service";

export default async function EquipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const isAdmin = session?.user.role === "admin";

  const equipment = await getEquipmentById(id);
  if (!equipment) {
    notFound();
  }

  const [maintenanceList, technicians, category] = await Promise.all([
    listMaintenanceRecords({ equipmentId: id }),
    listActiveTechnicians(),
    equipment.categoryId ? getCategoryById(equipment.categoryId) : null,
  ]);
  const technicianNameById = new Map(technicians.map((t) => [t.id, t.name]));

  return (
    <PageContainer>
      <PageHeader
        back={{ href: "/equipment", label: "Equipment" }}
        title={equipment.name}
        meta={
          <>
            <span className="font-mono text-[13px] text-muted">{equipment.code}</span>
            <EquipmentStatusBadge status={equipment.status} />
          </>
        }
        actions={
          isAdmin ? (
            <>
              <Link href={`/equipment/${equipment.id}/edit`} className={buttonClasses("secondary")}>
                Edit
              </Link>
              <ConfirmDeleteButton
                variant="button"
                label="Delete"
                endpoint={`/api/equipment/${equipment.id}`}
                title="Delete equipment?"
                confirmMessage="This removes the item and its maintenance history. This cannot be undone."
                redirectTo="/equipment"
              />
            </>
          ) : undefined
        }
      />

      <dl className={`grid grid-cols-2 gap-x-6 gap-y-4 p-5 lg:grid-cols-4 ${CARD_CLASSES}`}>
        <div className="flex flex-col gap-1">
          <dt className="text-xs text-muted">Category</dt>
          <dd className="text-sm text-ink">{category?.name ?? "—"}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-xs text-muted">Location</dt>
          <dd className="text-sm text-ink">{equipment.location ?? "—"}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-xs text-muted">Purchase date</dt>
          <dd className="text-sm text-ink">
            {equipment.purchaseDate ? equipment.purchaseDate.toLocaleDateString() : "—"}
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-xs text-muted">Created</dt>
          <dd className="text-sm text-ink">{equipment.createdAt.toLocaleDateString()}</dd>
        </div>
        {equipment.notes ? (
          <div className="col-span-2 flex flex-col gap-1 lg:col-span-4">
            <dt className="text-xs text-muted">Notes</dt>
            <dd className="text-sm text-ink">{equipment.notes}</dd>
          </div>
        ) : null}
      </dl>

      <div id="maintenance-history" className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink">Maintenance history</h2>
        {isAdmin ? (
          <Link
            href={`/equipment/${equipment.id}/maintenance/new`}
            className={`${buttonClasses("primary")} h-8 px-3 text-[13px]`}
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Schedule maintenance
          </Link>
        ) : null}
      </div>

      {maintenanceList.length === 0 ? (
        <EmptyState title="No maintenance records yet" />
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-card border border-border bg-surface shadow-card md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-2 text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 text-xs font-medium">Scheduled</th>
                  <th scope="col" className="px-4 py-3 text-xs font-medium">Type</th>
                  <th scope="col" className="px-4 py-3 text-xs font-medium">Description</th>
                  <th scope="col" className="px-4 py-3 text-xs font-medium">Technician</th>
                  <th scope="col" className="px-4 py-3 text-xs font-medium">Status</th>
                  <th scope="col" className="px-4 py-3 text-xs font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {maintenanceList.map((record) => (
                  <tr key={record.id} className="hover:bg-surface-2/60">
                    <td className="px-4 py-3 font-mono text-[13px] text-muted">
                      {record.scheduledDate.toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <OutlinePill label={record.type.replace(/_/g, " ")} />
                    </td>
                    <td className="px-4 py-3 font-medium text-ink">
                      <Link href={`/maintenance/${record.id}`} className="hover:underline">
                        {record.description}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {record.technicianId
                        ? (technicianNameById.get(record.technicianId) ?? "Unassigned technician")
                        : "Unassigned"}
                    </td>
                    <td className="px-4 py-3">
                      <MaintenanceStatusBadge status={record.status} />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/maintenance/${record.id}`}
                        className="text-sm font-medium text-accent hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 md:hidden">
            {maintenanceList.map((record) => (
              <DataCard key={record.id}>
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/maintenance/${record.id}`}
                    className="font-medium text-ink hover:underline"
                  >
                    {record.description}
                  </Link>
                  <MaintenanceStatusBadge status={record.status} />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <OutlinePill label={record.type.replace(/_/g, " ")} />
                  <span className="font-mono text-[13px] text-muted">
                    {record.scheduledDate.toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                  <span className="text-sm text-muted">
                    {record.technicianId
                      ? (technicianNameById.get(record.technicianId) ?? "Unassigned technician")
                      : "Unassigned"}
                  </span>
                  <Link
                    href={`/maintenance/${record.id}`}
                    className="text-sm font-medium text-accent hover:underline"
                  >
                    View
                  </Link>
                </div>
              </DataCard>
            ))}
          </div>
        </>
      )}
    </PageContainer>
  );
}
