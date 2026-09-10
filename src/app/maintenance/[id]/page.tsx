import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { ConfirmDeleteButton } from "@/components/ui/confirm-delete-button";
import { MaintenanceForm } from "@/components/maintenance/maintenance-form";
import { MaintenanceStatusBadge } from "@/components/maintenance/status-badge";
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

  const equipment = await getEquipmentById(record.equipmentId);
  const isAdmin = session.user.role === "admin";
  const isAssignedTechnician = record.technicianId === session.user.id;

  const technicians = isAdmin ? await listActiveTechnicians() : [];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-8">
      <div className="flex items-start justify-between">
        <div>
          {equipment ? (
            <Link
              href={`/equipment/${equipment.id}`}
              className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
            >
              {equipment.name}
            </Link>
          ) : null}
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Maintenance record
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <MaintenanceStatusBadge status={record.status} />
          {isAdmin ? (
            <ConfirmDeleteButton
              endpoint={`/api/maintenance/${record.id}`}
              confirmMessage="Delete this maintenance record? This cannot be undone."
              redirectTo={equipment ? `/equipment/${equipment.id}` : "/equipment"}
            />
          ) : null}
        </div>
      </div>

      {isAdmin ? (
        <MaintenanceForm mode="edit-full" equipmentId={record.equipmentId} technicians={technicians} record={record} />
      ) : isAssignedTechnician ? (
        <MaintenanceForm mode="edit-self" record={record} />
      ) : (
        <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6 text-sm dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-zinc-900 dark:text-zinc-50">{record.description}</p>
          <dl className="grid grid-cols-2 gap-4 text-zinc-600 dark:text-zinc-400">
            <div>
              <dt className="font-medium text-zinc-900 dark:text-zinc-50">Type</dt>
              <dd>{record.type.replace(/_/g, " ")}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-900 dark:text-zinc-50">Scheduled date</dt>
              <dd>{record.scheduledDate.toLocaleDateString()}</dd>
            </div>
          </dl>
          {record.notes ? <p>{record.notes}</p> : null}
        </div>
      )}
    </div>
  );
}
