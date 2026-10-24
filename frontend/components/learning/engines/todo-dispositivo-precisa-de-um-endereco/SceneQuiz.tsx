"use client";

import { useEffect, useMemo, useState } from "react";
import { Link, Place, lerpPoint, useSeededRandom, useTimers, type ScenePoint } from "@/components/learning/kit";
import { AddressForm } from "./AddressForm";
import { DeviceNode, Hub, Letter, Live, ip, type ArtKind, type SceneProps } from "./parts";

const PROMPT = "Envie a mensagem para o dispositivo da borda verde. Digite o IP dele.";
const SUCCESS = "Isso! A mensagem chegou ao endereço certo.";
const OTHER_DEVICE = "Esse IP é de outro dispositivo. Confira a borda verde.";
const NOWHERE = "Nenhum dispositivo tem esse endereço. Confira os números.";

/* instruções "O que fazer" (a inicial fica em meta.hints) */
const HINT_TYPED = "Confira o IP e toque em Enviar.";
const HINT_EMPTY = "Primeiro digite no campo Para: o IP do dispositivo com borda verde.";
const HINT_SENT = "Observe a mensagem seguir o endereço digitado.";
const HINT_OTHER = "Esse IP é de outro dispositivo. Digite o IP da borda verde.";
const HINT_NOWHERE = "Nenhum dispositivo tem esse IP. Confira os números e envie de novo.";
const HINT_SOLVED = "Isso! A mensagem chegou ao dispositivo da borda verde.";

const SENDER: ScenePoint = { x: 14, y: 22 };
const HOME: ScenePoint = { x: 28, y: 29 };
const HUB: ScenePoint = { x: 50, y: 40 };
const DEST_X = 79;
const ROWS = [14, 43, 72];
const KINDS: ArtKind[] = ["computer", "tablet", "cellphone"];
const LAST_OCTETS = [12, 17, 25, 33, 41, 48, 56, 64, 72, 87];

const LAUNCH_MS = 250;
const LEG_MS = 700;
const BACK_MS = 450;
const SETTLE_MS = 60;
const ERROR_HOLD_MS = 1300;
/**
 * Pausa de leitura entre o acerto e a liberação de "Concluir" (como READY_PAUSE_MS do S1): o shell leva o anel
 * e o FOCO para o botão quando a cena libera; antes disso o aluno vê a mensagem chegar e ouve o Bonzi.
 */
const READY_PAUSE_MS = 1400;

/** onde a mensagem está: junto do notebook, no ponto de encontro ou chegando ao destino (índice) */
type Spot = "home" | "hub" | number;
type Outcome = { kind: "right" | "other" | "nowhere"; dest: number | null };

/** "192.168.000.012" e "192,168,0,12" valem como 192.168.0.12; null se não tiver 4 números. */
export function normalizeIp(raw: string): string | null {
  const parts = raw.replace(/,/g, ".").replace(/\s+/g, "").split(".");
  if (parts.length !== 4 || parts.some((part) => !/^\d{1,3}$/.test(part))) return null;
  return parts.map((part) => String(Number(part))).join(".");
}

function cleanAddress(raw: string): string {
  return raw.replace(/,/g, ".").replace(/\s+/g, "").slice(0, 15);
}

/** Cena 5 — Microteste: enviar a mensagem ao dispositivo da borda verde digitando o IP correto. */
export function SceneQuiz({ say, setCanAdvance, setHint, reducedMotion }: SceneProps) {
  const rand = useSeededRandom(0, { salt: "aula-2-1-microteste" });
  const quiz = useMemo(() => {
    const octets = rand.shuffle(LAST_OCTETS, "ips").slice(0, KINDS.length);
    const devices = KINDS.map((kind, index) => {
      const at = { x: DEST_X, y: ROWS[index] };
      return { kind, ip: ip(octets[index]), at, landing: lerpPoint(HUB, at, 0.7) };
    });
    return { devices, target: rand.int(0, devices.length - 1, "target") };
  }, [rand]);
  const timers = useTimers({ reducedMotion });
  const [spot, setSpot] = useState<Spot>("home");
  const [moveMs, setMoveMs] = useState(LEG_MS);
  const [address, setAddress] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [solved, setSolved] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  /** depois de um erro, a etiqueta do destino pisca */
  const [markTarget, setMarkTarget] = useState(false);
  const [status, setStatus] = useState("");
  const animate = !reducedMotion;

  useEffect(() => {
    say(PROMPT, "thinking");
  }, [say]);

  const ready = () => {
    setBusy(false);
    setAddress(null);
    setMoveMs(LEG_MS);
  };

  const comeBack = (fromDevice: boolean) => {
    setOutcome(null);
    setMoveMs(BACK_MS);
    if (fromDevice) {
      setSpot("hub");
      timers.after(BACK_MS, () => setSpot("home"));
      timers.after(2 * BACK_MS + SETTLE_MS, ready);
    } else {
      setSpot("home");
      timers.after(BACK_MS + SETTLE_MS, ready);
    }
  };

  const fail = (result: Outcome, message: string) => {
    setOutcome(result);
    setMarkTarget(true);
    setStatus(message);
    say(message, "warning");
    setHint(result.kind === "other" ? HINT_OTHER : HINT_NOWHERE);
    timers.after(ERROR_HOLD_MS, () => comeBack(result.dest !== null), { hold: true });
  };

  const arrive = (dest: number) => {
    if (dest !== quiz.target) {
      fail({ kind: "other", dest }, OTHER_DEVICE);
      return;
    }
    setOutcome({ kind: "right", dest });
    setSolved(true);
    setBusy(false);
    setStatus(SUCCESS);
    say(SUCCESS, "happy");
    setHint(HINT_SOLVED);
    timers.after(READY_PAUSE_MS, () => setCanAdvance(true), { hold: true });
  };

  const send = (raw: string) => {
    if (busy || solved) return;
    const normalized = normalizeIp(raw);
    const dest = normalized ? quiz.devices.findIndex((device) => device.ip === normalized) : -1;
    const label = cleanAddress(raw);
    setBusy(true);
    setOutcome(null);
    setAddress(label);
    setMoveMs(LEG_MS);
    setSpot("home");
    setStatus(`Mensagem enviada para ${label}.`);
    setHint(HINT_SENT);
    timers.after(LAUNCH_MS, () => setSpot("hub"));
    if (dest >= 0) {
      timers.after(LAUNCH_MS + LEG_MS, () => setSpot(dest));
      timers.after(LAUNCH_MS + 2 * LEG_MS + SETTLE_MS, () => arrive(dest));
    } else {
      timers.after(LAUNCH_MS + LEG_MS + SETTLE_MS, () => fail({ kind: "nowhere", dest: null }, NOWHERE));
    }
  };

  /** campo vazio: volta para a instrução da cena; com texto: falta tocar em Enviar */
  const edit = (value: string) => setHint(value.trim() ? HINT_TYPED : null);

  /** tocou em Enviar sem digitar: lembrete na instrução "O que fazer" (sem fala, para não virar rajada) */
  const remindEmpty = () => setHint(HINT_EMPTY);

  const traveling = (busy || solved) && spot !== "home";
  const letterAt = spot === "home" ? HOME : spot === "hub" ? HUB : quiz.devices[spot].landing;

  return (
    <>
      <Link from={SENDER} to={HUB} state={traveling ? "active" : "idle"} />
      {quiz.devices.map((device, index) => (
        <Link key={device.ip} from={HUB} to={device.at} state={traveling && spot === index ? "active" : "idle"} />
      ))}
      <Hub at={HUB} active={traveling} />

      <DeviceNode kind="notebook" at={SENDER} scale={0.55} pop={animate} alt="Notebook que envia a mensagem" />
      {quiz.devices.map((device, index) => {
        const isTarget = index === quiz.target;
        return (
          <DeviceNode
            key={device.ip}
            kind={device.kind}
            at={device.at}
            scale={0.45}
            address={device.ip}
            target={isTarget}
            addressHighlighted={markTarget && !solved && isTarget}
            highlighted={solved && isTarget}
            correct={solved && isTarget}
            wrong={outcome?.kind === "other" && outcome.dest === index}
            dimmed={solved && !isTarget}
            pop={animate}
          />
        );
      })}

      <Letter
        at={letterAt}
        size={6}
        moveMs={reducedMotion ? 0 : moveMs}
        hidden={solved}
        address={address}
        wrong={outcome?.kind === "nowhere"}
      />

      {/* largura 60: no tablet em retrato o IP digitado e o botão Enviar cabem lado a lado; a linha até o
          aparelho de baixo passa acima do campo (y = 54 em x = 62) */}
      <Place x={2} y={57} anchor="top-left" width={60}>
        <AddressForm
          onSend={send}
          onEdit={edit}
          onEmpty={remindEmpty}
          busy={busy}
          solved={solved}
          wrong={outcome !== null && outcome.kind !== "right"}
        />
      </Place>

      <Live text={status} />
    </>
  );
}

export default SceneQuiz;
