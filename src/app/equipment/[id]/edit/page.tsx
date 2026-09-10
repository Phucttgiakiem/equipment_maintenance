import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { EquipmentForm } from "@/components/equipment/equipment-form";
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
  const equipment = await getEquipmentById(id);
  if (!equipment) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-8">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Edit equipment
      </h1>
      <EquipmentForm equipment={equipment} />
    </div>
  );
}
