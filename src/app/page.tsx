import Link from "next/link";
import { MaintenanceStatusBadge } from "@/components/maintenance/status-badge";
import { Card } from "@/components/ui/card";
import { DataCard } from "@/components/ui/data-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageContainer, PageHeader } from "@/components/ui/page";
import { equipmentStatusValues } from "@/lib/equipment/schema";
import { maintenanceStatusValues, maintenanceTypeValues } from "@/lib/maintenance/schema";
import {
  getEquipmentStatistics,
  getMaintenanceStatistics,
  getRecentActivity,
} from "@/lib/dashboard/service";

const EQUIPMENT_STATUS_LABELS: Record<string, string> = {
  operational: "Operational",
  under_maintenance: "Under maintenance",
  out_of_service: "Out of service",
  retired: "Retired",
};

const STATUS_BAR_CLASSES: Record<string, string> = {
  scheduled: "bg-[#1F4A8A] dark:bg-[#9CC3F5]",
  in_progress: "bg-[#7A4A00] dark:bg-[#F2C15B]",
  completed: "bg-[#17602B] dark:bg-[#8FD6A0]",
  cancelled: "bg-[#4A463E] dark:bg-[#B8BAB3]",
};

const TYPE_BAR_CLASSES: Record<string, string> = {
  preventive: "bg-[#1F4A8A] dark:bg-[#9CC3F5]",
  corrective: "bg-[#7A4A00] dark:bg-[#F2C15B]",
  inspection: "bg-[#4A463E] dark:bg-[#B8BAB3]",
};

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

function timeAgo(date: Date) {
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

function BreakdownRow({
  label,
  count,
  total,
  barClassName,
}: {
  label: string;
  count: number;
  total: number;
  barClassName: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="capitalize text-ink">{label}</span>
        <span className="font-mono text-[13px] text-muted">{count}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
        <div className={`h-full rounded-full ${barClassName}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const [equipmentStats, maintenanceStats, recentActivity] = await Promise.all([
    getEquipmentStatistics(),
    getMaintenanceStatistics(),
    getRecentActivity(),
  ]);

  return (
    <PageContainer>
      <PageHeader title="Dashboard" />

      <div className="flex flex-col gap-3">
        <div className="font-mono text-[11px] uppercase tracking-wider text-muted">Equipment</div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <Card className="flex flex-col gap-1 px-5 py-4">
            <span className="text-[13px] text-muted">Total</span>
            <span className="font-mono text-[28px] font-medium leading-9 text-ink">
              {equipmentStats.total}
            </span>
          </Card>
          {equipmentStatusValues.map((status) => (
            <Card key={status} className="flex flex-col gap-1 px-5 py-4">
              <span className="text-[13px] text-muted">{EQUIPMENT_STATUS_LABELS[status]}</span>
              <span className="font-mono text-[28px] font-medium leading-9 text-ink">
                {equipmentStats.byStatus[status]}
              </span>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col gap-4 p-5">
          <h2 className="text-base font-semibold text-ink">Maintenance by status</h2>
          <div className="flex flex-col gap-4">
            {maintenanceStatusValues.map((status) => (
              <BreakdownRow
                key={status}
                label={formatLabel(status)}
                count={maintenanceStats.byStatus[status]}
                total={maintenanceStats.total}
                barClassName={STATUS_BAR_CLASSES[status]}
              />
            ))}
          </div>
        </Card>

        <Card className="flex flex-col gap-4 p-5">
          <h2 className="text-base font-semibold text-ink">Maintenance by type</h2>
          <div className="flex flex-col gap-4">
            {maintenanceTypeValues.map((type) => (
              <BreakdownRow
                key={type}
                label={formatLabel(type)}
                count={maintenanceStats.byType[type]}
                total={maintenanceStats.total}
                barClassName={TYPE_BAR_CLASSES[type]}
              />
            ))}
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-ink">Recent activity</h2>
        {recentActivity.length === 0 ? (
          <EmptyState title="No maintenance activity yet" />
        ) : (
          <>
            <div className="hidden overflow-x-auto rounded-card border border-border bg-surface shadow-card md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-2 text-muted">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-xs font-medium">Code</th>
                    <th scope="col" className="px-4 py-3 text-xs font-medium">Equipment</th>
                    <th scope="col" className="px-4 py-3 text-xs font-medium">Status</th>
                    <th scope="col" className="hidden px-4 py-3 text-xs font-medium lg:table-cell">
                      Technician
                    </th>
                    <th scope="col" className="px-4 py-3 text-xs font-medium">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentActivity.map((item) => (
                    <tr key={item.id} className="hover:bg-surface-2/60">
                      <td className="px-4 py-3 font-mono text-[13px] text-muted">
                        {item.equipmentCode}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/maintenance/${item.id}`}
                          className="font-medium text-ink hover:underline"
                        >
                          {item.equipmentName}
                        </Link>
                        <div className="text-xs capitalize text-muted">
                          {formatLabel(item.type)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <MaintenanceStatusBadge status={item.status} />
                      </td>
                      <td className="hidden px-4 py-3 text-muted lg:table-cell">
                        {item.technicianName ?? "Unassigned"}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted">{timeAgo(item.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 md:hidden">
              {recentActivity.map((item) => (
                <DataCard key={item.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/maintenance/${item.id}`}
                        className="font-medium text-ink hover:underline"
                      >
                        {item.equipmentName}
                      </Link>
                      <div className="font-mono text-[13px] text-muted">{item.equipmentCode}</div>
                    </div>
                    <MaintenanceStatusBadge status={item.status} />
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-border pt-3 text-sm">
                    <span className="text-muted">{item.technicianName ?? "Unassigned"}</span>
                    <span className="text-xs text-muted">{timeAgo(item.updatedAt)}</span>
                  </div>
                </DataCard>
              ))}
            </div>
          </>
        )}
      </div>
    </PageContainer>
  );
}
