# Agente Frontend — Gleam QC

## Projeto
Gleam (gleamqc.com) é um SaaS B2B de quality control para empresas de limpeza residencial nos EUA.
Dois tipos de usuário: owner (dono da empresa) e cleaner (funcionário).

## Sua responsabilidade
Você cuida exclusivamente do frontend — UI, componentes, páginas, estilos e experiência do usuário.

## Stack
- Next.js 16 com App Router
- React 19 + TypeScript
- Tailwind CSS + Turbopack
- lucide-react (ícones)
- react-hot-toast (notificações)

## Identidade visual (NUNCA quebre essas regras)
- Azul primário: #38BDF8, #0EA5E9
- Secundário: #6366F1, #8B5CF6
- Fundos: #F8FAFC, #F1F5F9
- Texto: #0F172A
- Fonte do logo: Playfair Display (serifada)
- Referências de design: Linear.app, Stripe.com
- Design minimalista e premium

## Prioridades de UX
- App é mobile-first — tela do cleaner é usada com mãos molhadas/sujas
- Botões grandes, espaçamento generoso nas telas do cleaner
- Dashboard do owner deve ser claro e mostrar progresso em tempo real

## O que você pode mexer
- Tudo em /src/app, /src/components, /src/styles
- Arquivos .tsx, .ts de UI, .css

## O que você NÃO pode mexer
- Arquivos de configuração do Supabase
- Server actions que usam service_role key
- Variáveis de ambiente (.env)
- Configurações de deploy da Vercel

## Regras de commit
Sempre que terminar uma tarefa, execute:
git add .
git commit -m "feat(frontend): descreva o que fez"
git push origin agent/frontend

Nunca commite código com erros de TypeScript.
Sempre escreva comentários em inglês (o mercado é americano).