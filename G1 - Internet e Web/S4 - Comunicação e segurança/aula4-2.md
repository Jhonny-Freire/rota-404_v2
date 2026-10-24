# Rota 404 — Especificação detalhada da Aula 4.2 - HTTP e HTTPS

Este documento especifica de forma detalhada o conteúdo do planeta 4.2 - HTTP e HTTPS

## Escopo
- **Faixa etária**: 13 anos ou menos
- **Módulo (Galáxia)**: Internet e Web
- **Assunto (Sistema Planetário)**: Comunicação e segurança
- **Aula (Planeta)**: 4.2

## Planeta 4.2 (Aula) — HTTP e HTTPS

### Objetivo

Explicar a diferença entre HTTP e HTTPS, mostrando como o HTTPS protege as informações trocadas entre o navegador e um site.

### Ideia central

**HTTP permite a comunicação. HTTPS protege essa comunicação com criptografia.**

### Fluxo

**Cena 1 — Enviando uma informação**

Mostrar um navegador acessando um site com um formulário simples. O aluno digita uma informação fictícia e clica em `Enviar`.

Uma mensagem sai do navegador e viaja pela internet até o servidor.

Bonzi:

> "Quando você envia uma informação para um site, ela precisa viajar pela internet até chegar ao destino!"

**Cena 2 — Uma comunicação sem proteção**

A tela mostra uma conexão utilizando `HTTP`.

A mensagem viaja visualmente aberta, permitindo que o aluno veja seu conteúdo durante o percurso.

Bonzi:

> "No HTTP, as informações não são protegidas por criptografia durante a comunicação. Isso pode permitir que alguém que consiga interceptar os dados os leia."

A animação destaca a mensagem durante o percurso. Um hacker intercepta a mensagem e consegue ler ela.

Bonzi:

> "Essa não! Um hacker que interceptou a mensagem conseguiu ver o conteúdo!"
> "Vamos mudar para uma conexão mais segura."

**Cena 3 — Protegendo a comunicação**

A mesma situação acontece novamente, agora utilizando `HTTPS`.

Antes de viajar, a mensagem passa por uma animação de proteção e fica representada por um pacote fechado, acompanhado de um cadeado.

Bonzi:

> "O HTTPS usa criptografia para proteger as informações enquanto elas viajam entre o navegador e o site."

O hacker intercepta a mensagem novamente, mas dessa vez não consegue ver o conteúdo.

Bonzi:

> "O hacker interceptou a mensagem de novo, mas dessa vez não conseguiu ver o conteúdo!"

A mensagem chega ao servidor, que consegue processá-la normalmente.

**Cena 4 — Comparando HTTP e HTTPS**

A tela se divide em duas partes:

`HTTP` | `HTTPS`

Em cada lado, uma mensagem percorre o caminho entre o navegador e o servidor.

No lado HTTP, a mensagem aparece sem proteção criptográfica.

No lado HTTPS, a mensagem aparece protegida durante o percurso.

Bonzi:

> "Os dois permitem a comunicação. A diferença é que o HTTPS adiciona proteção para dificultar que outras pessoas leiam ou alterem os dados durante o caminho."

Destacar também o início do endereço de cada site:

`http://exemplo.com`

`https://exemplo.com`

O aluno deve perceber que a diferença aparece no endereço e está relacionada à forma como a comunicação é protegida.

**Cena 5 — O que o cadeado significa?**

Mostrar o endereço de um site HTTPS com um cadeado visual.

Bonzi:

> "O cadeado indica uma conexão protegida. Mas atenção: isso não significa que o site seja necessariamente confiável!"

### Encerramento

A animação mostra novamente as duas formas de comunicação:

`HTTP → comunicação sem criptografia`

`HTTPS → comunicação protegida por criptografia`

Bonzi:

> "Sempre que possível, prefira conexões HTTPS. E lembre-se: uma conexão protegida é importante, mas também precisamos verificar se o site é confiável!"
