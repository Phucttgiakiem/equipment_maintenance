import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { CategoryForm } from "@/components/categories/category-form";
import { Card } from "@/components/ui/card";
import { PageContainer, PageHeader } from "@/components/ui/page";
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
    <PageContainer>
      <PageHeader title="Edit category" back={{ href: "/admin/categories", label: "Categories" }} />
      <Card className="max-w-[480px] p-6">
        <CategoryForm category={category} />
      </Card>
    </PageContainer>
  );
}
