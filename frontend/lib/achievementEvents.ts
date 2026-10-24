/*
 * Gatilhos de conquista que não vêm do progresso (página 404, caminho inexistente numa aula, suco de abacaxi,
 * troca de personagem). Quem dispara não precisa do provider: `unlockAchievement(slug)`. Até o AchievementsProvider
 * estar pronto (sessão e armazenamento lidos), os pedidos esperam numa fila — os efeitos dos filhos rodam antes dos
 * do provider, então uma página 404 aberta direto dispara antes de alguém ouvir.
 */

type Listener = (slug: string) => void;

let listener: Listener | null = null;
const pending: string[] = [];

export function unlockAchievement(slug: string): void {
  if (listener) listener(slug);
  else if (!pending.includes(slug)) pending.push(slug);
}

/** O provider registra quem grava; devolve a função que desfaz o registro. */
export function listenAchievementUnlocks(next: Listener): () => void {
  listener = next;
  for (const slug of pending.splice(0)) next(slug);
  return () => {
    if (listener === next) listener = null;
  };
}
