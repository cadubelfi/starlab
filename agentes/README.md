# Agentes da clínica: primeira etapa

Instruções prontas para montar os primeiros agentes do mapa "Clínica odontológica sem secretária" no **Claude Desktop**, usando o [conector da Clinicorp](../clinicorp-mcp/).

| Arquivo | O que é | Onde vai |
| --- | --- | --- |
| [`00-cerebro.md`](00-cerebro.md) | Cérebro da Clínica: escolhe o roteiro e aplica as regras | Instruções do projeto |
| [`dados-da-clinica.md`](dados-da-clinica.md) | Endereço, horários, valores, IDs da Clinicorp, duração das sessões | Arquivos do projeto (preencha antes) |
| [`01-whatsapp.md`](01-whatsapp.md) | Responde mensagens de pacientes que você cola | Arquivos do projeto |
| [`02-agenda.md`](02-agenda.md) | Horários livres, marcação, confirmação, lista de espera | Arquivos do projeto |
| [`10-toda-manha.md`](10-toda-manha.md) | Página do dia | Arquivos do projeto |

Próximas etapas: Anamnese e Orçamento; depois Documentos e Pós-procedimento; por último Cobrança, Manutenção e Laboratório.

## Por que um Projeto só

No Claude Desktop, um Projeto não chama outro. Por isso o Cérebro fica nas Instruções do projeto e os roteiros dos agentes ficam nos arquivos do mesmo Projeto. A cada pedido, o Cérebro segue o roteiro certo. Assim você fala com um lugar só, como no mapa.

## Montagem (cerca de 20 minutos)

1. **Instale o conector da Clinicorp** no Claude Desktop, seguindo o [README do conector](../clinicorp-mcp/README.md). Deixe `CLINICORP_GRAVACOES_LIBERADAS` vazio por enquanto.
2. **Descubra os IDs:** numa conversa nova, peça *"Liste as clínicas e os profissionais da Clinicorp."* Anote os IDs.
3. **Preencha `dados-da-clinica.md`:** troque tudo o que está entre colchetes, inclusive os IDs.
4. **Crie o Projeto "Clínica"** no Claude Desktop.
5. **Instruções do projeto:** cole o bloco de texto de `00-cerebro.md` (só o que está dentro do bloco).
6. **Arquivos do projeto:** suba `dados-da-clinica.md`, `01-whatsapp.md`, `02-agenda.md` e `10-toda-manha.md`.
7. **Teste:** use as mensagens de teste de cada arquivo, nesta ordem: Cérebro, WhatsApp, Agenda, Toda manhã.

## Checklist antes de usar com pacientes

- [ ] O Cérebro lista clínicas e profissionais da Clinicorp no teste.
- [ ] O WhatsApp não dá preço de tratamento, não indica remédio e coloca URGENTE no topo diante de rosto inchado.
- [ ] A Agenda só oferece horários que a Clinicorp mostrou livres, com a duração certa.
- [ ] A Toda manhã avisa quando uma fonte falha, em vez de inventar.
- [ ] Nada foi gravado na Clinicorp durante os testes.
- [ ] O(a) dentista responsável revisou o protocolo de urgência.

## Quando liberar gravações

Depois de duas semanas sem erro nos testes do dia a dia:

1. Acrescente `criar_agendamento` em `CLINICORP_GRAVACOES_LIBERADAS` e configure `CLINICORP_LOG_GRAVACOES`.
2. Atualize a seção "Gravações liberadas" de `dados-da-clinica.md` e suba o arquivo de novo no Projeto.
3. Reinicie o Claude Desktop.
4. Confira o arquivo de registro toda semana.

Mesmo com a gravação liberada, o Cérebro mostra o que vai gravar e espera o seu "pode gravar".
