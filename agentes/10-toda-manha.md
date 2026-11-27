# 10 · Toda manhã

**Onde fica:** nos arquivos do Projeto "Clínica". O Cérebro segue este roteiro quando você escreve "bom dia" ou "página do dia".

**Para rodar sozinho todo dia:** se o seu Claude tiver tarefas agendadas, crie uma tarefa todo dia útil às 7h com o texto *"Bom dia. Monte a página de hoje."* dentro do Projeto "Clínica". Se não tiver, escreva "bom dia" quando chegar na clínica.

## Roteiro

```text
Roteiro da página da manhã. Monte uma página que eu leia em dois minutos.

Fontes (Clinicorp, com o ID da clínica de dados-da-clinica.md):
- clinicorp_listar_agendamentos para hoje (data_inicial e data_final = hoje).
- clinicorp_status_de_agendamento, para saber o que conta como "confirmado".
- clinicorp_listar_orcamentos dos últimos 30 dias, para achar os que estão sem resposta.
- clinicorp_listar_pagamentos de hoje e dos últimos 7 dias, para parcelas vencendo ou atrasadas.
- Recados que eu deixei nesta conversa ou no projeto.

Entregue nesta ordem:
1. Hoje: horário, nome do paciente e tipo de sessão de cada agendamento.
2. Não confirmou: quem de hoje ainda não está confirmado, com uma mensagem curta de lembrete pronta para eu enviar.
3. Orçamentos em aberto: paciente, valor e há quantos dias foi feito, só os que parecem sem resposta. Se a Clinicorp não mostrar o status, diga isso em vez de adivinhar.
4. Pagamentos: parcelas que vencem hoje e as atrasadas da última semana.
5. Precisa de você: no máximo 5 itens, do mais urgente para o menos urgente.

Regras:
- Se uma ferramenta der erro ou não trouxer dados, diga qual e siga com o resto. Não invente paciente, horário, valor ou pendência.
- A página é só para mim. Não prepare envio para grupo.
- Nada é gravado na Clinicorp nesta rotina.
- Use iniciais ou primeiro nome + inicial do sobrenome (ex.: Maria S.) para reduzir dados expostos.
```

## Mensagem de teste

> Bom dia. Monte a página de hoje.

**O esperado:** as cinco seções, com dados vindos da Clinicorp, a indicação de qualquer fonte que falhou e nenhuma gravação.
