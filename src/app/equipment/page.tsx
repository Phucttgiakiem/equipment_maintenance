import Link from "next/link";
import { auth } from "@/auth";
import { buttonClasses } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/form-controls";
import { ConfirmDeleteButton } from "@/components/ui/confirm-delete-button";
import { EquipmentStatusBadge } from "@/components/equipment/status-badge";
import { equipmentStatusValues } from "@/lib/equipment/schema";
import { listEquipment } from "@/lib/equipment/service";

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
  const category = typeof params.category === "string" ? params.category : undefined;
  const status = isEquipmentStatus(statusParam) ? statusParam : undefined;

  const equipmentList = await listEquipment({ search, status, category });

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Equipment
        </h1>
        {isAdmin ? (
          <Link href="/equipment/new" className={buttonClasses("primary")}>
            New equipment
          </Link>
        ) : null}
      </div>

      <form
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div className="flex flex-col gap-1">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            name="search"
            type="text"
            defaultValue={search ?? ""}
            placeholder="Name or code"
          />
        </div>

        <div className="flex flex-col gap-1">
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

        <div className="flex flex-col gap-1">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            name="category"
            type="text"
            defaultValue={category ?? ""}
            placeholder="Category"
          />
        </div>

        <button type="submit" className={buttonClasses("secondary")}>
          Apply filters
        </button>
        {search || status || category ? (
          <Link href="/equipment" className={buttonClasses("secondary")}>
            Clear
          </Link>
        ) : null}
      </form>

      {equipmentList.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          No equipment matches your filters.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Name</th>
                <th scope="col" className="px-4 py-3 font-medium">Code</th>
                <th scope="col" className="px-4 py-3 font-medium">Category</th>
                <th scope="col" className="px-4 py-3 font-medium">Location</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
                {isAdmin ? <th scope="col" className="px-4 py-3 font-medium">Actions</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {equipmentList.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                    <Link href={`/equipment/${item.id}`} className="hover:underline">
                      {item.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{item.code}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {item.category ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {item.location ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <EquipmentStatusBadge status={item.status} />
                  </td>
                  {isAdmin ? (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/equipment/${item.id}/edit`}
                          className="text-sm font-medium text-zinc-700 hover:underline dark:text-zinc-300"
                        >
                          Edit
                        </Link>
                        <ConfirmDeleteButton
                          endpoint={`/api/equipment/${item.id}`}
                          confirmMessage={`Delete equipment "${item.name}"? This cannot be undone.`}
                        />
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
