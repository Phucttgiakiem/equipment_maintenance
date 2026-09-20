import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { ConfirmDeleteButton } from "@/components/ui/confirm-delete-button";
import { MaintenanceForm } from "@/components/maintenance/maintenance-form";
import { MaintenanceStatusBadge } from "@/components/maintenance/status-badge";
import { MaintenanceStepTracker } from "@/components/maintenance/step-tracker";
import { Card } from "@/components/ui/card";
import { OutlinePill } from "@/components/ui/status-badge";
import { PageContainer, PageHeader } from "@/components/ui/page";
import { getEquipmentById } from "@/lib/equipment/service";
import { getMaintenanceById } from "@/lib/maintenance/service";
import { listActiveTechnicians } from "@/lib/users/service";

export default async function MaintenanceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const record = await getMaintenanceById(id);
  if (!record) {
    notFound();
  }

  const [equipment, technicians] = await Promise.all([
    getEquipmentById(record.equipmentId),
    listActiveTechnicians(),
  ]);
  const isAdmin = session.user.role === "admin";
  const isAssignedTechnician = record.technicianId === session.user.id;
  const canEdit = isAdmin || isAssignedTechnician;
  const technicianName = record.technicianId
    ? (technicians.find((t) => t.id === record.technicianId)?.name ?? "Unassigned technician")
    : "Unassigned";

  return (
    <PageContainer>
      <PageHeader
        back={equipment ? { href: `/equipment/${equipment.id}`, label: equipment.name } : undefined}
        title={record.description}
        meta={
          <>
            {equipment ? (
              <span className="font-mono text-[13px] text-muted">
                {equipment.code} &middot; {equipment.name}
              </span>
            ) : null}
            <MaintenanceStatusBadge status={record.status} />
            <OutlinePill label={record.type.replace(/_/g, " ")} />
          </>
        }
        actions={
          isAdmin ? (
            <ConfirmDeleteButton
              variant="button"
              endpoint={`/api/maintenance/${record.id}`}
              title="Delete maintenance record?"
              confirmMessage="This removes the record from the equipment's history. This cannot be undone."
              redirectTo={equipment ? `/equipment/${equipment.id}` : "/equipment"}
            />
          ) : undefined
        }
      />

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className={`flex flex-col gap-5 p-5 ${canEdit ? "lg:col-span-3" : "lg:col-span-5"}`}>
          <h2 className="text-base font-semibold text-ink">Details</h2>
          <MaintenanceStepTracker status={record.status} />
          <dl className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted">Technician</dt>
              <dd className="text-sm text-ink">{technicianName}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted">Scheduled</dt>
              <dd className="font-mono text-[13px] text-ink">
                {record.scheduledDate.toLocaleDateString()}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted">Completed</dt>
              <dd className="font-mono text-[13px] text-ink">
                {record.completedDate ? record.completedDate.toLocaleDateString() : "—"}
              </dd>
            </div>
          </dl>
          {record.notes ? (
            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted">Notes</dt>
              <dd className="text-sm text-ink">{record.notes}</dd>
            </div>
          ) : null}
        </Card>

        {canEdit ? (
          <Card className="flex flex-col gap-4 p-5 lg:col-span-2">
            <h2 className="text-base font-semibold text-ink">Update</h2>
            {isAdmin ? (
              <MaintenanceForm
                mode="edit-full"
                equipmentId={record.equipmentId}
                technicians={technicians}
                record={record}
              />
            ) : (
              <MaintenanceForm mode="edit-self" record={record} />
            )}
          </Card>
        ) : null}
      </div>
    </PageContainer>
  );
}
