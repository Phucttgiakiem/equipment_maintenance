import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { buttonClasses } from "@/components/ui/button";
import { ConfirmDeleteButton } from "@/components/ui/confirm-delete-button";
import { DataCard } from "@/components/ui/data-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PlusIcon } from "@/components/ui/icons";
import { PageContainer, PageHeader } from "@/components/ui/page";
import { listCategories } from "@/lib/categories/service";

export default async function AdminCategoriesPage() {
  const session = await auth();
  if (session?.user.role !== "admin") {
    redirect("/");
  }

  const categoryList = await listCategories();

  return (
    <PageContainer>
      <PageHeader
        title="Categories"
        actions={
          <Link href="/admin/categories/new" className={buttonClasses("primary")}>
            <PlusIcon className="h-4 w-4" />
            New category
          </Link>
        }
      />

      {categoryList.length === 0 ? (
        <EmptyState title="No categories yet" />
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-card border border-border bg-surface shadow-card md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-2 text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 text-xs font-medium">Name</th>
                  <th scope="col" className="px-4 py-3 text-xs font-medium">Created</th>
                  <th scope="col" className="px-4 py-3 text-xs font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {categoryList.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-2/60">
                    <td className="px-4 py-3 font-medium text-ink">{item.name}</td>
                    <td className="px-4 py-3 font-mono text-[13px] text-muted">
                      {item.createdAt.toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3.5">
                        <Link
                          href={`/admin/categories/${item.id}/edit`}
                          className="text-sm font-medium text-accent hover:underline"
                        >
                          Edit
                        </Link>
                        <ConfirmDeleteButton
                          endpoint={`/api/categories/${item.id}`}
                          title="Delete this category?"
                          confirmMessage={`Delete category "${item.name}"? This cannot be undone.`}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 md:hidden">
            {categoryList.map((item) => (
              <DataCard key={item.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="font-medium text-ink">{item.name}</div>
                  <div className="font-mono text-[13px] text-muted">
                    {item.createdAt.toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-3.5 border-t border-border pt-3">
                  <Link
                    href={`/admin/categories/${item.id}/edit`}
                    className="text-sm font-medium text-accent hover:underline"
                  >
                    Edit
                  </Link>
                  <ConfirmDeleteButton
                    endpoint={`/api/categories/${item.id}`}
                    title="Delete this category?"
                    confirmMessage={`Delete category "${item.name}"? This cannot be undone.`}
                  />
                </div>
              </DataCard>
            ))}
          </div>
        </>
      )}
    </PageContainer>
  );
}
