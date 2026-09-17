import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CategoryForm } from "@/components/categories/category-form";

export default async function NewCategoryPage() {
  const session = await auth();
  if (session?.user.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-8">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        New category
      </h1>
      <CategoryForm />
    </div>
  );
}
