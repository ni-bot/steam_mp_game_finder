import { setRequestLocale } from "next-intl/server";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { AppShell } from "@/components/AppShell";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <SessionProvider>
      <AppShell />
    </SessionProvider>
  );
}
