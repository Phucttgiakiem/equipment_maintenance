import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { EquipmentForm } from "@/components/equipment/equipment-form";
import { Card } from "@/components/ui/card";
import { PageContainer, PageHeader } from "@/components/ui/page";
import { listCategories } from "@/lib/categories/service";
import { getEquipmentById } from "@/lib/equipment/service";

export default async function EditEquipmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (session?.user.role !== "admin") {
    redirect("/equipment");
  }

  const { id } = await params;
  const [equipment, categories] = await Promise.all([
    getEquipmentById(id),
    listCategories(),
  ]);
  if (!equipment) {
    notFound();
  }

  return (
    <PageContainer>
      <PageHeader
        title="Edit equipment"
        back={{ href: `/equipment/${equipment.id}`, label: equipment.name }}
      />
      <Card className="max-w-[760px] p-6">
        <EquipmentForm equipment={equipment} categories={categories} />
      </Card>
    </PageContainer>
  );
}
