# Ficha de anamnese — issue #187

Entrada: perfil Tatuador → Gestão → Ficha de anamnese. O acesso independe da
disponibilidade dos indicadores do dashboard. Cliente preenche seus dados no
formulário acompanhado do profissional; não há envio remoto nesta etapa.

O usuário confirmou que não existe uma tela correspondente no Figma. A tela
reutiliza Header, Input, Button, tipografia, cores e espaçamentos do DESIGN.md.

## Documento de referência

[PDF anexado à issue](https://github.com/user-attachments/files/33284935/Tatuadores_perguntas-respostas.pdf),
item 7, páginas 5 **e 6**:

| Exigência | Campo / comportamento |
| --- | --- |
| Identificação | Nome completo, nascimento, sexo, identidade e endereço completo |
| Atendimento | Data do atendimento |
| Procedimento | Tipo, data e local do corpo |
| Intercorrências | Texto obrigatório; informar “Nenhuma” quando não houver |
| Menores | Bloqueio de menores de 18 na data do procedimento, conforme ressalva de SP na página 6; autorização parental não libera o atendimento |
| Consentimento | Fotos de todas as páginas do TCLE assinado; confirmação de orientação prévia e entrega da segunda via |
| Produtos | Lista com nome, lote, fabricante, registro Anvisa, fabricação, validade e abertura |
| Profissional | Nome do profissional responsável |

O app não gera um TCLE nem interpreta uma marcação como assinatura. Deve ser
anexado o documento utilizado pelo estabelecimento, assinado previamente ao
procedimento. Não substitui a guarda do documento original.

## Limite com a issue #188

A #187 entrega a interface e a validação; a issue irmã #188 trata dos endpoints.
Nesta entrega os dados e as URIs das imagens ficam **somente na memória da tela**.
Não há AsyncStorage, upload, chamada a endpoint hipotético, gravação de prontuário
ou mensagem de sucesso de salvamento. O aviso aparece antes do preenchimento e
na revisão. Sair com alterações pede confirmação de descarte. Encerrar o app ou
sair da conta também descarta o formulário.

`FichaAnamnese` em `src/services/anamnese.ts` é o modelo do formulário, ainda não
um contrato de API. Na #188: definir DTOs e transporte das imagens; converter as
datas civis DD/MM/AAAA; validar novamente no servidor; vincular cliente e
profissional autenticados; restringir acesso às fichas/anexos; adicionar envio,
falhas recuperáveis, histórico e confirmação real somente após persistência.

## Verificação

- `npm run test:anamnese`: datas, maioridade, produtos, consentimento e ausência de mutação.
- `npx tsc --noEmit`; `npm run lint`.
- Expo: acessar pela Gestão mesmo sem API; revisar vazio; preencher uma ficha de
  adulto; adicionar/remover produtos; anexar/remover páginas; revisar e editar sem
  perder os valores; voltar e cancelar/confirmar descarte; conferir teclado,
  rolagem, fontes ampliadas e larguras de 320–430px.
- Android/iOS: verificar seletor de imagens real e gesto/botão físico de voltar.
- Nenhum dado real de cliente deve ser usado nos testes.

O repositório orienta PRs para `dev`, enquanto a branch padrão é `main`.
`Closes #187` deve acompanhar o PR; o GitHub só aplica o fechamento automático
quando a mudança chega à branch padrão. Não fechar a issue manualmente ao abrir
ou mesclar o PR em `dev`.
