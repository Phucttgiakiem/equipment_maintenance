"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button, buttonClasses } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16">
      <div className="flex w-full max-w-sm flex-col gap-3">
        <Alert tone="danger">We could not load this page. Reload to try again.</Alert>
        <div className="flex items-center justify-center gap-2">
          <Button onClick={reset}>Reload</Button>
          <Link href="/" className={buttonClasses("secondary")}>
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
