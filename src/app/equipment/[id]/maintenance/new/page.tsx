import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { MaintenanceForm } from "@/components/maintenance/maintenance-form";
import { getEquipmentById } from "@/lib/equipment/service";
import { listActiveTechnicians } from "@/lib/users/service";

export default async function NewMaintenancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (session?.user.role !== "admin") {
    redirect("/equipment");
  }

  const { id } = await params;
  const equipment = await getEquipmentById(id);
  if (!equipment) {
    notFound();
  }

  const technicians = await listActiveTechnicians();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-8">
      <div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{equipment.name}</p>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          New maintenance record
        </h1>
      </div>
      <MaintenanceForm mode="create" equipmentId={equipment.id} technicians={technicians} />
    </div>
  );
}
