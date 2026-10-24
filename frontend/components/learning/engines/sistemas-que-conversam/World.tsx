"use client";

import { ApiWorld } from "../_api/World";
import { CITY, TEMP } from "./model";

export { SHOWN_STEP } from "../_api/World";

/** Comunicação do app de clima com o serviço meteorológico (cenas 1 a 3 e o fim da Microinteração). */
export function WeatherWorld({ step, withApi = true, apiHighlighted = false, reducedMotion }: { step: number; withApi?: boolean; apiHighlighted?: boolean; reducedMotion: boolean }) {
  return (
    <ApiWorld
      step={step}
      withApi={withApi}
      reducedMotion={reducedMotion}
      appCaption={CITY}
      appValue={`${CITY} — ${TEMP}`}
      appEmpty="? °C"
      appNote={withApi ? undefined : "Sem dados atualizados"}
      serviceLabel="Serviço meteorológico"
      serviceBadge="weather"
      requestLabel="TEMPERATURA?"
      requestAlt="Pedido da temperatura de Osasco"
      responseLabel={TEMP}
      responseAlt={`Resposta: ${TEMP}`}
      panelRows={[CITY, "Temperatura"]}
      looks={{ api: { highlighted: apiHighlighted } }}
    />
  );
}
