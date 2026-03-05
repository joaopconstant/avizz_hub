# Prompt de Inicialização — Avizz Hub (Claude Code)

> Cole este prompt no Claude Code ao iniciar uma nova sessão de desenvolvimento.
> Adapte a seção "[FASE ATUAL]" conforme o momento do projeto.

---

## Prompt

Você está desenvolvendo o **Avizz Hub**, uma plataforma interna de gestão comercial da Avizz. Leia o `CLAUDE.md` na raiz do projeto antes de qualquer ação — ele contém a arquitetura completa, as regras de negócio e as restrições que não devem ser quebradas.

**Contexto rápido:**
- Stack: Next.js 15 (App Router) + TypeScript strict + tRPC v11 + Prisma + Neon PostgreSQL + NextAuth.js v5 + shadcn/ui + Tailwind CSS v4
- Sistema mono-tenant (Avizz) com `company_id` em todas as entidades para preparação futura multi-tenant
- Autenticação exclusivamente via Google OAuth restrita ao domínio `@avizz.com.br`
- Toda autorização ocorre em duas camadas: middleware Next.js + procedure tRPC
- Dashboard global visível para todos os roles autenticados (`closer` e `sdr` veem também seus dados pessoais; `operational` vê apenas o consolidado)
- Gestão de Metas: Head visualiza, apenas Admin edita
- SDR e Closer têm mini-painel de metas fixo na sidebar (SDR: Caixa + No-Show / Closer: Caixa + Conversão)
- Campos financeiros (`cash_value`, `net_value`, `future_revenue`) são sempre calculados no servidor, nunca aceitos como input do cliente

---

**[FASE ATUAL] Fase 1 — Fundação (continuação)**

O projeto já tem Next.js 15, shadcn/ui e Tailwind CSS v4 configurados via receita oficial do shadcn. O Google OAuth já está criado no Google Cloud Console (Client ID e Secret disponíveis). **Não refazer nada disso.** Siga exatamente esta sequência a partir do ponto atual:

**Passo 1 — Instalar dependências restantes**

Instale os pacotes necessários de uma vez:
- `prisma` e `@prisma/client`
- `next-auth@beta` (v5)
- `@auth/prisma-adapter`
- `@trpc/server` e `@trpc/client` e `@trpc/react-query` e `@trpc/next`
- `@tanstack/react-query`
- `zod`
- `date-fns`
- `superjson`

**Passo 2 — Configurar variáveis de ambiente**

Criar `.env.local` com as variáveis abaixo (deixar comentário indicando onde cada valor é encontrado):

```
DATABASE_URL=          # Neon → connection string com pgbouncer (pooled)
DIRECT_URL=            # Neon → connection string direta (sem pooler, para migrations)
AUTH_SECRET=           # gerar com: openssl rand -base64 32
AUTH_URL=              # http://localhost:3000 em dev
AUTH_GOOGLE_ID=        # Google Cloud Console → OAuth 2.0 Client ID
AUTH_GOOGLE_SECRET=    # Google Cloud Console → OAuth 2.0 Client Secret
```

Adicionar também `.env.example` com os mesmos campos sem valores, para commitar no repo.

**Passo 3 — Inicializar Prisma e escrever o schema completo**

Rodar `npx prisma init` e substituir o `schema.prisma` gerado pelo schema completo do projeto, com todas as entidades definidas no `CLAUDE.md`:

`Company`, `User`, `Product`, `ProductAuditLog`, `Gateway`, `GatewayRate`, `Goal`, `GoalAuditLog`, `IndividualGoal`, `DailyReport`, `Sale`, `Advance`

Regras obrigatórias do schema:
- Todas as entidades possuem `company_id` (FK → `Company`)
- `datasource db` usa `url = env("DATABASE_URL")` e `directUrl = env("DIRECT_URL")`
- Enums necessários: `UserRole`, `WorkLocation`, `PaymentMethod`, `SaleOrigin`, `RevenueТier`
- Índices em: `user_id`, `report_date`, `sale_date`, `company_id` nas tabelas `DailyReport` e `Sale`
- Constraints unique: `(user_id, report_date)` em `DailyReport`; `(user_id, goal_id)` em `IndividualGoal`; `(gateway_id, installments)` em `GatewayRate`; `(company_id, month)` em `Goal`
- `Sale`: campos `cash_value`, `net_value`, `future_revenue` e `counts_as_sale` são sempre escritos pelo servidor — não colocar `@default` neles, deixar obrigatórios sem default para forçar a passagem explícita no `prisma.sale.create`

Após escrever o schema, rodar:
```
npx prisma migrate dev --name init
npx prisma generate
```

**Passo 4 — Prisma Client singleton**

Criar `src/server/db/index.ts` com o padrão singleton do Prisma para evitar múltiplas instâncias em dev (hot reload). Usar a variável `globalThis` conforme documentação oficial do Prisma + Next.js.

**Passo 5 — NextAuth.js v5**

Criar `src/server/auth.ts` com a seguinte lógica:

- Provider: `Google` com `clientId` e `clientSecret` das env vars
- Adapter: `PrismaAdapter` apontando para o Prisma Client
- Callback `signIn`: se `account.provider === "google"` e o e-mail não terminar com `@avizz.com.br`, retornar `false` (bloqueia antes de qualquer query)
- Callback `jwt`: buscar o usuário no banco pelo e-mail. Se não existir ou `is_active = false`, lançar erro que redireciona para login. Se existir, injetar `token.userId` e `token.role`
- Callback `session`: expor `session.user.id` e `session.user.role` a partir do token
- Exportar `{ handlers, auth, signIn, signOut }`

Criar `src/app/api/auth/[...nextauth]/route.ts` exportando `{ GET, POST }` dos handlers.

Criar `src/app/(auth)/login/page.tsx` com botão "Entrar com Google" usando `signIn("google")`. Se houver `?error=` na URL, exibir mensagem de erro amigável ("Acesso restrito. Use sua conta @avizz.com.br" para `AccessDenied`, mensagem genérica para outros).

**Passo 6 — tRPC**

Criar `src/server/trpc.ts` com:
- Context que extrai a sessão via `auth()` do NextAuth
- `publicProcedure` — sem auth
- `protectedProcedure` — qualquer sessão válida
- `adminProcedure` — `ctx.session.user.role === "admin"`
- `adminOrHeadProcedure` — `admin` ou `head`
- `salesProcedure` — `admin`, `head`, `closer`, `sdr`
- `closerProcedure` — `admin`, `head`, `closer`
- `sdrProcedure` — `admin`, `head`, `sdr`
- `goalsViewProcedure` — `admin`, `head`
- `goalsEditProcedure` — `admin` exclusivo
- `dashboardGlobalProcedure` — `admin`, `head`, `operational`

Criar `src/server/routers/_app.ts` com o router raiz (vazio por ora, apenas a estrutura).

Criar `src/trpc/server.ts` com `createCallerFactory` para uso em React Server Components.

Criar `src/trpc/react.tsx` com `createTRPCReact` e o `TRPCReactProvider` para uso em Client Components.

Criar `src/app/api/trpc/[trpc]/route.ts` com o handler HTTP do tRPC.

**Passo 7 — Middleware de proteção de rotas**

Criar `src/middleware.ts` que:
1. Verifica se o usuário está autenticado. Se não, redireciona para `/login`
2. Para rotas autenticadas, verifica o role contra o mapa de permissões abaixo e redireciona para `/unauthorized` se não tiver acesso:

```
/dashboard           → todos os roles autenticados
/reports             → admin, head, closer, sdr
/rankings            → todos os roles autenticados
/tools/*             → todos os roles autenticados
/management/goals    → admin, head
/management/products → admin
/management/users    → admin
/clients             → admin, head, operational
```

**Passo 8 — Layout base com sidebar**

Criar `src/app/(dashboard)/layout.tsx` com sidebar + header.

A sidebar deve ter:
- Logo/nome do sistema no topo
- Navegação com itens visíveis condicionalmente por role (usar a matriz do `CLAUDE.md`)
- **Mini-painel de metas fixo na parte inferior** para `closer` e `sdr`:
  - Closer: "Meta Caixa" (R$ realizado / R$ meta) + "Conversão" (% atual / % meta)
  - SDR: "Meta Caixa" (R$ realizado / R$ meta) + "No-Show" (% atual / ≤ % limite)
  - Se não houver `IndividualGoal` para o mês corrente: exibir "Meta não definida"
  - Esses valores virão de uma tRPC query `dashboard.getMyGoalsSummary` — criar o router e procedure já nesta fase, mesmo que retorne dados mock por enquanto
- `operational` não vê o mini-painel

O header deve ter: nome do usuário, foto (avatar Google) e botão de logout.

Criar página placeholder `src/app/(dashboard)/dashboard/page.tsx` com texto simples para validar o fluxo.

**Passo 9 — Seeder**

Criar `prisma/seed.ts` com dados de teste:
- 1 `Company`: `{ name: "Avizz" }`
- 5 `User`: um de cada role (`admin`, `head`, `closer`, `sdr`, `operational`), todos com e-mail `@avizz.com.br` e `is_active: true`
- 2 `Product`: `{ name: "Assessoria", counts_as_sale: true, is_active: true, sort_order: 1 }` e `{ name: "Aceleração Plus", counts_as_sale: false, is_active: true, sort_order: 2 }`
- 1 `Gateway`: `{ name: "Pagarme", is_active: true }` com `GatewayRate` de 1x a 6x (taxas aproximadas: 1x=0.0199, 2x=0.0318, 3x=0.0437, 4x=0.0556, 5x=0.0675, 6x=0.0794)
- 1 `Goal` para o mês corrente: `{ cash_goal: 80000, sales_goal: 8 }`

Adicionar o script no `package.json`: `"db:seed": "tsx prisma/seed.ts"`.

**Critério de conclusão desta fase:**

1. `npx prisma migrate dev` roda sem erros e cria todas as tabelas
2. `npm run db:seed` popula o banco sem erros
3. Acessar `http://localhost:3000` redireciona para `/login`
4. Login com conta Google `@avizz.com.br` cadastrada no seed funciona e redireciona para `/dashboard` com a sidebar correta para o role
5. Login com conta Google externa é bloqueado com mensagem de erro na tela de login
6. Login com e-mail `@avizz.com.br` não cadastrado no banco é bloqueado
7. O mini-painel de metas aparece na sidebar para `closer` e `sdr` (pode retornar "Meta não definida" neste momento)

---

> **Para as próximas fases**, substitua o bloco `[FASE ATUAL]` pelo conteúdo correspondente abaixo:

---

### Fase 2 — Relatórios Diários

Implemente o módulo de Relatórios Diários completo:

1. Tela `/reports` com calendário mensal (navegação por meses anteriores)
2. Lógica de cores por status de cada dia conforme `CLAUDE.md` (verde com venda, verde sem venda, laranja hoje, vermelho pendente, cinza feriado, cinza escuro fim de semana, cinza claro futuro)
3. Implementar `src/lib/workdays.ts` com a lista de feriados nacionais BR do ano vigente, funções `isWorkday(date)`, `getWorkdaysInMonth(month)` e `isPendingDay(date, userId)` seguindo estritamente RN-07: feriados não geram pendência
4. Barra de progresso `X/Y dias preenchidos` (Y = dias úteis sem contar feriados como obrigatórios)
5. Modal de preenchimento com formulário dinâmico: campos SDR vs. campos Closer conforme `CLAUDE.md`
6. tRPC procedures em `src/server/routers/reports.ts`: `getMonthCalendar`, `upsertDailyReport`
7. Validações no servidor: rejeitar fins de semana e datas futuras. Aceitar feriados.
8. Visão Admin/Head com filtro por colaborador

---

### Fase 3 — Registro de Venda e Avanço

Implemente o registro de vendas e pipeline:

1. Modal `RegisterSaleModal` com stepper de 4 etapas (Produto → Cliente → Venda → Pagamento)
2. Etapa de pagamento: lógica completa para PIX, Cartão (com preview de taxa em tempo real via `GatewayRate`) e Boleto (entrada obrigatória + aviso)
3. `src/lib/financials.ts`: funções `calcCashValue`, `calcNetValue`, `calcFutureRevenue` seguindo RN-02, RN-03 e RN-04
4. tRPC procedure `sales.create`: calcular os três campos financeiros no servidor (nunca aceitar do cliente), snapshot de `counts_as_sale` do produto (RN-06)
5. Modal `RegisterAdvanceModal` com todos os campos incluindo `status_flags` (multi-select)
6. Automação: ao marcar flag "paid", exibir pop-up de conversão e abrir modal de venda pré-preenchido
7. tRPC procedures em `src/server/routers/advances.ts`: `create`, `update`, `convertToSale`
8. `convertToSale` deve ser uma transação atômica conforme RN-11. Bloquear edição de advances com `is_converted = true` no servidor.
9. Listagem de avanços ativos do Closer

---

### Fase 4 — Dashboard Comercial

Implemente o dashboard completo:

1. Seção de Meta: duas barras de progresso (Caixa e Meta de Vendas — apenas `counts_as_sale = true`). `operational` vê o consolidado global sem dados pessoais.
2. Cinco boxes de projeção com fórmulas do `CLAUDE.md`
3. Funil de conversão com 5 etapas e tags de micro-conversão (dados combinados de `DailyReport` + `Sale`)
4. Painel "Meta x Entregue" em tabela
5. Ranking de SDRs e Closers com regras de cor. Visível para todos os roles incluindo `operational` (somente leitura, sem filtro de usuário individual)
6. Modal de detalhes do colaborador (clique no card do ranking)
7. Seção de Insights (admin/head): 6 cards com breakdown de "Válidas vs Upsells", drill-down em modal
8. Sub-views: Histórico MoM com Δ%, Perfil de Clientes ordenado por Total DESC, Composição por Prazos com TME e insight dinâmico
9. Filtros globais por período e por usuário
10. tRPC procedures em `src/server/routers/dashboard.ts`: `getSummary`, `getFunnel`, `getRankings`, `getInsights`, `getMyGoalsSummary` (retorna Meta Caixa + No-Show para SDR, ou Meta Caixa + Conversão para Closer — usado pelo mini-painel da sidebar)

---

### Fase 5 — Gestão de Metas

Implemente o módulo de metas:

1. Tela `/management/goals` com barras macro + lista sanfonada de meses anteriores — visível para `admin` e `head`
2. Botão "Histórico de Alterações" exibindo `GoalAuditLog` de cada mês — visível para `admin` e `head`
3. Aba 1 (Meta Geral): upsert com geração automática de `GoalAuditLog` antes de salvar (RN-10) — **somente `admin`**. Head vê somente leitura.
4. Aba 2 (Metas Individuais): formulário por colaborador com cascata auto-calculada em tempo real — **somente `admin`**. Head vê somente leitura.
5. Aba 3 (Taxas): configuração de `rate_answer`, `rate_schedule`, `rate_noshow_max`, `rate_close` — **somente `admin`**. Head vê somente leitura.
6. Central de Pendências: colaboradores sem meta + relatórios atrasados (RN-07). Botão "Definir Meta" aparece apenas para `admin`.
7. Bloquear no servidor (procedure `goalsEditProcedure`) qualquer tentativa de escrita por Head, mesmo com acesso à UI.

---

### Fase 6 — Gestão de Produtos e Usuários
**Objetivo:** Admin configura o catálogo comercial e gerencia o acesso da equipe.

1. `/management/products` (**admin exclusivo**): listagem com reordenação, CRUD com toggle `counts_as_sale`. Alterações em campos críticos geram `ProductAuditLog` antes de salvar (RN-12)
2. Gestão de gateways e matriz de taxas por parcela
3. `/management/users` (admin exclusivo): listagem, cadastro (e-mail + role), edição de role, toggle ativo/inativo

---

### Fase 7 — Validação e Deploy

1. Testar RN-01 a RN-12 com dados reais do seeder
2. Testar matriz de permissões: cada role acessando apenas o que lhe é permitido (incluindo tentativas diretas via URL e via chamadas tRPC)
3. Revisar responsividade mobile nas telas de Relatórios e Registro de Venda
4. Configurar variáveis de ambiente na Vercel
5. Deploy com domínio `hub.avizz.com.br`
6. Smoke tests em produção
