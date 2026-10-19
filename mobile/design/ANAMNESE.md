# Ficha de anamnese — issue #187

Entradas: Cliente → Reservas → Detalhes da sessão → Anamnese; Tatuador →
Agenda → Detalhes da sessão → Anamnese. A agenda permite consultar semanas
anteriores para acessar atendimentos concluídos. Não há entrada pela Gestão.

Cada abertura leva `sessionId` e `appointmentId` da sessão selecionada. O cliente
preenche identificação e anexa o termo após a confirmação da reserva, antes do
início do atendimento. O tatuador preenche procedimento, produtos e confirmações
somente quando a sessão está marcada como `concluida` e sua data não é futura.
A passagem do tempo não equivale à conclusão. A interface explica os bloqueios.
Datas efetivas do procedimento não são preenchidas automaticamente pela reserva.

As duas partes possuem validações próprias: o cliente não preenche informações
técnicas; o tatuador não preenche dados pessoais nem anexa o documento pelo cliente.
A maioridade do cliente é conferida na data reservada. A orientação e assinatura
do termo devem ocorrer antes do procedimento; a conferência posterior pelo
tatuador registra esse fato, sem adiar o consentimento para depois do atendimento.

O usuário confirmou que não existe uma tela correspondente no Figma e pediu
o padrão visual do dashboard do estúdio. A tela reutiliza seus tokens de cores
e tipografia, com campos próprios para a ficha. O cabeçalho e os
botões da ficha permitem quebra de linha, inclusive com fonte ampliada.

## Responsividade

- Conteúdo centralizado, com largura máxima de 560px.
- Margens de 16px abaixo de 360px e de 24px nas demais larguras.
- Botões exclusivos da anamnese: área mínima de 48px, rótulo em Inter 16/24,
  padding 12px vertical e 16px horizontal; altura cresce com o texto. Sem
  `numberOfLines`, reticências ou redução automática da fonte.
- Título flexível em Inter 20/28; ação de voltar com área de 48px.
- Seções: número em Inter 14/20 e título em Inter 16/24, sem altura fixa.
- Confirmações com caixa de seleção, marca de seleção, borda roxa e estado
  escrito; toda a linha é clicável, com descrição e sem limite de linhas.
- Confirmação de descarte rolável, respeitando as áreas seguras superior e inferior.
- Valores revisados, erros e nomes de anexos não têm limite de linhas.

Verificação visual exigida antes de declarar esta etapa concluída: larguras de
320, 360, 390, 430, 768 e 1024px; fonte padrão e ampliada a 200%; orientação
horizontal; nomes, endereços e nomes de arquivos longos; teclado aberto; revisão
e confirmação de descarte. Checagem de tipos e testes de regras não substituem
essa conferência visual nem o teste no dispositivo.

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
| Consentimento | Modelo original para baixar; PDF ou fotos de todas as páginas de uma via assinada; outra via com o cliente; confirmação de orientação prévia e entrega da segunda via |
| Produtos | Lista com nome, lote, fabricante, registro Anvisa, fabricação, validade e abertura |
| Profissional | Nome do profissional responsável |

O modelo fornecido pelo solicitante está em `assets/documents/tcle-modelo.pdf`,
incluído sem alterações de conteúdo. A seção do cliente permite baixar o modelo:
no navegador, download do PDF; no celular, menu de compartilhamento para salvar
ou imprimir. Orienta imprimir duas vias, preencher e assinar antes do atendimento,
anexar uma via e guardar a outra com o cliente. O app não interpreta uma marcação
como assinatura nem oferece assinatura digital. Não substitui a guarda do original.

Anexos aceitos: PDF e fotos, até 10 arquivos de até 10 MB cada. PDFs são identificados
pelo nome e tipo na revisão, sem serem renderizados como imagens. O modelo baixado
não conta como anexo assinado. A seleção da via assinada continua em memória;
upload e persistência permanecem na #188.

## Limite com a issue #188

A #187 entrega a interface e a validação; a issue irmã #188 trata dos endpoints.
Nesta entrega os dados e as URIs das imagens ficam **somente na memória da tela**.
Não há AsyncStorage, upload, chamada a endpoint hipotético, gravação de prontuário
ou mensagem de sucesso de salvamento. O aviso aparece antes do preenchimento e
na revisão. Sair com alterações pede confirmação de descarte. Encerrar o app ou
sair da conta também descarta o formulário.

O vínculo nesta etapa é somente o contexto de navegação. Não há compartilhamento
real entre contas, envio de notificações ou ação para concluir atendimento.
As listas de reservas e sessões dependem da API existente. As regras de interface
usam o status recebido na abertura; a #188 deve conferir novamente o estado,
o participante autenticado e as permissões em toda leitura e gravação.

`FichaAnamnese` em `src/services/anamnese.ts` é o modelo do formulário, ainda não
um contrato de API. Na #188: definir DTOs e transporte das imagens; converter as
datas civis DD/MM/AAAA; validar novamente no servidor; vincular cliente e
profissional autenticados; restringir acesso às fichas/anexos; adicionar envio,
falhas recuperáveis, histórico e confirmação real somente após persistência.

## Verificação

Verificação em instalação limpa das dependências: 21 testes passaram; TypeScript
sem erros; ESLint dos arquivos alterados sem erros, com dois avisos preexistentes
de atualização de estado em efeitos na Agenda. O PDF incluído foi comparado ao
original e é idêntico. A validação visual e os seletores nativos continuam pendentes.

O visual segue os tokens já usados no dashboard do estúdio: fundo bege,
cartões brancos, fonte Inter e ações roxas. A ficha usa estilos explícitos,
campos com estado de foco e erro e títulos que podem quebrar linha. Não houve
acesso ao conteúdo do link do Figma fornecido; a referência verificada foi o
dashboard existente no repositório. A conferência visual no navegador e em
dispositivo continua necessária.

- `npm run test:anamnese`: 21 casos de datas, maioridade, produtos, consentimento,
  ausência de mutação, separação de partes e liberação por perfil/status/horário.
- `npx tsc --noEmit`; `npm run lint`.
- Expo, com API e sessões de teste: acessar pelas Reservas como cliente e pela
  Agenda como tatuador; conferir bloqueio em reserva não confirmada e atendimento
  não concluído, inclusive após a data; revisar vazio; preencher uma ficha de
  adulto; adicionar/remover produtos; anexar/remover páginas; revisar e editar sem
  perder os valores; voltar e cancelar/confirmar descarte; conferir teclado,
  rolagem, fontes ampliadas e larguras de 320–430px.
- Android/iOS: verificar seletor de imagens real e gesto/botão físico de voltar.
- Nenhum dado real de cliente deve ser usado nos testes.

O repositório orienta PRs para `dev`, enquanto a branch padrão é `main`.
`Closes #187` deve acompanhar o PR; o GitHub só aplica o fechamento automático
quando a mudança chega à branch padrão. Não fechar a issue manualmente ao abrir
ou mesclar o PR em `dev`.
