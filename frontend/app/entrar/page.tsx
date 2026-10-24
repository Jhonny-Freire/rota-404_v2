"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import type { BonziBuddyProps } from "@/components/bonzi/BonziBuddy";
import { AvatarPicker } from "@/components/avatar/AvatarPicker";
import { Avatar } from "@/components/avatar/Avatar";
import { AppShell } from "@/components/layout/AppShell";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { Sprite } from "@/components/ui/Sprite";
import { SpriteButton } from "@/components/ui/SpriteButton";
import { cx } from "@/components/ui/cx";
import { AVATARS, ELEMENTS, ROCKET_FRAMES, SPRITES, galaxySprite } from "@/config/assets";
import { ROUTES } from "@/config/routes";
import { DEFAULT_EXPLORER } from "@/hooks/useExplorer";
import { useSession } from "@/hooks/useSession";
import { goesToAdvancedGalaxy } from "@/lib/galaxyTrack";
import { getErrorMessage, isServiceDown } from "@/services/apiClient";
import type { KnowledgeLevel } from "@/types/domain";
import styles from "./page.module.css";

type Mode = "login" | "signup";

const NICKNAME_MAX = 16;
const PASSWORD_MAX = 64;

const LEVELS: { id: KnowledgeLevel; name: string; detail: string }[] = [
  { id: "iniciante", name: "Estou começando", detail: "Quase nunca mexi com isso" },
  { id: "intermediario", name: "Já sei um pouco", detail: "Conheço o básico" },
  { id: "avancado", name: "Já manjo bastante", detail: "Quero ir mais fundo" },
];

/* o Bonzi fica à esquerda, embaixo do cartão: à direita ele cobria o botão "Criar conta e embarcar" */
const BONZI: Record<Mode, BonziBuddyProps> = {
  signup: {
    state: "speaking",
    message: "Oi! Para embarcar, crie sua conta com um apelido, uma senha e a sua idade, e me conte o quanto já sabe de tecnologia: é isso que escolhe o seu universo!",
    position: "bottom-left",
  },
  login: { state: "happy", message: "Que bom te ver de novo! Digite seu apelido e sua senha.", position: "bottom-left" },
};

/** Universo pelo nível e pela idade (a regra do servidor, mostrada na ficha enquanto a criança preenche). */
function universeFor(age: number | null, level: KnowledgeLevel | null): { name: string; galaxy: string } | null {
  if (age === null || age < 4 || age > 120 || !level) return null;
  return goesToAdvancedGalaxy(age, level)
    ? { name: "API REST", galaxy: "api-rest" }
    : { name: "Internet e Web", galaxy: "internet-e-web" };
}

/** Volta para a página que pediu o login (só caminhos internos). */
function backTarget(): string {
  const back = new URLSearchParams(window.location.search).get("voltar");
  return back && back.startsWith("/") && !back.startsWith("//") && back !== ROUTES.login ? back : ROUTES.galaxies;
}

function parseAge(raw: string): number | null {
  const age = Number(raw);
  return raw.trim() && Number.isInteger(age) ? age : null;
}

/** Etapa numerada do cadastro (1, 2, 3): título curto e o conteúdo dela. */
function Step({ number, title, children, className }: { number: number; title: string; children: ReactNode; className?: string }) {
  return (
    <section className={cx(styles.step, className)} aria-label={`Etapa ${number}: ${title}`}>
      <h2 className={styles.stepTitle}>
        <span className={styles.stepNumber} aria-hidden="true">
          {number}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const ids = useId();
  const { status, user, signup, login, playAsGuest, logout } = useSession();
  const [mode, setMode] = useState<Mode>("signup");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState("");
  const [avatar, setAvatar] = useState(DEFAULT_EXPLORER.avatarSlug);
  const [level, setLevel] = useState<KnowledgeLevel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [busy, setBusy] = useState(false);

  // quem já tem conta neste aparelho costuma voltar a ela: abre direto em "Entrar"
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("voltar")) setMode("login");
  }, []);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
  };

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    if (busy) return;
    const name = nickname.trim();
    if (!name || !password) {
      setError("Preencha o apelido e a senha.");
      return;
    }
    const years = parseAge(age);
    if (mode === "signup" && years === null) {
      setError("Digite a sua idade em anos (só números).");
      return;
    }
    if (mode === "signup" && !level) {
      setError("Escolha o quanto você já sabe de tecnologia.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (mode === "signup") await signup({ nickname: name, password, age: years!, avatar_key: avatar, knowledge_level: level! });
      else await login({ nickname: name, password });
      router.replace(backTarget());
    } catch (err) {
      setOffline(isServiceDown(err));
      setError(isServiceDown(err) ? "O servidor de contas não respondeu." : getErrorMessage(err));
      setBusy(false);
    }
  };

  const guest = async () => {
    const years = parseAge(age);
    if (years === null || years < 4 || years > 120) {
      setError("Para jogar sem conta, digite a sua idade.");
      return;
    }
    await playAsGuest(years, avatar, mode === "signup" ? level : null);
    router.replace(backTarget());
  };

  // depois de entrar (busy continua true até a navegação), o formulário fica na tela: o cartão "Você já entrou"
  // aparecia por um instante antes de ir para o mapa
  if (status === "signed-in" && user && !busy) {
    return (
      <AppShell variant="immersive" bonzi={{ state: "happy", message: `Você já está a bordo, ${user.nickname}!` }}>
        <div className={styles.page}>
          <PixelPanel title="Você já entrou" className={styles.signedInPanel}>
            <div className={styles.signedIn}>
              <Avatar slug={user.avatar_key ?? DEFAULT_EXPLORER.avatarSlug} size={96} framed />
              <p className={styles.welcome}>
                Conta: <strong>{user.nickname}</strong>
              </p>
              <div className={styles.signedInActions}>
                <SpriteButton sprite={SPRITES.ui.play} label="Continuar viagem" href={ROUTES.galaxies} variant="primary" size={26} />
                <SpriteButton sprite={SPRITES.ui.close} label="Sair da conta" onClick={() => void logout()} size={22} />
              </div>
            </div>
          </PixelPanel>
        </div>
      </AppShell>
    );
  }

  const signupMode = mode === "signup";
  const universe = universeFor(parseAge(age), level);
  const avatarName = AVATARS.find((option) => option.slug === avatar)?.name ?? "";
  const levelName = LEVELS.find((option) => option.id === level)?.name;

  /** no login, cada campo ganha um ícone à esquerda (no cadastro, os campos ficam lado a lado e sem ícone) */
  const withIcon = (icon: ReactNode, input: ReactNode) =>
    signupMode ? (
      input
    ) : (
      <span className={styles.inputRow}>
        <span className={styles.inputIcon} aria-hidden="true">
          {icon}
        </span>
        {input}
      </span>
    );

  const nicknameField = (
    <div className={styles.field}>
      <label htmlFor={`${ids}-nick`} className={styles.label}>
        Apelido
      </label>
      {withIcon(
        <Sprite src={SPRITES.ui.profile} alt="" decorative size={32} />,
        <input
          id={`${ids}-nick`}
          className={styles.input}
          value={nickname}
          maxLength={NICKNAME_MAX}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          placeholder={signupMode ? "Ex.: Cometa" : undefined}
          aria-describedby={signupMode ? `${ids}-nick-hint` : undefined}
          onChange={(e) => setNickname(e.target.value)}
        />,
      )}
      {signupMode && (
        <span id={`${ids}-nick-hint`} className={styles.hint}>
          De 3 a 16 letras. Aparece no ranking: não use seu nome completo.
        </span>
      )}
    </div>
  );

  const passwordField = (
    <div className={styles.field}>
      <label htmlFor={`${ids}-pass`} className={styles.label}>
        Senha
      </label>
      {withIcon(
        <Sprite src={ELEMENTS.key} alt="" decorative size={42} height={24} />,
        <input
          id={`${ids}-pass`}
          type="password"
          className={styles.input}
          value={password}
          maxLength={PASSWORD_MAX}
          autoComplete={signupMode ? "new-password" : "current-password"}
          aria-describedby={signupMode ? `${ids}-pass-hint` : undefined}
          onChange={(e) => setPassword(e.target.value)}
        />,
      )}
      {signupMode && (
        <span id={`${ids}-pass-hint`} className={styles.hint}>
          Pelo menos 4 caracteres. Não use a senha de outro site.
        </span>
      )}
    </div>
  );

  return (
    <AppShell variant="immersive" bonzi={BONZI[mode]} fit>
      <div className={cx(styles.page, signupMode ? styles.pageSignup : styles.pageLogin)}>
        {/* cartão de embarque: a ficha se monta enquanto a criança preenche (no login, a tripulação e a rota) */}
        <aside className={styles.ticket} aria-label="Cartão de embarque">
          <Sprite src={SPRITES.brand.logoBar} alt="Rota 404" size={314} height={62} className={styles.logo} />
          {signupMode ? (
            <div className={styles.card}>
              <span className={styles.cardKicker}>Cartão de embarque</span>
              <Avatar slug={avatar} size={128} framed className={styles.cardAvatar} />
              <strong className={cx(styles.cardName, !nickname.trim() && styles.cardEmpty)}>
                {nickname.trim() || "Seu apelido"}
              </strong>
              <span className={styles.cardRole}>{avatarName}</span>
              <dl className={styles.cardRows}>
                <div>
                  <dt>Universo</dt>
                  <dd>
                    {universe ? (
                      <>
                        <Sprite src={galaxySprite(universe.galaxy)} alt="" decorative size={28} />
                        {universe.name}
                      </>
                    ) : (
                      <span className={styles.cardEmpty}>Idade e nível</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Nível</dt>
                  <dd>{levelName ?? <span className={styles.cardEmpty}>Escolha abaixo</span>}</dd>
                </div>
              </dl>
            </div>
          ) : (
            <div className={cx(styles.card, styles.welcomeCard)}>
              <span className={styles.cardKicker}>Bem-vindo de volta</span>
              {/* a tripulação (todos os personagens) flutuando, cada um no seu tempo */}
              <ul className={styles.crew} aria-hidden="true">
                {AVATARS.map((option, i) => (
                  <li key={option.slug} className={styles.crewMember} style={{ "--i": i } as CSSProperties}>
                    <Avatar slug={option.slug} size={64} label="" />
                  </li>
                ))}
              </ul>
              <p className={styles.cardText}>A tripulação está esperando! Entre para continuar a viagem de onde parou.</p>
              {/* a rota: da galáxia 1 até a galáxia 2, com a nave no caminho */}
              <span className={styles.route} aria-hidden="true">
                <Sprite src={galaxySprite("internet-e-web")} alt="" decorative size={100} height={96} />
                <span className={styles.routeTrail}>
                  <Sprite src={ROCKET_FRAMES[0]} alt="" decorative size={30} height={50} className={styles.routeRocket} />
                </span>
                <Sprite src={galaxySprite("api-rest")} alt="" decorative size={104} height={98} />
              </span>
            </div>
          )}
        </aside>

        <div className={styles.main}>
          <div className={styles.tabs} role="group" aria-label="Escolha como entrar">
            <button
              type="button"
              className={cx(styles.tab, signupMode && styles.tabActive)}
              aria-pressed={signupMode}
              onClick={() => switchMode("signup")}
            >
              Criar conta
            </button>
            <button
              type="button"
              className={cx(styles.tab, !signupMode && styles.tabActive)}
              aria-pressed={!signupMode}
              onClick={() => switchMode("login")}
            >
              Já tenho conta
            </button>
          </div>

          <form
            className={cx(styles.form, signupMode && styles.formSignup)}
            onSubmit={submit}
            onKeyDown={(e) => {
              // Enter em qualquer campo envia (o botão do formulário é um SpriteButton, que não é submit)
              if (e.key === "Enter" && e.target instanceof HTMLInputElement && e.target.type !== "radio") {
                e.preventDefault();
                void submit();
              }
            }}
            noValidate
          >
            {signupMode ? (
              <h1 className={styles.heading}>Criar conta</h1>
            ) : (
              <header className={styles.loginHeader}>
                <span className={styles.lights} aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
                <span className={styles.loginKicker}>Painel de decolagem</span>
                <h1 className={styles.loginTitle}>Entrar na conta</h1>
                <p className={styles.loginLead}>Sua nave está pronta. Falta só o seu apelido e a sua senha.</p>
              </header>
            )}

            {signupMode ? (
              <>
                <Step number={1} title="Sua conta" className={styles.s1}>
                  <div className={styles.pair}>
                    {nicknameField}
                    {passwordField}
                  </div>
                </Step>

                <Step number={2} title="Sobre você" className={styles.s2}>
                  <div className={styles.ageRow}>
                    <div className={styles.field}>
                      <label htmlFor={`${ids}-age`} className={styles.label}>
                        Idade
                      </label>
                      <input
                        id={`${ids}-age`}
                        className={cx(styles.input, styles.ageInput)}
                        value={age}
                        inputMode="numeric"
                        maxLength={3}
                        autoComplete="off"
                        aria-describedby={`${ids}-universe`}
                        onChange={(e) => setAge(e.target.value.replace(/\D/g, ""))}
                      />
                    </div>
                  </div>

                  <fieldset className={styles.levels}>
                    <legend className={styles.label}>Quanto você já sabe de tecnologia?</legend>
                    <div className={styles.levelOptions}>
                      {LEVELS.map((option) => (
                        <label key={option.id} className={cx(styles.level, level === option.id && styles.levelActive)}>
                          <input
                            type="radio"
                            name={`${ids}-level`}
                            value={option.id}
                            checked={level === option.id}
                            onChange={() => setLevel(option.id)}
                            className={styles.levelRadio}
                          />
                          <span className={styles.levelName}>{option.name}</span>
                          <span className={styles.levelDetail}>{option.detail}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <p id={`${ids}-universe`} className={cx(styles.universe, universe && styles.universeOn)} aria-live="polite">
                    {universe ? (
                      <>
                        <Sprite src={galaxySprite(universe.galaxy)} alt="" decorative size={32} />
                        <span>
                          Seu universo: <strong>{universe.name}</strong>
                        </span>
                      </>
                    ) : (
                      <span>Digite a idade e escolha o nível: eles escolhem o seu universo.</span>
                    )}
                  </p>
                </Step>

                <Step number={3} title="Seu personagem" className={styles.s3}>
                  <fieldset className={styles.avatars}>
                    <legend className="sr-only">Escolha seu personagem</legend>
                    <AvatarPicker value={avatar} onChange={setAvatar} />
                  </fieldset>
                </Step>
              </>
            ) : (
              <div className={styles.loginFields}>
                {nicknameField}
                {passwordField}
              </div>
            )}

            <p role="alert" className={styles.error}>
              {error ?? ""}
            </p>

            <div className={styles.submit}>
              <SpriteButton
                sprite={SPRITES.ui.play}
                label={busy ? "Aguarde..." : signupMode ? "Criar conta e embarcar" : "Entrar"}
                onClick={() => void submit()}
                disabled={busy}
                variant="primary"
                size={26}
              />
            </div>

            {signupMode ? (
              <p className={styles.switch}>
                Já tem uma conta?{" "}
                <button type="button" className={styles.switchLink} onClick={() => switchMode("login")}>
                  Entrar
                </button>
              </p>
            ) : (
              <div className={styles.loginSwitch}>
                <span className={styles.hint}>Primeira vez por aqui?</span>
                <SpriteButton sprite={SPRITES.ui.profile} label="Criar conta" onClick={() => switchMode("signup")} size={16} />
              </div>
            )}
          </form>

          {offline && (
            <PixelPanel title="Sem conexão com as contas" tone="muted" className={styles.offlinePanel}>
              <div className={styles.offline}>
                <p className={styles.hint}>
                  Dá para jogar sem conta enquanto isso. O progresso fica só neste aparelho e os pontos não entram no
                  ranking.
                </p>
                {!signupMode && (
                  <div className={styles.field}>
                    <label htmlFor={`${ids}-guest-age`} className={styles.label}>
                      Idade
                    </label>
                    <input
                      id={`${ids}-guest-age`}
                      className={cx(styles.input, styles.ageInput)}
                      value={age}
                      inputMode="numeric"
                      maxLength={3}
                      autoComplete="off"
                      onChange={(e) => setAge(e.target.value.replace(/\D/g, ""))}
                    />
                  </div>
                )}
                <SpriteButton sprite={SPRITES.ui.map} label="Jogar sem conta" onClick={() => void guest()} size={22} />
              </div>
            </PixelPanel>
          )}
        </div>
      </div>
    </AppShell>
  );
}
