# Variáveis de ambiente do backend
# Crie um arquivo backend/.env com estas chaves preenchidas.
# O Spring Boot importa esse arquivo automaticamente via spring.config.import.

# Supabase Storage — necessário para upload de imagens (perfil e portfólio).
# Após rodar `supabase start` na raiz do repositório, use os valores exibidos:
#   SUPABASE_URL             -> "API URL"          (ex.: http://127.0.0.1:54321)
#   SUPABASE_SERVICE_ROLE_KEY -> "service_role key"
# Sem essas variáveis os endpoints de upload falham silenciosamente.
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Endereço do Supabase visto pelo app, usado nas URLs públicas das imagens.
# Em dev local com celular, use o IP da máquina na rede (o mesmo de
# EXPO_PUBLIC_SUPABASE_URL do mobile, ex.: http://192.168.15.30:54321):
# 127.0.0.1 é o próprio celular, e a foto salva não carrega. Vazio = SUPABASE_URL.
SUPABASE_PUBLIC_URL=

# Nota: DB_URL, DB_USER e DB_PASS não são necessários no profile local —
# o arquivo application-local.yml já aponta para localhost:54322 com
# postgres/postgres. Essas variáveis só precisam ser definidas em produção
# (Railway as injeta automaticamente).
