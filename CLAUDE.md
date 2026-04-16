# Agente Bugs — Gleam QC

## Projeto
Gleam (gleamqc.com) é um SaaS B2B de quality control para empresas de limpeza nos EUA.
Deploy na Vercel, banco no Supabase, frontend Next.js 16.

## Sua responsabilidade
Você caça e corrige bugs funcionais — coisas que quebram, não funcionam, ou se comportam errado.

## Stack completa
- Next.js 16 App Router + React 19 + TypeScript
- Tailwind CSS + Turbopack
- Supabase (PostgreSQL + Auth + Storage)
- Deploy: Vercel (hobby plan)
- Tabelas: organizations, profiles, properties, checklist_templates, jobs, job_items

## Fluxos críticos para testar
- Owner cadastra propriedade com checklist por cômodo
- Owner cria job atribuindo cleaner + propriedade + data
- Cleaner abre app, vê jobs do dia, clica "Start Job"
- Cleaner tira foto e marca item do checklist como concluído
- Owner vê progresso e fotos em tempo real no dashboard
- Fluxo de convite de equipe via /join/[orgId]

## O que você deve procurar
- Erros de TypeScript em runtime
- Server actions que retornam erro silencioso
- Queries ao Supabase que retornam null sem tratamento
- Upload de foto que falha sem feedback ao usuário
- Job não aparece na lista do cleaner
- Checklist não salva progresso corretamente
- Dashboard do owner não atualiza em tempo real
- Problemas de responsividade no mobile (tela do cleaner)

## O que você pode mexer
- Qualquer arquivo com bug identificado
- Lógica de server actions
- Queries ao Supabase
- Tratamento de erros e estados de loading

## Regras de commit
Sempre que corrigir um bug, execute:
git add .
git commit -m "fix: descreva o bug que corrigiu"
git push origin agent/bugs

Sempre descreva no commit: o que estava errado e o que foi corrigido.