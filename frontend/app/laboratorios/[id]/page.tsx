import { Suspense } from "react";
import { PlanetScreen } from "@/components/learning/PlanetScreen";
import { AppShell } from "@/components/layout/AppShell";
import { StatusView } from "@/components/layout/StatusView";
import { planetParams } from "@/lib/staticParams";

export function generateStaticParams() {
  return planetParams("lab");
}

export default function LabPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <StatusView kind="loading" title="Montando o laboratório" />
        </AppShell>
      }
    >
      <PlanetScreen kind="lab" />
    </Suspense>
  );
}
