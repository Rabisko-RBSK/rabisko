-- Leitura dos chats: até quando cada participante leu a conversa. Uma mensagem
-- está não lida para o destinatário quando data_envio > <papel>_leu_em (ou o
-- campo é null). Alimenta a coluna "Mensagens não lidas" do Kanban de serviços.
-- Sem backfill: mensagens anteriores contam como não lidas até a próxima leitura.

alter table public.chats
    add column cliente_leu_em  timestamptz,
    add column tatuador_leu_em timestamptz;
