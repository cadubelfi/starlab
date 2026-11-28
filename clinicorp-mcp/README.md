# Conector MCP da Clinicorp

Conector [MCP](https://modelcontextprotocol.io) que deixa o Claude (no app Claude Desktop) consultar a Clinicorp: agenda, horários livres, pacientes, orçamentos e pagamentos. Ele faz parte do mapa "Clínica odontológica sem secretária".

- **Só leitura por padrão.** Nenhuma ferramenta de gravação aparece para a IA até você liberá-la pelo nome.
- **Nada de apagar, cancelar, remarcar, dar baixa ou mudar valores.** Essas ações não existem no conector.
- **Registro de gravações (opcional):** cada gravação feita pela IA pode ser anotada num arquivo, para você conferir.

> **Requisito:** plano da Clinicorp com o módulo **API Externa**. O Usuário API e o Token API ficam em *Gerenciar Assinatura → Acesso Externo e Integrações → Integrações*.
>
> **Aviso:** a Clinicorp não publica a documentação da API abertamente. Os endpoints daqui foram tirados de um [node n8n da comunidade](https://github.com/PedroHSGuimaraes/n8n-nodes-clinicorp) (MIT) e ainda não foram testados com uma conta real. Confira no Swagger da sua conta (`https://sistema.clinicorp.com/api-docs/`) e comece testando só leitura.

## Ferramentas

| Ferramenta | O que faz | Grava? |
| --- | --- | --- |
| `clinicorp_listar_clinicas` | Clínicas (unidades) e seus IDs | Não |
| `clinicorp_listar_profissionais` | Dentistas e seus IDs; serve como teste de conexão | Não |
| `clinicorp_listar_procedimentos` | Procedimentos cadastrados | Não |
| `clinicorp_horarios_disponiveis` | Horários livres de um profissional num período | Não |
| `clinicorp_listar_agendamentos` | Agenda de uma clínica num período | Não |
| `clinicorp_status_de_agendamento` | Status configurados (agendado, confirmado...) | Não |
| `clinicorp_buscar_paciente` | Paciente por ID, CPF, e-mail, nome ou telefone | Não |
| `clinicorp_agendamentos_do_paciente` | Histórico de agendamentos do paciente | Não |
| `clinicorp_listar_orcamentos` | Orçamentos de um período | Não |
| `clinicorp_ver_orcamento` | Detalhe de um orçamento | Não |
| `clinicorp_listar_pagamentos` | Pagamentos e parcelas de um período | Não |
| `clinicorp_resumo_financeiro` | Resumo financeiro do período | Não |
| `clinicorp_criar_agendamento` | Cria consulta na agenda | Sim, se liberada |
| `clinicorp_confirmar_agendamento` | Marca consulta como confirmada | Sim, se liberada |
| `clinicorp_criar_paciente` | Cadastra paciente novo | Sim, se liberada |
| `clinicorp_adicionar_lead` | Cria lead no CRM | Sim, se liberada |

## Instalação e teste no Claude Desktop

O teste tem quatro etapas: preparar o conector, ligá-lo ao Claude Desktop, testar só a leitura e, por último, as gravações. Tudo roda no seu computador.

### 1. Preparar o conector

Precisa do [Node.js](https://nodejs.org) 20 ou mais novo e do Git. No terminal (no Windows, PowerShell), rode um comando por vez:

```bash
git clone https://github.com/cadubelfi/starlab.git
```

```bash
cd starlab/clinicorp-mcp
```

```bash
npm install
```

```bash
npm run build
```

Para pegar o caminho completo da pasta, use `pwd` no Mac ou Linux, ou `cd` no Windows, e acrescente `/dist/index.js` ao final.

### 2. Ligar ao Claude Desktop

1. No Claude Desktop, abra *Configurações → Desenvolvedor → Editar configuração*. Isso abre o `claude_desktop_config.json`.
2. Cole o bloco abaixo, trocando o caminho e os três valores. Se o arquivo já tiver um `mcpServers`, acrescente só o trecho `"clinicorp": {...}` dentro dele.

   ```json
   {
     "mcpServers": {
       "clinicorp": {
         "command": "node",
         "args": ["/caminho/completo/starlab/clinicorp-mcp/dist/index.js"],
         "env": {
           "CLINICORP_API_USER": "seu-usuario-api",
           "CLINICORP_API_TOKEN": "seu-token-api",
           "CLINICORP_SUBSCRIBER_ID": "seu-id-de-assinante",
           "CLINICORP_GRAVACOES_LIBERADAS": ""
         }
       }
     }
   }
   ```

   - Usuário API, Token API e ID do assinante ficam na Clinicorp, em *Gerenciar Assinatura → Acesso Externo e Integrações*.
   - No Windows, use barras duplas no caminho: `C:\\Users\\voce\\starlab\\clinicorp-mcp\\dist\\index.js`.
   - Deixe `CLINICORP_GRAVACOES_LIBERADAS` vazio por enquanto, para o conector só ler.

3. Feche o Claude Desktop por completo (no Mac, Cmd+Q) e abra de novo.
4. Numa conversa nova, abra o menu de ferramentas e confira se "clinicorp" aparece, com 12 ferramentas.

O token fica só nesse arquivo, no seu computador. Não cole o token em conversas nem em prompts.

### 3. Testar só a leitura, nesta ordem

Compare cada resposta com o que aparece na Clinicorp.

| # | Peça ao Claude | O que confirma |
| --- | --- | --- |
| 1 | "Liste os profissionais da Clinicorp." | Credenciais e conexão |
| 2 | "Liste as clínicas da Clinicorp." | O ID da clínica, usado nos agentes |
| 3 | "Liste os procedimentos da Clinicorp." | Os nomes para a tabela de procedimentos |
| 4 | "Quais agendamentos a clínica [ID] tem amanhã?" | Leitura da agenda e formato de data |
| 5 | "Quais horários o profissional [ID] tem livres na clínica [ID] na próxima semana?" | Horários livres. É o endpoint mais incerto: confira com a agenda real |
| 6 | "Busque o paciente com telefone [um telefone real]." | Busca de paciente |
| 7 | "Liste os orçamentos e os pagamentos dos últimos 30 dias." | Orçamentos e financeiro |

### 4. Testar gravações, só depois que a leitura estiver certa

1. No mesmo arquivo, mude para `"CLINICORP_GRAVACOES_LIBERADAS": "criar_agendamento"` e acrescente `"CLINICORP_LOG_GRAVACOES": "/caminho/gravacoes-clinicorp.jsonl"`.
2. Reinicie o Claude Desktop.
3. Crie um agendamento para um paciente de teste, num horário livre, e confira se ele aparece na Clinicorp.
4. Cancele esse agendamento na própria Clinicorp.

### Se algo der errado

| Sintoma | O que fazer |
| --- | --- |
| "clinicorp" não aparece nas ferramentas | O JSON tem algum erro, como vírgula sobrando ou caminho errado. Abra os logs: no Mac, `~/Library/Logs/Claude/mcp-server-clinicorp.log`; no Windows, `%APPDATA%\Claude\logs` |
| Log diz `node: command not found` | Troque `"node"` pelo caminho completo do Node (no Mac, `which node`; no Windows, `where node`) |
| "Faltam variáveis de ambiente" | Algum dos três valores ficou vazio no bloco `env` |
| HTTP 401 ou 403 | Usuário ou token errados, ou o plano não tem o módulo API Externa |
| HTTP 404 ou 400 numa ferramenta | O endpoint ou os parâmetros diferem da sua conta. Anote a ferramenta e a mensagem de erro (sem dados de pacientes) para corrigir o conector |

Quando a leitura funcionar, monte o Projeto "Clínica" com os agentes, como explica o [README dos agentes](../agentes/README.md).

## Configuração

| Variável | Obrigatória | Para que serve |
| --- | --- | --- |
| `CLINICORP_API_USER` | Sim | Usuário API |
| `CLINICORP_API_TOKEN` | Sim | Token API |
| `CLINICORP_SUBSCRIBER_ID` | Sim | ID do assinante |
| `CLINICORP_GRAVACOES_LIBERADAS` | Não | Gravações liberadas, separadas por vírgula: `criar_agendamento`, `confirmar_agendamento`, `criar_paciente`, `adicionar_lead`. Vazio = só leitura |
| `CLINICORP_LOG_GRAVACOES` | Não | Arquivo `.jsonl` onde cada gravação é anotada (data, ação, dados enviados, resultado) |
| `CLINICORP_MAX_CARACTERES` | Não | Tamanho máximo da resposta entregue à IA (padrão 60000) |
| `CLINICORP_TIMEOUT_MS` | Não | Tempo máximo de espera pela API (padrão 30000) |
| `CLINICORP_BASE_URL` | Não | Endereço da API (padrão `https://api.clinicorp.com/rest/v1`) |

## Implantação segura

1. **Semanas 1 e 2:** deixe `CLINICORP_GRAVACOES_LIBERADAS` vazio. A IA só consulta, e você faz as gravações na Clinicorp.
2. **Depois dos testes:** libere uma ação por vez, começando por `criar_agendamento`, e ligue o `CLINICORP_LOG_GRAVACOES`.
3. **Toda semana:** confira o arquivo de registro.
4. Use junto com as instruções dos agentes (bloco "Usando a Clinicorp" do mapa), que mandam pedir o seu OK antes de qualquer gravação.

**LGPD:** o conector passa dados pessoais e de saúde dos pacientes para a IA. Use uma conta de IA com termos adequados para dados de saúde e informe os pacientes. O arquivo de registro também guarda dados de pacientes: mantenha-o num computador protegido.

## Desenvolvimento

```bash
npm test
```

Os testes simulam a API da Clinicorp; nenhum dado real é usado.
