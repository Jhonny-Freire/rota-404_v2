"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { createPortal } from "react-dom";

type PortalTargetsValue = { stage: HTMLElement | null; interaction: HTMLElement | null };

const PortalContext = createContext<PortalTargetsValue>({ stage: null, interaction: null });

export function PortalTargets({
  stage,
  interaction,
  children,
}: {
  stage: HTMLElement | null;
  interaction: HTMLElement | null;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ stage, interaction }), [stage, interaction]);
  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

/** Renderiza os filhos no palco 16:9 do laboratório. */
export function Stage({ children }: { children: ReactNode }) {
  const { stage } = useContext(PortalContext);
  return stage ? createPortal(children, stage) : null;
}

/** Renderiza os filhos no painel "Área de interação" do laboratório. */
export function Interaction({ children }: { children: ReactNode }) {
  const { interaction } = useContext(PortalContext);
  return interaction ? createPortal(children, interaction) : null;
}
