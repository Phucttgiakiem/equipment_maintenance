import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CategoryForm } from "@/components/categories/category-form";
import { Card } from "@/components/ui/card";
import { PageContainer, PageHeader } from "@/components/ui/page";

export default async function NewCategoryPage() {
  const session = await auth();
  if (session?.user.role !== "admin") {
    redirect("/");
  }

  return (
    <PageContainer>
      <PageHeader title="New category" back={{ href: "/admin/categories", label: "Categories" }} />
      <Card className="max-w-[480px] p-6">
        <CategoryForm />
      </Card>
    </PageContainer>
  );
}
