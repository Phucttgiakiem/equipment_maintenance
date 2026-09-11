import Link from "next/link";
import { EquipmentStatusBadge } from "@/components/equipment/status-badge";
import { MaintenanceStatusBadge } from "@/components/maintenance/status-badge";
import { equipmentStatusValues } from "@/lib/equipment/schema";
import { maintenanceStatusValues, maintenanceTypeValues } from "@/lib/maintenance/schema";
import {
  getEquipmentStatistics,
  getMaintenanceStatistics,
  getRecentActivity,
} from "@/lib/dashboard/service";

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

export default async function DashboardPage() {
  const [equipmentStats, maintenanceStats, recentActivity] = await Promise.all([
    getEquipmentStatistics(),
    getMaintenanceStatistics(),
    getRecentActivity(),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-8">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Dashboard</h1>

      <div className="grid gap-6 sm:grid-cols-2">
        <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Equipment</h2>
            <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              {equipmentStats.total}
            </span>
          </div>
          <ul className="mt-4 flex flex-col gap-2">
            {equipmentStatusValues.map((status) => (
              <li key={status} className="flex items-center justify-between text-sm">
                <EquipmentStatusBadge status={status} />
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {equipmentStats.byStatus[status]}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Maintenance</h2>
            <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              {maintenanceStats.total}
            </span>
          </div>
          <ul className="mt-4 flex flex-col gap-2">
            {maintenanceStatusValues.map((status) => (
              <li key={status} className="flex items-center justify-between text-sm">
                <MaintenanceStatusBadge status={status} />
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {maintenanceStats.byStatus[status]}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t border-zinc-200 pt-3 dark:border-zinc-800">
            <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              By type
            </h3>
            <ul className="mt-2 flex flex-col gap-1">
              {maintenanceTypeValues.map((type) => (
                <li
                  key={type}
                  className="flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400"
                >
                  <span className="capitalize">{formatLabel(type)}</span>
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    {maintenanceStats.byType[type]}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-zinc-200 dark:border-zinc-800">
        <h2 className="border-b border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-900 dark:border-zinc-800 dark:text-zinc-50">
          Recent activity
        </h2>
        {recentActivity.length === 0 ? (
          <p className="p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            No maintenance activity yet.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {recentActivity.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
              >
                <div className="flex flex-col">
                  <Link
                    href={`/maintenance/${item.id}`}
                    className="font-medium text-zinc-900 hover:underline dark:text-zinc-50"
                  >
                    {item.equipmentName}
                  </Link>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {formatLabel(item.type)} &middot; updated {item.updatedAt.toLocaleString()}
                  </span>
                </div>
                <MaintenanceStatusBadge status={item.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
