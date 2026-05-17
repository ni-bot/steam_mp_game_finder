"use client";

import { useTranslations } from "next-intl";
import type { LibraryStatus } from "@/lib/steam/types";

const STATUS_STYLES: Record<LibraryStatus, string> = {
  ok: "bg-emerald-900/50 text-emerald-300 border-emerald-700",
  private: "bg-amber-900/50 text-amber-300 border-amber-700",
  error: "bg-red-900/50 text-red-300 border-red-700",
};

export function FriendStatusBadge({ status }: { status: LibraryStatus }) {
  const t = useTranslations("status");

  return (
    <span
      className={`inline-block rounded border px-2 py-0.5 text-xs ${STATUS_STYLES[status]}`}
    >
      {t(status)}
    </span>
  );
}
