import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { buttonClasses } from "@/components/ui/button";
import { ConfirmDeleteButton } from "@/components/ui/confirm-delete-button";
import { listCategories } from "@/lib/categories/service";

export default async function AdminCategoriesPage() {
  const session = await auth();
  if (session?.user.role !== "admin") {
    redirect("/");
  }

  const categoryList = await listCategories();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Categories
        </h1>
        <Link href="/admin/categories/new" className={buttonClasses("primary")}>
          New category
        </Link>
      </div>

      {categoryList.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          No categories yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Name</th>
                <th scope="col" className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {categoryList.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                    {item.name}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/categories/${item.id}/edit`}
                        className="text-sm font-medium text-zinc-700 hover:underline dark:text-zinc-300"
                      >
                        Edit
                      </Link>
                      <ConfirmDeleteButton
                        endpoint={`/api/categories/${item.id}`}
                        confirmMessage={`Delete category "${item.name}"? This cannot be undone.`}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
