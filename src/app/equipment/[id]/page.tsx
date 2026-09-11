import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { buttonClasses } from "@/components/ui/button";
import { EquipmentStatusBadge } from "@/components/equipment/status-badge";
import { MaintenanceStatusBadge } from "@/components/maintenance/status-badge";
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

  const [maintenanceList, technicians] = await Promise.all([
    listMaintenanceRecords({ equipmentId: id }),
    listActiveTechnicians(),
  ]);
  const technicianNameById = new Map(technicians.map((t) => [t.id, t.name]));

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {equipment.name}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Code: {equipment.code}
            {equipment.category ? ` · ${equipment.category}` : ""}
            {equipment.location ? ` · ${equipment.location}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <EquipmentStatusBadge status={equipment.status} />
          {isAdmin ? (
            <Link href={`/equipment/${equipment.id}/edit`} className={buttonClasses("secondary")}>
              Edit
            </Link>
          ) : null}
        </div>
      </div>

      {equipment.notes ? (
        <p className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
          {equipment.notes}
        </p>
      ) : null}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Maintenance records
        </h2>
        {isAdmin ? (
          <Link
            href={`/equipment/${equipment.id}/maintenance/new`}
            className={buttonClasses("primary")}
          >
            New maintenance
          </Link>
        ) : null}
      </div>

      {maintenanceList.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          No maintenance records for this equipment yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Description</th>
                <th scope="col" className="px-4 py-3 font-medium">Type</th>
                <th scope="col" className="px-4 py-3 font-medium">Scheduled</th>
                <th scope="col" className="px-4 py-3 font-medium">Technician</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {maintenanceList.map((record) => (
                <tr key={record.id}>
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                    <Link href={`/maintenance/${record.id}`} className="hover:underline">
                      {record.description}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {record.type.replace(/_/g, " ")}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {record.scheduledDate.toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {record.technicianId
                      ? (technicianNameById.get(record.technicianId) ?? "Unassigned technician")
                      : "Unassigned"}
                  </td>
                  <td className="px-4 py-3">
                    <MaintenanceStatusBadge status={record.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
