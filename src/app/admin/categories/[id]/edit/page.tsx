import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { CategoryForm } from "@/components/categories/category-form";
import { getCategoryById } from "@/lib/categories/service";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (session?.user.role !== "admin") {
    redirect("/");
  }

  const { id } = await params;
  const category = await getCategoryById(id);
  if (!category) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-8">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Edit category
      </h1>
      <CategoryForm category={category} />
    </div>
  );
}
