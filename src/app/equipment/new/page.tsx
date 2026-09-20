import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { EquipmentForm } from "@/components/equipment/equipment-form";
import { Card } from "@/components/ui/card";
import { PageContainer, PageHeader } from "@/components/ui/page";
import { listCategories } from "@/lib/categories/service";

export default async function NewEquipmentPage() {
  const session = await auth();
  if (session?.user.role !== "admin") {
    redirect("/equipment");
  }

  const categories = await listCategories();

  return (
    <PageContainer>
      <PageHeader title="New equipment" back={{ href: "/equipment", label: "Equipment" }} />
      <Card className="max-w-[760px] p-6">
        <EquipmentForm categories={categories} />
      </Card>
    </PageContainer>
  );
}
