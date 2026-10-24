"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { ROUTES } from "@/config/routes";
import { forgetParked } from "@/components/space/useRouteTravel";
import { useSession } from "@/hooks/useSession";

/** Páginas abertas sem conta: a capa e a tela de entrar. */
const PUBLIC_PATHS = new Set<string>([ROUTES.home, ROUTES.login]);

/** "Finalizar viagem" sai da conta: a saída seguinte leva para a capa, e não para /entrar. */
let exiting = false;

export function exitToHome() {
  exiting = true;
}

/**
 * Login obrigatório: sem sessão, qualquer outra página manda para /entrar (e volta para ela depois). Quem acabou de
 * sair da conta (ou de jogar sem conta) não deixa a página para a próxima pessoa: /entrar sem "voltar" e a nave
 * esquece onde parou em cada mapa.
 */
export function SessionGate({ children }: { children: ReactNode }) {
  const { status } = useSession();
  // no site estático (Render, trailingSlash) o caminho vem com "/" no fim: "/entrar/"
  const pathname = (usePathname() ?? ROUTES.home).replace(/(.)\/+$/, "$1");
  const router = useRouter();
  const open = PUBLIC_PATHS.has(pathname);
  const blocked = !open && (status === "loading" || status === "signed-out");
  const wasAboard = useRef(false);

  useEffect(() => {
    if (status === "signed-in" || status === "guest") {
      wasAboard.current = true;
      return;
    }
    if (status !== "signed-out") return;
    const left = wasAboard.current;
    if (left) {
      wasAboard.current = false;
      forgetParked();
    }
    if (open) {
      exiting = false;
      return;
    }
    if (exiting) {
      router.replace(ROUTES.home);
      return;
    }
    if (left) {
      router.replace(ROUTES.login);
      return;
    }
    const back = `${window.location.pathname}${window.location.search}`;
    router.replace(`${ROUTES.login}?voltar=${encodeURIComponent(back)}`);
  }, [open, status, router]);

  return blocked ? null : <>{children}</>;
}

export default SessionGate;
