/**
 * Falas com valor livre (apelido, pontos, o que a criança digita): o texto na tela mostra o valor, e a voz toca uma
 * gravação fixa. `*` vale qualquer trecho. A gravação usada é a da fala do 2º item (procurada em bonziVoice.ts).
 * Vale para a fala inteira ou para um pedaço dela (frase ou "Rótulo:"); ver recordedParts no narrationService.
 */
export const BONZI_VOICE_PATTERNS: ReadonlyArray<readonly [pattern: string, spoken: string]> = [
  // o apelido vira "viajante" na voz
  ["Bem-vindo de volta, *! Vamos decolar?", "Bem-vindo de volta, viajante! Vamos decolar?"],
  ["Você já está a bordo, *!", "Você já está a bordo, viajante!"],
  // pontos: qualquer valor de 0 a 10.000
  ["Laboratório concluído! Você fez * pontos.", "Laboratório concluído! Confira os seus pontos."],
  // G2 2.1: o caminho digitado pela criança
  ["O recurso /*/ não existe nesta API.", "Esse recurso não existe nesta API."],
  ["O recurso está certo, mas o número está errado: a missão pede o produto 42, não o *.", "O recurso está certo, mas o número está errado: a missão pede o produto 42."],
  // G2 2.4: requisição com mais de um problema (combinações demais para gravar uma a uma)
  ["Há * problemas: *", "Há mais de um problema nesta requisição. Confira o método, o caminho e o ID."],
  ["*: o item número *.", "Esse é o número do item."],
  // G2 3.3 e 3.4: nomes de campos e caminhos montados na partida
  ["Caminho: *.", "Esse é o caminho até o dado."],
  ["O campo * recebeu um valor de outra chave.", "Um campo recebeu um valor de outra chave."],
  ["Os campos * receberam um valor de outra chave.", "Alguns campos receberam um valor de outra chave."],
];
