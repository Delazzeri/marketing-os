# CLAUDE.md

Guidance for Claude Code neste repositório.

## Visão geral

**Marketing OS** é um Work OS (linha Monday.com) pra **agências/freelancers que gerenciam múltiplos clientes** — substitui planilha + WhatsApp + Trello solto.

Base de dados sempre a mesma (Boards → Groups → Items → Columns), mas os diferenciais focam na dor real do nicho: **Portal do Cliente** (link read-only, sem cadastro), itens recorrentes e horas/orçamento nativos (Fase 2), e views priorizadas pro caso de uso real — **Tabela + Calendar**, não Kanban/Gantt genéricos.

> v1 é mono-workspace (uso próprio, membros manuais); schema já pronto pra multi-tenant.

### Roadmap (não implementar fora de fase sem alinhar antes)

- **Fase 1 (este doc)**: Boards/Groups/Items, colunas Texto/Status/Data/Link/Pessoa, views Tabela+Calendar, painel de item (updates/@menções/anexos), Portal via token, 4 automações-receita, notificação in-app.
- **Fase 2**: Kanban, barra de resumo por grupo, Gantt, Dashboards, recorrência, horas/orçamento, colunas Número/Moeda/Arquivo.
- **Fase 3**: Automation builder visual, cobrança, real-time, multi-tenant público, integrações.

## Stack

Next.js (App Router) · TypeScript strict · Tailwind + shadcn/ui · Framer Motion (`layoutId` linha→modal) · `dnd-kit` (reorder de item — *assunção, remover se não fizer sentido*) · Supabase (Postgres+Auth+Storage) · Vercel · `lucide-react` · ESLint+Prettier. Sem i18n por enquanto (nicho é BR, só PT).

## Modelo de dados (Supabase)

**Regra central**: nunca criar coluna fixa em `items` por tipo de campo. Só `title`, `position`, `created_by`, `created_at` são core — tudo definido pelo usuário (Status, Data, Link, Pessoa...) vive em `items.values` (jsonb), mesmo princípio do `project_links` do antigraviity.

- `workspaces` — id, name, slug, created_at
- `workspace_members` — id, workspace_id, user_id (→`auth.users`), role (owner|member) — v1: 1 workspace, membros manuais
- `boards` — id, workspace_id, name, slug, position
- `groups` — id, board_id, name, color, position
- `items` — id, board_id, group_id, title, position, **values (jsonb)**, created_by, created_at
- `columns` — id, board_id, name, type (text|status|date|link|person), config (jsonb), position
- `views` — id, board_id, name, type (table|calendar), config (jsonb: filtros, ordenação, date_column_id, color_column_id) — N views por board, exibidas como abas
- `item_updates` — id, item_id, author_id, body, mentioned_user_ids (uuid[]) — sem separação interno/cliente, tudo visível no Portal
- `item_attachments` — id, item_id, file_url, file_name, uploaded_by
- `automations` — id, board_id, trigger_type (status_changed|due_date_passed|item_created), trigger_config (jsonb), action_type (notify_assignee|mark_overdue|show_in_portal_update|set_default_assignee), action_config (jsonb), enabled
- `notifications` — id, user_id, type, payload (jsonb), read
- `portal_tokens` — id, board_id, token, expires_at, revoked_at — v1: token = 1 board = 1 cliente

4 automações-receita do v1: status→X notifica responsável · prazo vencido→marca atrasado · status="Concluído"→gera update visível no Portal · item criado num Group→responsável padrão.

## Sistema de colunas

`lib/column-types/registry.ts` é o ponto central de extensibilidade — cada tipo declara validação (Zod), render na Tabela e render no Calendar (se aplicável). Tipos v1: `text.ts`, `status.ts`, `date.ts`, `link.ts`, `person.ts`.

**Adicionar um tipo novo**: enum no Postgres → arquivo em `lib/column-types/` implementando `{validate, renderTableCell, renderCalendarBadge?}` → registrar no `registry.ts`. UI de criação de coluna e schema de `items` não mudam.

## Estrutura de rotas

```
app/
  (app)/[workspaceSlug]/
    boards/[boardId]/
      page.tsx                            # board, view ativa
      @modal/(.)items/[itemId]/page.tsx   # item como modal (intercepting route)
      items/[itemId]/page.tsx             # item como página completa
    settings/page.tsx
  (portal)/portal/[token]/page.tsx        # público, sem auth
  auth/login/page.tsx
components/  boards/ items/ columns/ views/ automations/ portal/ ui/
lib/  actions/ validation/ column-types/ types.ts
supabase/migrations/
```

Item usa **intercepting + parallel routes** (mesmo padrão do antigraviity): clique na linha abre modal preservando contexto; acesso direto à URL renderiza a página completa.

## Segurança: Workspace vs Portal

- **`(app)`**: Supabase Auth + RLS real via `workspace_members`/`auth.uid()` — RLS é o escudo principal, nunca só checagem de UI/middleware.
- **`(portal)`**: roda inteiramente em Server Component. Token validado no servidor (existe/não expirou/não revogado), query escopada explicitamente por `board_id` — nunca vira claim de RLS pro client-side, nunca expõe chave que permita query direta do browser.

## Convenções

- TS estrito, sem `any` · componentes `PascalCase`, hooks `camelCase` com prefixo `use`
- Server Components por padrão; `'use client'` só com estado/Framer Motion/listeners
- Server Actions em `lib/actions/[feature].ts` + Zod em `lib/validation/[feature].ts` + `useActionState`, erros como `{error: string}`
- Upload Storage segue o padrão `uploadMedia` do antigraviity (path prefixado, `upsert: false`)
- Segredos só via `.env.local` · commits/branches em inglês

## O que NÃO fazer

- Coluna fixa em `items` por tipo de campo — sempre `columns` + `items.values`
- Kanban/Gantt/Dashboards/recorrência/horas/colunas Número-Moeda-Arquivo sem alinhar (Fase 2)
- Automation builder visual (v1 é receita fixa)
- Portal dependendo de RLS-por-token como claim direta — validação é no servidor
- i18n/`next-intl`/`[locale]` sem necessidade confirmada
- Renderizar dados de workspace ou Portal sem checagem no servidor
- Commitar chaves/segredos

## Comandos

```bash
npm run dev / build / start / lint / typecheck / format
```

Setup: copiar `.env.example` → `.env.local` com credenciais Supabase → `npm install` → `npm run dev`.

## Debugging Notes

- **`columnTypeRegistry` (de `lib/column-types/registry.ts`, `"use client"`) só pode ser indexado a partir de um Client Component.** Um Server Component puro (sem `"use client"`) que importa e acessa `columnTypeRegistry[type]` direto no render quebra em runtime (`Cannot read properties of undefined`), mesmo passando um `column.type` válido — foi o caso de `PortalTable`/`PortalCalendar`, que precisaram virar `"use client"` mesmo sendo puramente apresentacionais. Renderizar `<Cell />` (o componente client já resolvido) dentro de um Server Component funciona normalmente; o problema é especificamente fazer a leitura `registry[key]` fora de um Client Component.
- **Dark mode não é automático via `prefers-color-scheme`.** `app/globals.css` define `@custom-variant dark (&:is(.dark *))` — todas as classes `dark:` só ativam com uma classe `.dark` explícita em algum ancestral do DOM (padrão shadcn de toggle manual), e nenhum lugar do código aplica essa classe hoje. Isso significa o app sempre renderiza no tema claro, independente da preferência do SO. Implementar um toggle de tema (ex: gravar preferência + aplicar `.dark` no `<html>`) é a forma de ativar o dark mode — ficou fora de escopo do redesign visual atual por decisão explícita.