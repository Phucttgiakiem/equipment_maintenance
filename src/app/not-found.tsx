import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16">
      <div className="flex w-full max-w-sm flex-col items-center gap-4">
        <EmptyState
          title="Not found"
          description="This item does not exist or may have been removed."
        />
        <Link href="/" className={buttonClasses("secondary")}>
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
