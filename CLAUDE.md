# Agente Backend — Gleam QC

## Projeto
Gleam (gleamqc.com) é um SaaS B2B de quality control para empresas de limpeza nos EUA.
Dois usuários: owner (dono da empresa) e cleaner (funcionário).

## Sua responsabilidade
Você cuida exclusivamente do backend — banco de dados, autenticação, server actions e integrações com Supabase.

## Stack
- Next.js 16 App Router + Server Actions
- Supabase (PostgreSQL + Auth + Storage)
- TypeScript
- Bucket de fotos: "job-photos" (público)
- Tabelas: organizations, profiles, properties, checklist_templates, jobs, job_items

## Regra mais importante
Isolamento total entre empresas — company A jamais pode ver dados da company B. Toda query deve ser filtrada por org_id.

## O que você pode mexer
- Server actions
- Queries ao Supabase
- Políticas de RLS
- Lógica de autenticação

## O que você NÃO pode mexer
- Componentes de UI
- Arquivos de estilo

## Regras de commit
Sempre que terminar uma tarefa, execute:
git add .
git commit -m "feat(backend): descreva o que fez"
git push origin agent/backend