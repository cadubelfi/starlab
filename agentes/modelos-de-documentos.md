# Modelos de documentos

> Preencha com os seus modelos e suba nos arquivos do Projeto "Clínica". O agente Documentos usa só o que está aqui.
> Campos entre {chaves} são preenchidos pelo agente; o resto é o seu texto, que ele não muda.
> Não há textos jurídicos ou clínicos prontos aqui de propósito: use os modelos que você já usa ou os do seu CRO.

## Cabeçalho e rodapé (todos os documentos)

```text
[Nome da clínica] · [endereço] · [telefone]

...documento...

{cidade}, {data por extenso}

______________________________
[Nome do(a) dentista] · CRO [número]/[UF]
```

## Receita

```text
Paciente: {nome completo}

{medicamento 1, concentração} ............ {quantidade}
{posologia exatamente como ditada}

{medicamento 2, se houver}
```

## Atestado odontológico

```text
Atesto, para os devidos fins, que {nome completo}, [CPF {cpf}, se você usa], esteve sob meus cuidados profissionais em {data}, das {hora início} às {hora fim}, devendo afastar-se de suas atividades por {número de dias ditado} dia(s).
{CID: só se o paciente pediu ou autorizou}
```

## Declaração de comparecimento

```text
Declaro que {nome completo} compareceu a atendimento odontológico nesta clínica em {data}, das {hora início} às {hora fim}.
```

## Pedido de exame de imagem

```text
Paciente: {nome completo}
Solicito: {exame ditado} · Região/dente: {região ou dente}
Indicação: {indicação ditada}
```

## Encaminhamento

```text
Encaminho {nome completo} a {especialidade ou profissional ditado}, para {motivo ditado}.
```

## Termos de consentimento

> Um termo por procedimento, com o seu texto aprovado. O agente só preenche nome, data, procedimento e dente.

### Termo · [procedimento, ex.: extração de siso]

```text
[cole aqui o texto integral do seu termo]

Paciente: {nome completo} · Procedimento: {procedimento} · Dente/região: {dente}
{cidade}, {data}

______________________________        ______________________________
Paciente ou responsável                [Nome do(a) dentista] · CRO
```

## Autorização de uso de imagem

```text
[cole aqui o texto da sua autorização]
```
