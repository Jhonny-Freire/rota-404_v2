import { Suspense } from "react";
import { PlanetScreen } from "@/components/learning/PlanetScreen";
import { AppShell } from "@/components/layout/AppShell";
import { StatusView } from "@/components/layout/StatusView";
import { planetParams } from "@/lib/staticParams";

export function generateStaticParams() {
  return planetParams("lesson");
}

export default function LessonPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <StatusView kind="loading" title="Preparando a aula" />
        </AppShell>
      }
    >
      <PlanetScreen kind="lesson" />
    </Suspense>
  );
}
