import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { EquipmentForm } from "@/components/equipment/equipment-form";

export default async function NewEquipmentPage() {
  const session = await auth();
  if (session?.user.role !== "admin") {
    redirect("/equipment");
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-8">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        New equipment
      </h1>
      <EquipmentForm />
    </div>
  );
}
