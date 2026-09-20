import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { MaintenanceForm } from "@/components/maintenance/maintenance-form";
import { Card } from "@/components/ui/card";
import { PageContainer, PageHeader } from "@/components/ui/page";
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
    <PageContainer>
      <PageHeader
        title="New maintenance record"
        back={{ href: `/equipment/${equipment.id}`, label: equipment.name }}
      />
      <Card className="max-w-[760px] p-6">
        <MaintenanceForm mode="create" equipmentId={equipment.id} technicians={technicians} />
      </Card>
    </PageContainer>
  );
}
