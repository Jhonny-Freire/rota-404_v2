"use client";

import { useEffect, useMemo, useState } from "react";
import { useSeededRandom, useSequence } from "@/components/learning/kit";
import { MatchBoard } from "../_api/MatchBoard";
import { Banner, Live } from "../_api/parts";
import { EXTRA_LINES, MATCH_APPS, MATCH_SERVICES, type SceneProps } from "./model";
import { ApiWorld, SHOWN_STEP, type ApiWorldProps } from "../_api/World";

/*
 * Microinteração (.md): o aluno associa cada aplicativo ao serviço que poderia usar (clima → meteorológico; loja →
 * pagamento; mapa → mapas). Ao concluir, o sistema anima UMA das comunicações — a da loja ou a do mapa (a do clima já
 * apareceu nas cenas 1 a 3), sorteada por visita — e só então libera.
 */
export function SceneMatch(props: SceneProps) {
  const [stage, setStage] = useState<"match" | "play">("match");
  return stage === "match" ? <Match key="match" {...props} onDone={() => setStage("play")} /> : <Play key="play" {...props} />;
}

function Match({ say, setHint, reducedMotion, onDone }: SceneProps & { onDone: () => void }) {
  const rand = useSeededRandom(0, { salt: "g2-aula-1-1-servicos" });
  const pieces = useMemo(() => rand.shuffle(MATCH_SERVICES, "pool", true), [rand]);

  useEffect(() => {
    say(EXTRA_LINES.match, "thinking");
  }, [say]);

  return (
    <MatchBoard
      zones={MATCH_APPS}
      pieces={pieces}
      say={say}
      setHint={setHint}
      reducedMotion={reducedMotion}
      rightLine={EXTRA_LINES.matchRight}
      doneLine={EXTRA_LINES.matchDone}
      onDone={onDone}
      countText={(placed, total) => `Ligue os serviços: ${placed} de ${total}`}
    />
  );
}

const PLAY_STEPS = [700, 1000, 1000, 800, 800, 800, 1000, 1000, 1600].map((hold) => ({ hold }));

type Flow = { banner: string; hint: string; done: string; world: Omit<ApiWorldProps, "step" | "reducedMotion"> };

/* textos criados: as duas comunicações que ainda não tinham aparecido na aula */
const FLOWS: Flow[] = [
  {
    banner: "Loja e serviço de pagamento",
    hint: "Veja a loja usando o serviço de pagamento pela API.",
    done: "A loja mostrou que o pagamento foi aprovado pelo serviço de pagamento.",
    world: {
      appName: "Loja on-line",
      appIcon: "store",
      appCaption: "Teclado · R$ 120",
      appValue: "Pagamento aprovado",
      appEmpty: "Pagando...",
      serviceLabel: "Serviço de pagamento",
      serviceBadge: "card",
      requestLabel: "PAGAR R$ 120",
      requestAlt: "Pedido de pagamento de 120 reais",
      responseLabel: "APROVADO",
      responseAlt: "Resposta: pagamento aprovado",
      panelTitle: "Conferindo",
      panelRows: ["Cartão", "Valor"],
    },
  },
  {
    banner: "Mapa e serviço de mapas",
    hint: "Veja o app de mapas usando o serviço de mapas pela API.",
    done: "O app de mapas mostrou a rota calculada pelo serviço de mapas.",
    world: {
      appName: "App de mapas",
      appIcon: "map",
      appCaption: "Até o hotel",
      appValue: "Rota: 12 min",
      appEmpty: "?",
      serviceLabel: "Serviço de mapas",
      serviceBadge: "pin",
      requestLabel: "ROTA?",
      requestAlt: "Pedido da rota até o hotel",
      responseLabel: "12 MIN",
      responseAlt: "Resposta: rota de 12 minutos",
      panelTitle: "Calculando",
      panelRows: ["Origem", "Destino"],
    },
  },
];

function Play({ setCanAdvance, setHint, reducedMotion }: SceneProps) {
  const rand = useSeededRandom(0, { salt: "g2-aula-1-1-comunicacao" });
  const flow = useMemo(() => rand.pick(FLOWS, "fluxo"), [rand]);
  const { step } = useSequence(PLAY_STEPS, { reducedMotion, onDone: () => setCanAdvance(true) });

  useEffect(() => {
    setHint(flow.hint);
  }, [setHint, flow]);

  return (
    <>
      <Banner key={step >= SHOWN_STEP ? "ok" : "go"} text={step >= SHOWN_STEP ? "Comunicação completa!" : flow.banner} tone={step >= SHOWN_STEP ? "success" : "info"} icon={step >= SHOWN_STEP ? "ok" : "plug"} reducedMotion={reducedMotion} />
      <ApiWorld step={step} reducedMotion={reducedMotion} {...flow.world} />
      <Live text={step >= SHOWN_STEP ? flow.done : ""} />
    </>
  );
}
