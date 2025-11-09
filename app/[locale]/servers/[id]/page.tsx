'use client';

import { useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ServerDetailView } from "@/components/mcp/server-detail-view";
import { useBreadcrumbs } from "@/components/layout/breadcrumb-provider";
import { useServerStore, useConnectionStore } from "@/lib/stores";
import { ArrowLeft } from "lucide-react";

type PageParams = {
  locale: string;
  id: string;
};

type PageProps = {
  params: PageParams;
};

export default function ServerDetailPage({ params }: PageProps) {
  const { id } = params;
  const locale = useLocale();
  const router = useRouter();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { servers } = useServerStore();
  const { connections } = useConnectionStore();
  const t = useTranslations("servers.detail");
  const nav = useTranslations("common.navigation");

  const server = servers.find((s) => s.id === id);
  const connectionState = connections[id];

  useEffect(() => {
    if (server) {
      setBreadcrumbs([
        { label: nav("dashboard"), href: "/" },
        { label: server.name },
      ]);
    }
  }, [server, nav, setBreadcrumbs]);

  if (!server) {
    return (
      <div className="w-full py-4 md:py-8 px-3 md:px-6">
        <div className="text-center">
          <h1 className="text-xl md:text-2xl font-bold mb-4">{t("notFound.title")}</h1>
          <p className="text-muted-foreground mb-6 text-sm md:text-base">
            {t("notFound.description")}
          </p>
          <Button onClick={() => router.push("/", { locale })}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("notFound.cta")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-4 md:py-8 px-3 md:px-6">
      <ServerDetailView server={server} connectionState={connectionState} />
    </div>
  );
}
