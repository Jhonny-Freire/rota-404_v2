# Rota 404 — Especificação detalhada da Aula 4.1 - Como as informações viajam?

Este documento especifica de forma detalhada o conteúdo do planeta 4.1 - Como as informações viajam?

## Escopo
- **Faixa etária**: 13 anos ou menos
- **Módulo (Galáxia)**: Internet e Web
- **Assunto (Sistema Planetário)**: Comunicação e segurança
- **Aula (Planeta)**: 4.1

## Planeta 4.1 (Aula) — Como as informações viajam?

### Objetivo

Mostrar como o navegador e o servidor trocam informações por meio de requisições e respostas, utilizando uma situação familiar ao aluno.

### Ideia central

**O navegador envia uma requisição, o servidor processa o pedido e envia uma resposta.**

### Fluxo

**Cena 1 — Entrando em uma conta**

Mostrar uma página de login com campos de usuário e senha e um botão `Entrar`.

O aluno clica no botão.

Bonzi:

> "Quando você clica em entrar, o navegador precisa enviar informações para verificar seu acesso!"

**Cena 2 — Enviando a requisição**

Uma mensagem sai do navegador e viaja pela internet até o servidor.

A mensagem é identificada como `REQUISIÇÃO`.

Bonzi:

> "Essa mensagem é uma requisição: um pedido enviado de um sistema para outro."

**Cena 3 — O servidor recebe o pedido**

O servidor recebe a requisição e verifica as informações enviadas.

Uma animação mostra o servidor processando o pedido.

Bonzi:

> "O servidor recebeu o pedido e está verificando as informações."

**Cena 4 — O servidor envia uma resposta**

O servidor envia uma mensagem de volta ao navegador.

A mensagem é identificada como `RESPOSTA`.

Bonzi:

> "Depois de processar o pedido, o servidor envia uma resposta dizendo o que aconteceu."

**Cena 5 — O resultado aparece**

O navegador recebe a resposta e atualiza a página.

Se os dados estiverem corretos, aparece a mensagem:

`Login realizado!`

Em outra tentativa, a resposta pode indicar que os dados estão incorretos.

Bonzi:

> "O navegador recebeu a resposta e mostrou o resultado na tela!"

### Microinteração

O aluno acompanha uma comunicação e toca em cada etapa para descobrir sua função:

* **Requisição:** mensagem enviada para fazer um pedido.
* **Servidor:** recebe e processa o pedido.
* **Resposta:** mensagem enviada de volta com o resultado.
* **Navegador:** recebe a resposta e apresenta o resultado ao usuário.

Depois, o sistema apresenta três cartões desordenados:

`Servidor processa → Navegador envia pedido → Navegador mostra resultado`

O aluno deve organizá-los na sequência correta. A animação é reproduzida após a resposta, permitindo visualizar o caminho completo.

### Fechamento

A sequência completa é reproduzida:

`Clique em Entrar → Requisição → Servidor → Resposta → Resultado na tela`

Bonzi:

> "Sempre que sistemas precisam trocar informações, eles podem enviar pedidos e receber respostas. É assim que muitas ações na internet funcionam!"
