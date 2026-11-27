# Dados da clínica

> Preencha uma vez e suba este arquivo nos arquivos do Projeto. Todos os agentes leem daqui.
> Troque tudo o que está entre colchetes. Não coloque aqui senhas nem o token da Clinicorp.

## Identificação
- Nome da clínica: [nome]
- Dentista responsável: [nome], CRO [número/UF]
- Especialidades atendidas: [ex.: clínica geral, ortodontia, implantes]

## Endereço e horários
- Endereço: [endereço completo, com ponto de referência]
- Link do mapa: [link]
- Como chegar e estacionar: [texto curto]
- Dias e horários de atendimento: [ex.: segunda a sexta, 8h às 12h e 14h às 19h]

## Valores e pagamento
- Avaliação inicial: [valor]
- Convênios odontológicos aceitos: [lista] (o que cada um cobre fica em tabela-de-procedimentos.md)
- Formas de pagamento: [ex.: Pix, cartão em até X vezes]
- Desconto à vista: [ex.: nenhum, ou X%]
- Parcelamento: [ex.: cartão em até X vezes sem juros; boleto em até X vezes]
- Sinal para iniciar tratamento: [ex.: nenhum, ou X% do total]
- Valores de tratamento: só depois da avaliação, pelo orçamento.

## Orçamentos
- Validade do orçamento: [ex.: 30 dias]
- Acompanhamento: uma mensagem gentil depois de [ex.: 5] dias sem resposta, uma vez só.

## Ficha de saúde (anamnese)
- Link da ficha: [link do formulário]
- Enviar: [ex.: 2 dias antes da primeira consulta]
- Outros pontos que o(a) dentista quer ver no topo do resumo: [ex.: uso de cigarro, apneia, ansiedade com dentista]

## O que trazer na primeira consulta
- [ex.: documento com foto, carteirinha do convênio, radiografias antigas]

## IDs na Clinicorp
> Para descobrir, peça ao Claude: "Liste as clínicas e os profissionais da Clinicorp."
- ID da clínica: [ID]
- Profissionais que atendem:
  - [nome]: ID [ID]

## Duração de cada tipo de sessão
| Tipo de sessão | Duração |
| --- | --- |
| Avaliação inicial | [ex.: 40 min] |
| Limpeza (profilaxia) | [ex.: 40 min] |
| Restauração | [ex.: 60 min] |
| Canal (cada sessão) | [ex.: 90 min] |
| Manutenção ortodôntica | [ex.: 20 min] |
| Cirurgia ou implante | [ex.: 120 min] |

- Horários reservados para encaixe de urgência: [ex.: 11h30 e 17h30]
- Confirmação da véspera: enviar às [horário]; quem não responder até [horário] entra em "não confirmou".

## Respostas de rotina liberadas (podem sair sem o OK do dentista)
- Endereço, link do mapa e como chegar
- Dias e horários de atendimento
- Valor da avaliação e convênios aceitos
- Mensagem de confirmação da véspera
- [outras que você liberar]

## Gravações liberadas na Clinicorp
> Deve bater com CLINICORP_GRAVACOES_LIBERADAS na configuração do conector.
- [ex.: nenhuma, por enquanto]
