# Rota 404 — Faixa etária 14+ | Módulo API REST

## Diretrizes do módulo

**Objetivo:** compreender como aplicações trocam informações por APIs e praticar esse processo em simulações interativas.

**Progressão:** conhecer API e participantes da comunicação → aprender a montar requisições HTTP → entender os dados JSON → interpretar resultados e diagnosticar falhas.

**Formato para a feira:** todas as atividades usam cenários fictícios, respostas predefinidas e um ambiente simulado. Não exigem conta, conexão com APIs externas, publicação de código ou criação de um projeto real. Pode haver edição de requisições e manipulação visual de dados, mas apenas dentro do simulador.

**Didática:** textos curtos, mas suficientes para explicar os termos na primeira vez em que aparecem. Cada aula apresenta os conceitos necessários para os laboratórios seguintes. O Bonzi Buddy narra as explicações e orienta sem fornecer todas as respostas de imediato.

---

# Assunto 1 — Conhecendo uma API

## Planeta 1.1 (Aula) — Sistemas que conversam

### Objetivo
Explicar o que é uma API, por que ela é útil e como permite que sistemas utilizem dados ou funcionalidades de outros serviços.

### Ideia central
**Uma API define como um sistema pode solicitar dados ou serviços a outro sistema.**

### Fluxo

**Cena 1 — Dois sistemas, duas funções**

Mostrar um aplicativo de clima e um serviço meteorológico. O aplicativo exibe uma tela, mas não possui sozinho os dados atualizados de temperatura.

Bonzi: “O aplicativo sabe mostrar a previsão, mas precisa de um serviço que forneça esses dados. Como os dois podem se comunicar?”

**Cena 2 — A API entra na comunicação**

Mostrar: `Aplicativo → API → Serviço meteorológico`.

Bonzi: “API é uma interface com regras definidas para um sistema pedir informações ou usar funções de outro. Ela indica como fazer o pedido e como receber o resultado.”

**Cena 3 — Pedido e resultado**

O aplicativo solicita a temperatura de uma cidade. O serviço consulta seus dados e retorna a informação pela API. O aplicativo mostra `Osasco — 24 °C`.

Bonzi: “O aplicativo não precisou produzir a previsão. Pediu o dado ao serviço e usou a resposta recebida.”

**Cena 4 — Outros usos**

Mostrar exemplos rápidos: mapa usando dados de localização; loja usando serviço de pagamento; jogo consultando informações de um servidor.

Bonzi: “APIs permitem que sistemas trabalhem juntos sem que cada um precise desenvolver tudo sozinho.”

**Cena 5 — O que significa REST?**

Bonzi: “Neste módulo veremos APIs REST. REST é um estilo de organizar APIs em torno de recursos — como usuários, produtos e pedidos — acessados por endereços e operações padronizadas. Nos próximos assuntos você conhecerá os métodos HTTP usados nessas operações.”

Mostrar três recursos: `/users`, `/products` e `/orders`. Não exigir que o aluno memorize os caminhos nesta aula; eles serão praticados depois.

### Microinteração
O aluno associa cada aplicativo ao serviço que poderia utilizar: clima → serviço meteorológico; loja → serviço de pagamento; mapa → serviço de mapas. Ao concluir, o sistema anima uma das comunicações.

### Fechamento
`Aplicativo → API → Serviço`

Bonzi: “A API define como o pedido é feito e como o sistema recebe a resposta.”

---

## Planeta 1.2 (Aula) — Cliente, servidor e API

### Objetivo
Diferenciar cliente, API, servidor, requisição e resposta e compreender o fluxo básico de comunicação.

### Ideia central
**O cliente faz uma requisição; o serviço processa o pedido; uma resposta retorna ao cliente.**

### Fluxo

**Cena 1 — Quem inicia?**

Mostrar um aplicativo de clima pedindo a temperatura. Destacar o aplicativo como `CLIENTE`.

Bonzi: “Cliente é o sistema que inicia o pedido. Pode ser um aplicativo, um site ou outro programa.”

**Cena 2 — A entrada definida**

O pedido passa pela `API`.

Bonzi: “A API define as regras e os caminhos disponíveis para fazer pedidos. Ela não é necessariamente um computador separado.”

**Cena 3 — Quem processa?**

Mostrar o pedido chegando ao `SERVIDOR`, que recebe a solicitação e consulta os dados necessários.

Bonzi: “Servidor é o sistema que recebe pedidos e fornece dados ou executa operações. Ele pode funcionar em um computador remoto.”

**Cena 4 — Ida e volta**

O pedido enviado pelo cliente é identificado como `REQUISIÇÃO`. O resultado que retorna é identificado como `RESPOSTA`.

Bonzi: “Requisição é a mensagem que pede algo. Resposta é a mensagem de retorno com o resultado ou uma informação sobre o que aconteceu.”

Mostrar: `Cliente → Requisição pela API → Servidor → Resposta → Cliente`.

**Cena 5 — Conferindo os papéis**

Pausar a animação e destacar cada componente. Explicar que, em um sistema real, a API costuma ser disponibilizada pelo serviço no servidor; o desenho separa os elementos para facilitar a compreensão.

### Microinteração
O aluno toca em “quem pede?”, “quem define a forma de comunicação?” e “quem processa o pedido?”. Deve selecionar, respectivamente, cliente, API e servidor. Depois identifica qual mensagem é a requisição e qual é a resposta.

### Fechamento
Resumo visual: `Cliente = pede | API = define como pedir | Servidor = processa | Requisição = pedido | Resposta = retorno`.

---

## Planeta 1.3 (Laboratório) — Faça uma pergunta ao servidor

### Tipo
Simulação guiada de consulta.

### Objetivo
Experimentar uma comunicação completa usando uma API fictícia, sem ainda precisar montar métodos ou endereços técnicos.

### Fluxo

**Etapa 1 — Escolher a consulta**

O aluno escolhe uma opção visual: consultar clima, buscar um produto ou ver a pontuação de um jogador.

**Etapa 2 — Enviar**

Clica em `CONSULTAR`. O simulador mostra a aplicação como cliente e anima uma requisição passando pela API até o servidor.

**Etapa 3 — Receber a resposta**

O servidor retorna dados predefinidos. Exemplo: `Cidade: Osasco | Temperatura: 24 °C`. A resposta retorna ao aplicativo e a informação aparece na tela.

**Etapa 4 — Identificar o fluxo**

O aluno arrasta as etiquetas `cliente`, `API`, `servidor`, `requisição` e `resposta` para os elementos correspondentes.

### Feedback
Se errar, a animação pausa no ponto relevante e o Bonzi explica a função daquele componente. O aluno pode tentar novamente.

### Conclusão
O aluno completou uma consulta simulada e identificou quem pediu, quem processou e qual foi a resposta.

---

## Planeta 1.4 (Laboratório) — O servidor respondeu!

### Tipo
Ordenação de etapas / leitura de uma comunicação.

### Objetivo
Compreender a sequência temporal de uma requisição e de uma resposta, distinguindo o pedido do resultado.

### Fluxo

**Etapa 1 — Organizar**

Exibir cartões fora de ordem: `servidor processa`, `cliente envia pedido`, `cliente recebe o resultado`, `servidor envia resposta`.

O aluno organiza a sequência correta.

**Etapa 2 — Acompanhar**

O simulador reproduz a sequência organizada: o cliente envia a requisição; o servidor processa; o servidor envia a resposta; o cliente recebe o resultado.

**Etapa 3 — Abrir as mensagens**

O aluno seleciona `REQUISIÇÃO` e `RESPOSTA`. Na requisição, vê o pedido fictício “Consultar produto 42”. Na resposta, vê “Produto encontrado”. Ainda não aparecem métodos HTTP, URLs ou JSON, pois esses conceitos serão ensinados nos assuntos seguintes.

**Etapa 4 — Identificar uma falha**

Em uma rodada alternativa, a resposta não é recebida. O aluno escolhe o que está faltando: “o cliente ainda não recebeu a resposta”. O simulador mostra que não se pode exibir um resultado que não chegou.

### Feedback
O sistema explica cada etapa fora de ordem e permite reorganizá-la novamente.

### Conclusão
O aluno diferencia pedido e resposta e compreende sua ordem, preparando-se para aprender como as requisições são escritas.

---

# Assunto 2 — Requisições HTTP

## Planeta 2.1 (Aula) — Como pedir uma informação

### Objetivo
Explicar HTTP, URL, endpoint e os elementos básicos usados para indicar o que uma API deve atender.

### Ideia central
**Uma requisição HTTP combina uma operação com um endereço para indicar o que o cliente deseja fazer.**

### Fluxo

**Cena 1 — Um endereço completo**

Mostrar a URL fictícia `https://api.exemplo.test/users/42`.

Bonzi: “URL é o endereço completo usado para localizar um recurso. Ela pode incluir o protocolo, o domínio e o caminho.”

Destacar:
- `https://` — indica uma conexão HTTPS, que protege a comunicação com criptografia;
- `api.exemplo.test` — domínio/servidor ao qual o cliente se dirige;
- `/users/42` — caminho até o recurso solicitado.

**Cena 2 — O que é endpoint?**

Destacar `/users/42`.

Bonzi: “Endpoint é um ponto de acesso oferecido pela API. O caminho indica qual recurso queremos acessar; combinado ao método HTTP, indica a operação solicitada.”

Comparar `/users/42` (usuário 42) com `/products/42` (produto 42). O número é igual, mas o recurso é diferente.

**Cena 3 — O que é HTTP?**

Mostrar a requisição `GET /users/42`.

Bonzi: “HTTP é um conjunto de regras usado para trocar requisições e respostas na Web. Uma requisição inclui uma operação, como GET, e o endereço do recurso.”

Explicar que o `GET` será estudado na próxima aula; por enquanto, ele aparece como exemplo de método.

### Microinteração
O sistema exibe os endpoints fictícios `/users/`, `/products/`, e `/ratings/`. O aluno recebe o objetivo “buscar o produto 42” e digita em uma caixa de texto. O sistema diz onde errou em caso de erro e parabeniza em caso de acerto.

### Fechamento
`URL = endereço completo | Endpoint = ponto de acesso da API | HTTP = regras de requisição e resposta`.

---

## Planeta 2.2 (Aula) — GET, POST, PUT e DELETE

### Objetivo
Entender as intenções mais comuns dos quatro métodos HTTP usados nas atividades do módulo.

### Ideia central
**O método indica a intenção da requisição.**

### Fluxo

Mostrar uma lista fictícia de produtos e demonstrar cada operação.

- **GET — consultar:** busca um recurso sem pedir sua alteração.
- **POST — enviar/criar:** envia dados para criar um recurso ou executar uma operação definida pela API.
- **PUT — substituir/atualizar:** envia uma representação para substituir ou atualizar um recurso, conforme as regras da API.
- **DELETE — remover:** solicita a remoção de um recurso.

Bonzi: “Essas são as intenções mais comuns em APIs REST. O efeito exato depende das regras da API, mas o método ajuda o servidor a entender o que o cliente quer fazer.”

**Demonstração**

Tocar em cada método anima uma operação no catálogo fictício: consultar produto, registrar produto, atualizar dados de um produto e remover um produto. As ações são simuladas e podem ser reiniciadas.

### Microinteração
O aluno associa quatro pedidos — “ver produto”, “registrar produto”, “alterar dados do produto” e “remover produto” — aos métodos GET, POST, PUT e DELETE.

### Fechamento
`GET = consultar | POST = enviar/criar | PUT = substituir/atualizar | DELETE = remover`.

---

## Planeta 2.3 (Laboratório) — Qual método devo usar?

### Tipo
Classificação de situações.

### Objetivo
Escolher o método HTTP de acordo com a intenção da operação.

### Fluxo

**Etapa 1 — Ler a missão**

Uma carta apresenta uma ação, por exemplo: “Consulte o produto 17”. As opções são `GET`, `POST`, `PUT` e `DELETE`.

**Etapa 2 — Escolher**

O aluno seleciona o método e clica em `TESTAR`.

**Etapa 3 — Ver o efeito**

O simulador executa a ação no catálogo fictício. Se a escolha corresponder à intenção, mostra o resultado esperado. Se não, mostra por que aquela operação não atende ao pedido.

**Etapa 4 — Variar**

Usar casos sobre usuários, produtos, pedidos e comentários, sem exigir que o aluno crie um sistema ou cadastre dados reais.

### Feedback
A explicação relaciona a intenção ao método; não basta dizer “errado”. O aluno pode rever a explicação da Aula 2.2 e tentar novamente.

### Conclusão
O aluno identifica o método apropriado em diferentes situações.

---

## Planeta 2.4 (Laboratório) — Encontre o problema

### Tipo
Depuração de requisição simulada.

### Objetivo
Corrigir requisições cujo método ou endpoint não corresponde ao objetivo apresentado.

### Fluxo

**Etapa 1 — Entender o objetivo**

Exemplo: “Atualize o produto 42”. A requisição apresentada é `GET /products/42`.

**Etapa 2 — Inspecionar**

O aluno pode selecionar o método, o endpoint e o ID. O simulador destaca a intenção do pedido e o recurso indicado pelo caminho.

**Etapa 3 — Corrigir**

O aluno escolhe o método adequado (`PUT`) e mantém `/products/42`. Em outras rodadas, o método está correto e o endpoint aponta para o recurso errado; em outras, os dois estão incorretos.

**Etapa 4 — Testar**

Ao clicar em `ENVIAR`, o sistema simula o resultado. Se a requisição corresponder à missão, mostra “Operação concluída”. Caso contrário, explica se o problema está no método, no caminho ou em ambos.

### Dificuldade
1. Método incorreto.
2. Endpoint incorreto.
3. ID incorreto.
4. Um ou mais incorretos.

### Conclusão
O aluno corrige requisições usando conceitos já apresentados; não precisa escrever código ou criar uma API real.

---

# Assunto 3 — Entendendo os dados

## Planeta 3.1 (Aula) — O que é JSON?

### Objetivo
Explicar JSON, objetos, propriedades, valores e listas, incluindo a sintaxe necessária para ler as respostas usadas nos laboratórios.

### Ideia central
**JSON é um formato de texto estruturado usado para representar e trocar dados. Não é uma linguagem de programação.**

### Fluxo

**Cena 1 — Dados soltos**

Mostrar os dados `nome: Ana` e `idade: 15` em cartões separados. Bonzi explica que uma aplicação precisa de uma organização consistente para enviar e receber dados.

**Cena 2 — Objeto JSON**

Organizar os cartões:

```json
{
  "nome": "Ana",
  "idade": 15
}
```

Bonzi explica:
- `{ }` agrupam as propriedades de um objeto;
- cada propriedade tem uma chave (como `nome`) e um valor;
- `:` separa chave e valor; `,` separa propriedades;
- texto fica entre aspas (`"Ana"`); números não precisam de aspas (`15`).

**Cena 3 — Outros valores**

Adicionar `"ativo": true`. Explicar que `true` e `false` representam valores booleanos: verdadeiro e falso. Mostrar que uma propriedade também pode conter uma lista.

```json
{
  "nome": "Ana",
  "idade": 15,
  "ativo": true,
  "jogos": ["X", "Y"]
}
```

Bonzi: “Os colchetes `[ ]` agrupam uma lista de valores. Assim, um JSON pode guardar informações simples e coleções.”

### Microinteração
O aluno toca em partes do exemplo para identificar objeto, chave, valor textual, número, booleano e lista. Depois escolhe qual de dois exemplos tem a estrutura válida; o sistema destaca aspas, dois-pontos, vírgulas e delimitadores necessários.

### Fechamento
Resumo visual: `objeto = conjunto de propriedades | propriedade = chave + valor | lista = conjunto ordenado de valores`.

---

## Planeta 3.2 (Aula) — Lendo uma resposta

### Objetivo
Interpretar um JSON devolvido por uma API e localizar dados simples, aninhados ou agrupados em listas.

### Ideia central
**A API pode devolver dados em JSON; a aplicação lê os campos necessários e decide como apresentá-los.**

### Fluxo

**Cena 1 — Recebendo dados**

Mostrar uma resposta simulada:

```json
{
  "id": 42,
  "nome": "Ana",
  "cidade": "Osasco",
  "ativo": true
}
```

Bonzi: “Cada chave indica que tipo de informação está guardada. Para encontrar a cidade, procure a propriedade `cidade` e leia seu valor.”

**Cena 2 — Encontrando campos**

Destacar `id`, `nome`, `cidade` e `ativo`, um por vez. Relembrar: número, texto e booleano são tipos de valor apresentados na aula anterior.

**Cena 3 — Dados dentro de dados**

Mostrar um objeto `produto` que contém `nome` e `preco`, dentro de um objeto maior. Expandir visualmente os níveis.

Bonzi: “Uma propriedade pode guardar outro objeto ou uma lista. Nesse caso, siga os nomes dos campos até encontrar a informação.”

**Cena 4 — Lista de itens**

Mostrar `produtos` como uma lista de cartões, cada cartão representando um objeto. O aluno expande um item para ver suas propriedades.

### Microinteração
Perguntas curtas: “Qual é a cidade?”, “Qual é o preço do produto?” e “Qual produto tem este nome?”. O aluno seleciona o valor ou expande o objeto/lista correto.

### Fechamento
A resposta JSON contém os dados; a aplicação localiza os campos e transforma seus valores em informações que o usuário consegue entender.

---

## Planeta 3.3 (Laboratório) — Caça ao dado

### Tipo
Investigação visual em JSON.

### Objetivo
Encontrar uma informação específica em respostas JSON, incluindo objetos agrupados e listas.

### Fluxo

**Etapa 1 — Receber a missão**

Exemplo: “Encontre o preço do produto Teclado”. Um JSON fictício aparece em um painel.

**Etapa 2 — Explorar**

O aluno expande objetos e listas, identifica as propriedades e seleciona o valor que acredita ser a resposta.

**Etapa 3 — Conferir**

Se correto, o dado fica destacado e o sistema mostra o caminho visual usado para encontrá-lo, por exemplo `produtos → Teclado → preco`.

Se incorreto, o sistema destaca a chave relevante, sem revelar diretamente o valor, e permite outra tentativa.

### Dificuldade progressiva
1. Propriedade no objeto principal.
2. Propriedade dentro de um objeto aninhado.
3. Localizar um item em uma lista e abrir suas propriedades.

### Conclusão
O aluno encontra campos usando estrutura e contexto, não apenas procurando números ou palavras semelhantes.

---

## Planeta 3.4 (Laboratório) — Monte a resposta

### Tipo
Mapeamento de dados para uma interface.

### Objetivo
Transformar os dados de um JSON em uma apresentação visual correta.

### Fluxo

**Etapa 1 — Ler os dados**

Mostrar um JSON de produto com `nome`, `preco` e `estoque`, todos previamente explicados nas aulas.

**Etapa 2 — Preencher a interface**

À direita, mostrar um cartão vazio com campos `Nome`, `Preço` e `Estoque`. O aluno arrasta cada valor para o campo correspondente.

**Etapa 3 — Visualizar**

O simulador monta o cartão usando os valores escolhidos. O aluno clica em `CONFERIR`.

**Etapa 4 — Corrigir**

Se um valor estiver no campo errado, o sistema destaca a incompatibilidade e permite reposicioná-lo. Ao acertar, o cartão é exibido corretamente.

### Variações
Usar cartão de produto, perfil simples ou placar de jogo. São modelos prontos; o aluno não cria um aplicativo.

### Conclusão
O aluno percebe a diferença entre os dados estruturados em JSON e a interface que a aplicação apresenta ao usuário.

---

# Assunto 4 — API em situações reais

## Planeta 4.1 (Aula) — API em um aplicativo

### Objetivo
Relacionar os conceitos de API, cliente, servidor, requisição e resposta a funcionalidades de aplicativos conhecidos.

### Ideia central
**Um aplicativo pode usar APIs diferentes para obter dados ou executar operações oferecidas por outros serviços.**

### Fluxo

**Cena 1 — Várias funções, vários serviços**

Mostrar um aplicativo fictício de viagem que apresenta um mapa, a previsão do tempo e uma opção de pagamento.

Bonzi: “Um mesmo aplicativo pode precisar de informações e funções fornecidas por serviços diferentes.”

**Cena 2 — Separando as comunicações**

Animar três pedidos:
- mapa → API de mapas → dados de localização;
- tela de clima → API meteorológica → previsão;
- compra → API de pagamento → resultado da operação.

Em cada exemplo, destacar o cliente que faz a solicitação, o serviço que responde e a API usada para a comunicação.

**Cena 3 — Uma API, diferentes clientes**

Mostrar dois aplicativos distintos consultando o mesmo serviço meteorológico por sua API.

Bonzi: “Uma API pode ser usada por mais de uma aplicação, desde que cada uma respeite as regras e os recursos que ela oferece.”

**Cena 4 — Limites da API**

Mostrar uma consulta disponível e outra não oferecida pelo serviço.

Bonzi: “Uma API não dá acesso automático a tudo. Ela oferece operações específicas, e o cliente precisa usar os recursos disponibilizados pelo serviço.”

### Microinteração
O aluno toca em três solicitações e identifica o serviço mais adequado para atendê-las. Depois associa um aplicativo cliente, uma API e um serviço no diagrama correto.

### Fechamento
As APIs conectam aplicações a serviços especializados e permitem reutilizar dados ou funções sem reconstruir toda a solução.

---

## Planeta 4.2 (Aula) — Quando algo dá errado

### Objetivo
Entender o papel dos códigos de status HTTP e interpretar os resultados mais comuns usados nos laboratórios.

### Ideia central
**O código de status resume o resultado da requisição; ele ajuda o cliente a entender o que aconteceu.**

### Fluxo

**Cena 1 — Uma resposta de sucesso**

Mostrar `GET /users/10` e a resposta `200 OK`.

Bonzi: “O código de status é um número enviado na resposta HTTP. Ele resume o resultado da requisição. `200` significa que o pedido foi atendido com sucesso.”

**Cena 2 — O pedido tem um problema**

Mostrar uma requisição inválida e `400 Bad Request`.

Bonzi: “`400` indica que o pedido enviado tem algo inválido ou não pode ser entendido como foi enviado.”

**Cena 3 — É preciso provar a identidade**

Mostrar uma área protegida que exige login e a resposta `401 Unauthorized`.

Bonzi: “`401` indica que falta uma autenticação válida. Autenticação é provar quem você é, por exemplo, entrando na sua conta.”

**Cena 4 — O recurso não existe**

A requisição pede `/users/999`, mas esse usuário não existe. Resposta: `404 Not Found`.

Bonzi: “`404` significa que o recurso solicitado não foi encontrado naquele endereço.”

**Cena 5 — Falha no serviço**

O servidor recebe uma requisição válida, mas ocorre um problema interno durante o processamento. Resposta: `500 Internal Server Error`.

Bonzi: “`500` indica uma falha interna no servidor. Nem todo erro é causado por quem fez o pedido.”

### Microinteração
O aluno recebe situações e associa cada uma ao status: sucesso (200), pedido inválido (400), autenticação ausente ou inválida (401), recurso não encontrado (404) ou falha interna (500). Cada escolha é acompanhada de uma explicação.

### Fechamento
Mostrar que esses são exemplos comuns, não a lista completa dos status HTTP. O código descreve o resultado da requisição, mas não revela necessariamente todos os detalhes da causa.

---

## Planeta 4.3 (Laboratório) — Diagnóstico da API

### Tipo
Investigação de requisições e respostas simuladas.

### Objetivo
Usar método, endpoint, JSON e código de status para identificar a causa provável de uma operação malsucedida.

### Tela
Painel com `REQUISIÇÃO`, `RESPOSTA` e a pergunta `O que aconteceu?`. O aluno pode abrir cada parte para examinar os dados.

### Fluxo

**Caso 1 — Recurso inexistente**

Requisição: `GET /users/999` → resposta `404 Not Found`.

O aluno escolhe a causa: método incorreto / usuário não encontrado / JSON inválido. A resposta correta é `usuário não encontrado`. A próxima ação é verificar se o identificador e o endpoint estão corretos.

**Caso 2 — Pedido inválido**

O aluno tenta registrar um usuário e a requisição contém um campo obrigatório vazio. Resposta: `400 Bad Request`.

Deve identificar que os dados enviados precisam ser corrigidos. O simulador mostra os campos predefinidos; o aluno seleciona o que está faltando e envia de novo.

**Caso 3 — Autenticação necessária**

Requisição para um recurso protegido sem autenticação válida → `401 Unauthorized`.

O aluno identifica que precisa entrar na conta simulada antes de repetir o pedido. Nenhuma senha real é solicitada.

**Caso 4 — Falha interna**

Uma requisição válida retorna `500 Internal Server Error`.

O aluno identifica uma falha interna do serviço. O caminho apropriado é tentar novamente ou informar o problema, não alterar aleatoriamente o método ou os dados.

### Feedback
O sistema explica por que o status combina com a situação e diferencia um problema no pedido de uma falha interna. Cada caso pode ser repetido com novos dados fictícios.

### Conclusão
O aluno relaciona requisição e resposta para diagnosticar uma causa provável, sem supor que todos os erros sejam corrigidos do lado do cliente.

---

## Planeta 4.4 (Laboratório) — Desafio final: missão API

### Tipo
Desafio integrado em etapas.

### Objetivo
Recuperar e apresentar uma informação usando os conceitos do módulo: cliente/servidor/API, método HTTP, endpoint, status e JSON.

### Missão
“Encontre o nome e o preço do produto 42 e mostre-os no cartão do produto.”

### Fluxo

**Etapa 1 — Escolher a requisição**

O simulador mostra os métodos e endpoints disponíveis. O aluno escolhe `GET` e `/products/999` para procurar o produto 42.

**Etapa 2 — Interpretar o erro**

A API simulada retorna `404 Not Found`. O aluno escolhe a explicação: “o produto solicitado não foi encontrado nesse endereço”.

**Etapa 3 — Corrigir e reenviar**

O aluno altera o endpoint para `/products/42` e envia novamente. O sistema anima cliente → API/servidor → resposta e retorna `200 OK`.

**Etapa 4 — Ler a resposta JSON**

```json
{
  "id": 42,
  "nome": "Teclado",
  "preco": 120
}
```

O aluno identifica `nome` e `preco`. Se necessário, pode expandir o objeto e rever a explicação das propriedades.

**Etapa 5 — Apresentar os dados**

O aluno arrasta `Teclado` para `Nome` e `120` para `Preço` no cartão já pronto. O simulador mostra o cartão final e confirma que a informação foi recuperada e apresentada corretamente.

### Feedback e gamificação

Cada etapa informa o que funcionou e explica erros. A pontuação é entregue ao concluir o laboratório; conquistas opcionais podem premiar conclusão sem dicas ou diagnóstico correto na primeira tentativa.

### Rejogabilidade

Em novas rodadas, variar produto, endpoint incorreto ou dado solicitado, mantendo o mesmo fluxo. Todas as respostas são predefinidas e simuladas; o aluno não cria nem publica um projeto.
