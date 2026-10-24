Você é responsável por implementar a **base estrutural do Rota 404**.

## OBJETIVO

Construir a fundação completa do sistema, com:

* frontend funcional;
* backend funcional;
* integração preparada para Supabase;
* arquitetura Controller → Service → Repository;
* todas as páginas e rotas principais;
* navegação entre páginas;
* estrutura de dados da progressão;
* faixas etárias, galáxias e sistemas cadastrados;
* estrutura preparada para futura implementação de aulas, laboratórios, pontuação, conquistas e progresso.

**NÃO desenvolver aulas.**
**NÃO desenvolver laboratórios.**
**NÃO criar mecânicas pedagógicas de aulas/laboratórios.**
**NÃO criar conteúdo didático.**

A base deve permitir adicionar esses recursos posteriormente sem refatoração estrutural.

---

# 1. STACK OBRIGATÓRIA

## Frontend

* React
* Next.js
* CSR (Client-Side Rendering)
* JavaScript ou TypeScript, conforme o padrão já existente no projeto
* Next.js App Router
* CSS modularizado ou solução simples já adotada pelo projeto

## Backend

* Python
* Flask
* API REST

## Arquitetura

Controller → Service → Repository

Aplicar essa separação principalmente no backend:

```text
Controller
  ↓
Service
  ↓
Repository
  ↓
Supabase
```

Frontend:

```text
Page
  ↓
UI Components
  ↓
API Client / Service
  ↓
Flask API
```

**Não criar APIs duplicadas no Next.js.**
O Flask é o backend da aplicação.

---

# 2. REGRA CRÍTICA DE UI

## O SISTEMA USA EXCLUSIVAMENTE SPRITES/IMAGENS.

**NÃO USAR ÍCONES DE BIBLIOTECAS.**

Proibido usar como elementos visuais principais:

* Lucide;
* Font Awesome;
* Material Icons;
* Heroicons;
* emojis como substitutos de elementos gráficos;
* SVGs gerados para substituir sprites;
* ícones Unicode.

Sempre preferir:

* sprites;
* imagens;
* ilustrações;
* assets raster;
* animações baseadas em sprites.

Exemplo:

```text
ERRADO:
<button><HomeIcon /></button>

CERTO:
<button><img src="/sprites/ui/home.png" /></button>
```

Mesmo elementos simples da interface devem ser preparados para receber sprites.

Quando um sprite real ainda não existir, use **placeholder visual baseado em imagem**, não um ícone de biblioteca.

Centralize os assets para permitir substituição posterior sem alterar as páginas.

---

# 3. IDENTIDADE DO SISTEMA

Tema:

**espaço sideral + exploração intergalática/interplanetária**

Metáforas:

```text
Faixa etária → universo de aprendizagem
Galáxia → módulo
Sistema planetário → assunto
Planeta → aula ou laboratório
```

O usuário navega pelo sistema em um foguete.

Existe o personagem **Bonzi Buddy**, que funciona como guia/narrador.

A base deve preparar componentes reutilizáveis para:

* avatar;
* foguete;
* Bonzi Buddy;
* galáxia;
* sistema planetário;
* planeta;
* conexões;
* progresso;
* pontuação;
* conquistas.

Não implementar ainda a lógica de aulas/laboratórios.

---

# 4. ESTRUTURA DO MVP

Criar exatamente estas duas faixas etárias:

### Faixa 1

```text
13 anos ou menos
```

Galáxia:

```text
Internet e Web
```

Sistemas planetários:

```text
1. Dispositivos e conexão
2. Endereços e sites
3. Navegador e páginas Web
4. Comunicação e segurança
```

### Faixa 2

```text
14 anos ou mais
```

Galáxia:

```text
API REST
```

Sistemas planetários:

```text
1. Conhecendo uma API
2. Requisições HTTP
3. Entendendo os dados
4. API em situações reais
```

Esses registros devem existir na base de dados desde o início.

---

# 5. SUPABASE

Preparar a aplicação para usar **Supabase como banco de dados principal**.

Criar:

* configuração do Supabase;
* variáveis de ambiente;
* cliente de acesso;
* repositories;
* migrations/schema necessários;
* seed inicial das faixas etárias, galáxias e sistemas planetários.

Nunca colocar credenciais diretamente no código.

Usar `.env` / `.env.local`.

Preparar estrutura para futura expansão.

## Entidades mínimas

### age_ranges

Campos recomendados:

```text
id
name
min_age
max_age nullable
slug
description nullable
created_at
updated_at
```

### galaxies

Representa os módulos.

```text
id
age_range_id
name
slug
description nullable
order_index
created_at
updated_at
```

### planetary_systems

Representa os assuntos.

```text
id
galaxy_id
name
slug
description nullable
order_index
created_at
updated_at
```

Preparar futuramente relacionamento com:

```text
planets
lessons
labs
user_progress
scores
achievements
user_achievements
avatars
```

Mas **não implementar o conteúdo dessas entidades agora**.

Pode existir somente a estrutura futura/schema necessário, sem lógica de aulas/laboratórios.

---

# 6. PÁGINAS

Criar todas as páginas estruturais necessárias ao sistema.

Mesmo sem aulas/laboratórios implementados, suas páginas devem existir como estrutura navegável.

## Páginas principais

### `/`

Landing page do Rota 404.

Deve apresentar:

* identidade do projeto;
* tema espacial;
* proposta de aprendizagem;
* entrada para o sistema.

---

### `/faixas-etarias`

Seleção da faixa etária.

Mostrar as duas galáxias disponíveis conforme faixa.

---

### `/galaxias`

Mapa geral das galáxias disponíveis.

Mostrar:

* galáxias;
* descrição curta;
* progresso futuro;
* estado disponível/bloqueado;
* navegação.

---

### `/galaxias/[galaxySlug]`

Mapa da galáxia.

Mostrar os quatro sistemas planetários correspondentes ao módulo.

---

### `/sistemas/[systemSlug]`

Mapa do sistema planetário.

Preparar visual para exibir futuramente:

```text
Planeta → Aula
Planeta → Laboratório
```

Neste momento não desenvolver o conteúdo.

Pode exibir placeholders.

---

### `/aulas/[id]`

Página-base de aula.

Implementar somente a estrutura visual/técnica da página:

* área principal de conteúdo;
* Bonzi Buddy;
* navegação;
* progressão;
* área preparada para futuras cenas.

**Não implementar aula.**

---

### `/laboratorios/[id]`

Página-base de laboratório.

Implementar somente o shell:

* área principal;
* Bonzi Buddy;
* área de interação;
* feedback;
* pontuação;
* conclusão.

**Não implementar laboratório.**

---

### `/perfil`

Página do usuário.

Preparar:

* avatar;
* nome;
* faixa etária;
* progresso;
* pontuação;
* conquistas.

---

### `/conquistas`

Página de conquistas.

Preparar:

* conquistas desbloqueadas;
* conquistas bloqueadas;
* progresso.

Não criar lógica complexa de desbloqueio agora.

---

### `/ranking`

Página de rankings.

Preparar abas/seções para:

```text
Ranking por galáxia
Ranking por sistema
```

Não criar ranking por laboratório.

---

### `/configuracoes`

Página de configurações do usuário.

Preparar estrutura para:

* preferências;
* áudio/narração;
* interface;
* conta.

---

# 7. NAVEGAÇÃO

Criar navegação consistente entre todas as páginas.

Fluxo principal:

```text
Landing
  ↓
Faixa etária
  ↓
Galáxias
  ↓
Galáxia
  ↓
Sistema planetário
  ↓
Planetas
  ↓
Aula/Laboratório
```

Fluxos secundários:

```text
Perfil
Conquistas
Ranking
Configurações
```

Criar breadcrumbs ou equivalente visual quando necessário.

---

# 8. MODELO VISUAL

A interface deve parecer um sistema de exploração espacial, não um dashboard corporativo.

Priorizar:

* grandes áreas visuais;
* mapas;
* planetas;
* galáxias;
* foguete;
* sprites;
* animações simples;
* feedback visual;
* pouco texto;
* navegação intuitiva.

Não preencher a interface com cards genéricos apenas para ocupar espaço.

Evitar aparência de template administrativo.

---

# 9. BONZI BUDDY

Criar componente reutilizável:

```text
BonziBuddy
```

Preparar estados como:

```text
idle
speaking
happy
thinking
warning
help
```

Não implementar sistema real de narração agora.

Deixar interface preparada para futura integração de áudio.

O componente deve aceitar propriedades como:

```text
message
state
visible
position
```

---

# 10. AVATAR

Criar componente reutilizável para o avatar do usuário.

Preparar seleção futura de personagens.

Não implementar sistema complexo de customização.

Usar sprites/imagens.

---

# 11. PROGRESSÃO

Preparar a estrutura visual e de dados para:

```text
Faixa etária
  ↓
Galáxia
  ↓
Sistema
  ↓
Planetas
  ↓
Aulas/Laboratórios
```

Preparar estados:

```text
locked
available
in_progress
completed
```

Não implementar regras pedagógicas de desbloqueio.

Criar apenas a infraestrutura necessária.

---

# 12. GAMIFICAÇÃO

O projeto utiliza:

* pontuação;
* ranking por módulo/galáxia;
* ranking por assunto/sistema;
* conquistas;
* avatar.

A base deve estar preparada para isso.

Não implementar ainda:

* cálculo real de pontuação de laboratório;
* regras de conquista;
* progressão baseada em conclusão;
* ranking real de usuários.

Criar apenas modelos, componentes e contratos de API necessários para evolução futura.

---

# 13. API

Criar API REST organizada.

Exemplo:

```text
GET    /api/age-ranges
GET    /api/galaxies
GET    /api/galaxies/:id
GET    /api/systems
GET    /api/systems/:id
```

Preparar endpoints futuros sem implementar lógica:

```text
/api/lessons
/api/labs
/api/progress
/api/scores
/api/achievements
/api/rankings
/api/users
```

Use controllers finos.

Exemplo:

```text
controller → service → repository
```

Nunca colocar SQL/Supabase diretamente no controller.

---

# 14. FRONTEND

Organizar componentes reutilizáveis.

Estrutura aproximada:

```text
frontend/
  app/
  components/
    layout/
    navigation/
    space/
    bonzi/
    avatar/
    progress/
    gamification/
  services/
  hooks/
  types/
  public/
    sprites/
    backgrounds/
    characters/
    planets/
    galaxies/
```

Adequar ao padrão real do projeto.

Não criar abstrações desnecessárias.

---

# 15. BACKEND

Estrutura aproximada:

```text
backend/
  app/
    controllers/
    services/
    repositories/
    models/
    routes/
    config/
  run.py
  requirements.txt
```

Manter responsabilidades separadas.

Repository = acesso a dados.

Service = regras de negócio.

Controller = HTTP/request/response.

---

# 16. RESPONSIVIDADE

Preparar para:

* desktop;
* notebook;
* tablet;
* celular

Prioridade inicial:

**desktop**, pois o projeto será apresentado em uma feira de tecnologia.

---

# 17. DADOS INICIAIS

Inserir no Supabase apenas:

### Faixas

```text
13 anos ou menos
14 anos ou mais
```

### Galáxias

```text
Internet e Web
API REST
```

### Sistemas

Internet e Web:

```text
Dispositivos e conexão
Endereços e sites
Navegador e páginas Web
Comunicação e segurança
```

API REST:

```text
Conhecendo uma API
Requisições HTTP
Entendendo os dados
API em situações reais
```

Não criar conteúdos de aulas.

Não criar conteúdos de laboratórios.

Não implementar os 32 conteúdos descritos na documentação.

---

# 18. O QUE NÃO FAZER

Não:

* implementar aulas;
* implementar laboratórios;
* criar exercícios;
* criar quizzes;
* criar puzzles;
* criar simuladores;
* criar conteúdo pedagógico;
* criar narrações reais;
* criar sistema real de pontuação;
* criar algoritmo real de ranking;
* criar regras completas de conquistas;
* instalar bibliotecas de ícones;
* usar ícones como substitutos de sprites;
* criar backend duplicado no Next.js;
* adicionar dependências sem necessidade;
* superengenheirar a solução.

---

# 19. CRITÉRIO DE IMPLEMENTAÇÃO

Antes de codificar:

1. Inspecione o repositório existente.
2. Preserve o que já funciona.
3. Identifique stack e estrutura atual.
4. Adapte a implementação em vez de recriar o projeto sem necessidade.
5. Se estiver vazio, faça o scaffolding mínimo necessário.

Depois implemente:

```text
1. estrutura do projeto
2. Supabase
3. backend Flask
4. repositories
5. services
6. controllers
7. API
8. frontend
9. páginas
10. navegação
11. dados iniciais
12. componentes visuais reutilizáveis
```

---

# 20. ECONOMIA DE TOKENS

Trabalhe de forma objetiva.

Regras:

* não explique cada alteração;
* não repita contexto já presente neste prompt;
* não gere documentação extensa;
* não crie arquivos desnecessários;
* reutilize componentes;
* prefira soluções simples;
* evite dependências novas;
* não refatore código não relacionado;
* não faça mudanças cosméticas sem necessidade;
* implemente em blocos coesos;
* após cada grande etapa, valide rapidamente e continue;
* só pare quando a base estiver funcional.

Ao final, responda somente com:

```text
IMPLEMENTADO
```

seguido de no máximo:

```text
- resumo do que foi criado
- comandos para executar frontend/backend
- variáveis de ambiente necessárias
- pendências exclusivamente relacionadas a aulas/laboratórios
```

Sem explicações longas.

---

# 21. DEFINIÇÃO DE PRONTO

A tarefa está concluída quando:

* frontend inicia;
* backend inicia;
* frontend consegue consumir o Flask;
* Flask consegue acessar Supabase;
* faixas etárias estão cadastradas;
* galáxias estão cadastradas;
* sistemas planetários estão cadastrados;
* todas as páginas existem;
* navegação funciona;
* estrutura futura de planetas/aulas/laboratórios está preparada;
* nenhuma aula foi implementada;
* nenhum laboratório foi implementado;
* nenhuma biblioteca de ícones foi utilizada;
* a interface usa sprites/imagens;
* arquitetura Controller → Service → Repository está respeitada;
* nenhum segredo está hardcoded.

**Prioridade absoluta: base sólida, simples, extensível e funcional.**

Não tente “adiantar” a implementação pedagógica. O objetivo desta etapa é construir somente a plataforma sobre a qual as aulas e laboratórios serão adicionados posteriormente.
