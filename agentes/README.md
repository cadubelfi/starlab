# Agentes da clínica

Instruções prontas para montar os agentes do mapa "Clínica odontológica sem secretária" no **Claude Desktop**, usando o [conector da Clinicorp](../clinicorp-mcp/).

| Arquivo | O que é | Onde vai |
| --- | --- | --- |
| [`00-cerebro.md`](00-cerebro.md) | Cérebro da Clínica: escolhe o roteiro e aplica as regras | Instruções do projeto |
| [`dados-da-clinica.md`](dados-da-clinica.md) | Endereço, horários, valores, IDs da Clinicorp, duração das sessões | Arquivos do projeto (preencha antes) |
| [`01-whatsapp.md`](01-whatsapp.md) | Responde mensagens de pacientes que você cola | Arquivos do projeto |
| [`02-agenda.md`](02-agenda.md) | Horários livres, marcação, confirmação, lista de espera | Arquivos do projeto |
| [`03-anamnese.md`](03-anamnese.md) | Link da ficha de saúde e resumo de uma página para o dentista | Arquivos do projeto |
| [`04-orcamento.md`](04-orcamento.md) | Orçamento a partir do plano do dentista e acompanhamento dos que ficaram em aberto | Arquivos do projeto |
| [`tabela-de-procedimentos.md`](tabela-de-procedimentos.md) | Preços, sessões e textos aprovados; o que cada convênio cobre | Arquivos do projeto (preencha antes) |
| [`05-documentos.md`](05-documentos.md) | Receita, atestado, declaração, termo, pedido de exame e encaminhamento, em rascunho | Arquivos do projeto |
| [`modelos-de-documentos.md`](modelos-de-documentos.md) | Os seus modelos de documento | Arquivos do projeto (preencha antes) |
| [`07-pos-procedimento.md`](07-pos-procedimento.md) | Orientações, contato no dia seguinte, retorno e avaliação no Google | Arquivos do projeto |
| [`orientacoes-pos-procedimento.md`](orientacoes-pos-procedimento.md) | Suas orientações aprovadas, por procedimento | Arquivos do projeto (preencha antes) |
| [`06-cobranca.md`](06-cobranca.md) | Sinal, parcelas, lembretes gentis, comprovantes e dados do recibo | Arquivos do projeto |
| [`08-manutencao.md`](08-manutencao.md) | Retornos (limpeza, ortodontia, revisões) e reativação de pacientes | Arquivos do projeto |
| [`09-laboratorio.md`](09-laboratorio.md) | Prazos de próteses e alinhadores antes da instalação | Arquivos do projeto |
| [`controle-laboratorio.md`](controle-laboratorio.md) | Tabela dos trabalhos enviados ao laboratório | Arquivos do projeto (troque quando o agente devolver atualizada) |
| [`10-toda-manha.md`](10-toda-manha.md) | Página do dia | Arquivos do projeto |

| Etapa | Agentes | Situação |
| --- | --- | --- |
| 1 | Cérebro, WhatsApp, Agenda, Toda manhã | Pronta |
| 2 | Anamnese, Orçamento | Pronta |
| 3 | Documentos, Pós-procedimento | Pronta |
| 4 | Cobrança, Manutenção, Laboratório | Pronta |

**Limites da API:**
- A Clinicorp não expõe a ficha de anamnese pela API, então você cola as respostas ou anexa o arquivo na conversa.
- O conector lê orçamentos mas não cria: o agente monta o rascunho e você lança na Clinicorp.
- Documentos não são criados na Clinicorp: o agente devolve o texto, e você assina e emite pelo seu receituário ou pelo sistema.
- O conector não dá baixa em pagamento nem altera valores: a Cobrança só lê e prepara mensagens.
- A API não tem lista de "retornos vencendo": a Manutenção procura na agenda de meses atrás, uma semana por vez.
- Não há controle de laboratório na API: ele fica em `controle-laboratorio.md`.

**Limites do Claude Desktop:**
- O Projeto não lembra o que foi feito em outras conversas. Antes de um segundo lembrete de cobrança ou de retorno, o agente pergunta se o primeiro já foi enviado.
- O agente não edita arquivos do Projeto. Quando o controle de laboratório muda, ele devolve a tabela inteira para você trocar o arquivo (ou você mantém a tabela numa planilha e cola na conversa).

**Textos clínicos e jurídicos:** `modelos-de-documentos.md` e `orientacoes-pos-procedimento.md` vêm sem termos de consentimento e sem orientações prontas, de propósito. Use os textos que você já usa ou os recomendados pelo seu CRO.

## Por que um Projeto só

No Claude Desktop, um Projeto não chama outro. Por isso o Cérebro fica nas Instruções do projeto e os roteiros dos agentes ficam nos arquivos do mesmo Projeto. A cada pedido, o Cérebro segue o roteiro certo. Assim você fala com um lugar só, como no mapa.

## Montagem (cerca de 20 minutos)

1. **Instale o conector da Clinicorp** no Claude Desktop, seguindo o [README do conector](../clinicorp-mcp/README.md). Deixe `CLINICORP_GRAVACOES_LIBERADAS` vazio por enquanto.
2. **Descubra os IDs:** numa conversa nova, peça *"Liste as clínicas e os profissionais da Clinicorp."* Anote os IDs.
3. **Preencha os cinco modelos:** `dados-da-clinica.md`, `tabela-de-procedimentos.md`, `modelos-de-documentos.md`, `orientacoes-pos-procedimento.md` e `controle-laboratorio.md`. Troque tudo o que está entre colchetes, inclusive os IDs. Para os nomes dos procedimentos, peça *"Liste os procedimentos da Clinicorp."*
4. **Crie o Projeto "Clínica"** no Claude Desktop.
5. **Instruções do projeto:** cole o bloco de texto de `00-cerebro.md` (só o que está dentro do bloco).
6. **Arquivos do projeto:** suba os cinco modelos e os dez roteiros (`01-whatsapp.md` a `10-toda-manha.md`).
7. **Teste:** use as mensagens de teste de cada arquivo, na ordem da numeração, começando pelo Cérebro.

**Já montou uma etapa anterior?** Faça o seguinte:

1. Cole o `00-cerebro.md` novo nas Instruções do projeto.
2. Preencha os campos novos de `dados-da-clinica.md` e suba esse arquivo de novo.
3. Suba os arquivos que ainda não estão no Projeto. A etapa 2 traz `tabela-de-procedimentos.md`, `03-anamnese.md` e `04-orcamento.md`. A etapa 3 traz `05-documentos.md`, `modelos-de-documentos.md`, `07-pos-procedimento.md` e `orientacoes-pos-procedimento.md`. A etapa 4 traz `06-cobranca.md`, `08-manutencao.md`, `09-laboratorio.md` e `controle-laboratorio.md`, e atualiza `02-agenda.md` e `10-toda-manha.md` (suba os dois de novo).

## Checklist antes de usar com pacientes

- [ ] O Cérebro lista clínicas e profissionais da Clinicorp no teste.
- [ ] O WhatsApp não dá preço de tratamento, não indica remédio e coloca URGENTE no topo diante de rosto inchado.
- [ ] A Agenda só oferece horários que a Clinicorp mostrou livres, com a duração certa.
- [ ] A Anamnese coloca no topo os pontos marcados na ficha e não interpreta radiografia nem sugere conduta.
- [ ] O Orçamento usa só os preços da tabela, pergunta quando o plano está incompleto e as contas das parcelas fecham com o total.
- [ ] Os Documentos saem sempre como rascunho, só com o que foi ditado, e perguntam quando falta dose, duração ou dias de afastamento.
- [ ] O Pós-procedimento usa só as orientações aprovadas, coloca URGENTE diante de sinais de alerta e pede avaliação só ao fim do tratamento.
- [ ] A Cobrança não inventa juros ou multa, pergunta antes de um segundo lembrete e lembra você de dar baixa na Clinicorp.
- [ ] A Manutenção pula quem já tem algo marcado e quem está em "não contatar", sem falar em problema nem promoção.
- [ ] O Laboratório devolve a tabela inteira atualizada e marca como risco as instalações antes da entrega prometida.
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
