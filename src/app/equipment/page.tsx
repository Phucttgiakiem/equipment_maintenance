import Link from "next/link";
import { auth } from "@/auth";
import { buttonClasses } from "@/components/ui/button";
import { CARD_CLASSES } from "@/components/ui/card";
import { DataCard } from "@/components/ui/data-card";
import { Input, Label, Select } from "@/components/ui/form-controls";
import { ConfirmDeleteButton } from "@/components/ui/confirm-delete-button";
import { EquipmentStatusBadge } from "@/components/equipment/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PlusIcon } from "@/components/ui/icons";
import { PageContainer, PageHeader } from "@/components/ui/page";
import { listCategories } from "@/lib/categories/service";
import { equipmentStatusValues } from "@/lib/equipment/schema";
import { listEquipment } from "@/lib/equipment/service";
import { buildFilterKey } from "@/lib/filters";

type EquipmentStatus = (typeof equipmentStatusValues)[number];

function isEquipmentStatus(value: string | undefined): value is EquipmentStatus {
  return !!value && (equipmentStatusValues as readonly string[]).includes(value);
}

export default async function EquipmentPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const session = await auth();
  const isAdmin = session?.user.role === "admin";

  const search = typeof params.search === "string" ? params.search : undefined;
  const statusParam = typeof params.status === "string" ? params.status : undefined;
  const categoryId = typeof params.categoryId === "string" ? params.categoryId : undefined;
  const status = isEquipmentStatus(statusParam) ? statusParam : undefined;
  const hasFilters = Boolean(search || status || categoryId);

  const [equipmentList, categories] = await Promise.all([
    listEquipment({ search, status, categoryId }),
    listCategories(),
  ]);
  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));
  const filterKey = buildFilterKey([search, status, categoryId]);

  return (
    <PageContainer>
      <PageHeader
        title="Equipment"
        actions={
          isAdmin ? (
            <Link href="/equipment/new" className={buttonClasses("primary")}>
              <PlusIcon className="h-4 w-4" />
              New equipment
            </Link>
          ) : undefined
        }
      />

      <form
        key={filterKey}
        method="get"
        className={`flex flex-wrap items-end gap-3 p-4 ${CARD_CLASSES}`}
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            name="search"
            type="text"
            defaultValue={search ?? ""}
            placeholder="Name or code"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" defaultValue={status ?? ""}>
            <option value="">All statuses</option>
            {equipmentStatusValues.map((value) => (
              <option key={value} value={value}>
                {value.replace(/_/g, " ")}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="categoryId">Category</Label>
          <Select id="categoryId" name="categoryId" defaultValue={categoryId ?? ""}>
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Select>
        </div>

        <button type="submit" className={buttonClasses("secondary")}>
          Apply filters
        </button>
        {hasFilters ? (
          <Link href="/equipment" className={buttonClasses("ghost")}>
            Clear Filters
          </Link>
        ) : null}
      </form>

      {equipmentList.length === 0 ? (
        <EmptyState
          title="No equipment matches these filters"
          description="Try a different search, or clear the filters to see everything."
        />
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-card border border-border bg-surface shadow-card md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-2 text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 text-xs font-medium">Code</th>
                  <th scope="col" className="px-4 py-3 text-xs font-medium">Name</th>
                  <th scope="col" className="px-4 py-3 text-xs font-medium">Category</th>
                  <th scope="col" className="px-4 py-3 text-xs font-medium">Location</th>
                  <th scope="col" className="px-4 py-3 text-xs font-medium">Status</th>
                  <th scope="col" className="px-4 py-3 text-xs font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {equipmentList.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-2/60">
                    <td className="px-4 py-3 font-mono text-[13px] text-muted">{item.code}</td>
                    <td className="px-4 py-3 font-medium text-ink">
                      <Link href={`/equipment/${item.id}`} className="hover:underline">
                        {item.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {item.categoryId ? (categoryNameById.get(item.categoryId) ?? "—") : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted">{item.location ?? "—"}</td>
                    <td className="px-4 py-3">
                      <EquipmentStatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3.5">
                        <Link
                          href={`/equipment/${item.id}`}
                          className="text-sm font-medium text-accent hover:underline"
                        >
                          View
                        </Link>
                        {isAdmin ? (
                          <>
                            <Link
                              href={`/equipment/${item.id}/edit`}
                              className="text-sm font-medium text-accent hover:underline"
                            >
                              Edit
                            </Link>
                            <ConfirmDeleteButton
                              endpoint={`/api/equipment/${item.id}`}
                              title="Delete equipment?"
                              confirmMessage={`This removes "${item.name}" and its maintenance history. This cannot be undone.`}
                            />
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 md:hidden">
            {equipmentList.map((item) => (
              <DataCard key={item.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/equipment/${item.id}`}
                      className="font-medium text-ink hover:underline"
                    >
                      {item.name}
                    </Link>
                    <div className="font-mono text-[13px] text-muted">{item.code}</div>
                  </div>
                  <EquipmentStatusBadge status={item.status} />
                </div>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-xs text-muted">Category</dt>
                    <dd className="text-ink">
                      {item.categoryId ? (categoryNameById.get(item.categoryId) ?? "—") : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Location</dt>
                    <dd className="text-ink">{item.location ?? "—"}</dd>
                  </div>
                </dl>
                <div className="flex items-center gap-3.5 border-t border-border pt-3">
                  <Link
                    href={`/equipment/${item.id}`}
                    className="text-sm font-medium text-accent hover:underline"
                  >
                    View
                  </Link>
                  {isAdmin ? (
                    <>
                      <Link
                        href={`/equipment/${item.id}/edit`}
                        className="text-sm font-medium text-accent hover:underline"
                      >
                        Edit
                      </Link>
                      <ConfirmDeleteButton
                        endpoint={`/api/equipment/${item.id}`}
                        title="Delete equipment?"
                        confirmMessage={`This removes "${item.name}" and its maintenance history. This cannot be undone.`}
                      />
                    </>
                  ) : null}
                </div>
              </DataCard>
            ))}
          </div>
        </>
      )}
    </PageContainer>
  );
}
