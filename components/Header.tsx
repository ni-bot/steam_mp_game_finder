"use client";

import { useTranslations, useLocale } from "next-intl";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface HeaderProps {
  onRefresh?: () => void;
  showRefresh?: boolean;
}

export function Header({ onRefresh, showRefresh }: HeaderProps) {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const { data: session } = useSession();

  const otherLocale = locale === "de" ? "en" : "de";
  const switchedPath = pathname.replace(`/${locale}`, `/${otherLocale}`);

  return (
    <header className="flex items-center justify-between border-b border-[var(--steam-border)] bg-[var(--steam-bg-dark)] px-6 py-4">
      <div>
        <h1 className="text-xl font-semibold text-[var(--steam-accent)]">
          {t("app.title")}
        </h1>
        <p className="text-sm text-[var(--steam-muted)]">{t("app.tagline")}</p>
      </div>

      <div className="flex items-center gap-4">
        {showRefresh && onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="rounded px-3 py-1.5 text-sm bg-[var(--steam-panel)] hover:bg-[var(--steam-hover)] transition-colors"
          >
            {t("nav.refresh")}
          </button>
        )}

        <Link
          href={switchedPath}
          className="text-sm text-[var(--steam-muted)] hover:text-[var(--steam-accent)]"
        >
          {otherLocale.toUpperCase()}
        </Link>

        {session?.user ? (
          <div className="flex items-center gap-3">
            {session.user.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt=""
                className="h-8 w-8 rounded"
              />
            )}
            <span className="text-sm">{session.user.name}</span>
            <button
              type="button"
              onClick={() => signOut()}
              className="rounded px-3 py-1.5 text-sm bg-[var(--steam-panel)] hover:bg-[var(--steam-hover)]"
            >
              {t("nav.signOut")}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              window.location.href = "/api/auth/steam";
            }}
            className="rounded bg-[#5c7e10] hover:bg-[#6a8f12] px-4 py-2 text-sm font-medium text-white transition-colors"
          >
            {t("nav.signIn")}
          </button>
        )}
      </div>
    </header>
  );
}
