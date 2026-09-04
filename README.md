# Marketing OS

Work OS para agências e freelancers que gerenciam múltiplos clientes — quadros, calendário editorial e aprovações para times de conteúdo, em um só lugar.

**Live:** [marketing-os-liard-three.vercel.app](https://marketing-os-liard-three.vercel.app)
**Stack:** Next.js (App Router) · TypeScript · Supabase · Vercel

> Projeto pessoal, em desenvolvimento — funciona como peça de portfólio.

## Sobre o projeto

Ferramenta de gestão de trabalho inspirada no Monday.com, pensada para times pequenos e freelancers que precisam manter conteúdo, prazos e equipe em sincronia: quadros (boards), calendário editorial e um portal do cliente sem fricção (acesso via link/token, sem exigir cadastro).

Arquitetura mono-tenant, mas com schema já preparado para migrar para multi-tenant no futuro.

## Usuário de teste

Em breve, um usuário de teste estará disponível para qualquer pessoa explorar o produto sem precisar criar conta:

- **Email:** `[email de teste]`
- **Senha:** `[senha de teste]`

## Escopo do v1

- Visões: Tabela e Calendário
- 5 tipos de coluna
- Portal do cliente via link/token compartilhável
- Notificações in-app
- 4 automações fixas (recipes)

## Stack

| Camada     | Escolha               |
| ---------- | ---------------------- |
| Framework  | Next.js (App Router)   |
| Linguagem  | TypeScript              |
| Dados/Auth | Supabase                 |
| Deploy     | Vercel                   |

Arquitetura completa em [CLAUDE.md](./CLAUDE.md).

## Estrutura

```
app/                    # rotas (App Router), incluindo /auth
components/             # componentes de UI
hooks/                  # hooks compartilhados
lib/                    # utilitários e lógica compartilhada
supabase/migrations/    # schema do banco
middleware.ts           # proteção de rotas autenticadas
```

## Getting started

```bash
npm install
cp .env.example .env.local   # credenciais do Supabase
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).
