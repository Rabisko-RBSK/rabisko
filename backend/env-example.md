# Variáveis de ambiente do backend
# Crie um arquivo backend/.env com estas chaves preenchidas.
# O Spring Boot importa esse arquivo automaticamente via spring.config.import.

# Chave usada para assinar e validar os tokens JWT (HMAC256).
# Qualquer string longa e aleatória serve para desenvolvimento local.
# Se ausente, o backend usa o fallback inseguro "my-secret-key".
JWT_SECRET=

# Supabase Storage — necessário para upload de imagens (perfil e portfólio).
# Após rodar `supabase start` na raiz do repositório, use os valores exibidos:
#   SUPABASE_URL             -> "API URL"          (ex.: http://127.0.0.1:54321)
#   SUPABASE_SERVICE_ROLE_KEY -> "service_role key"
# Sem essas variáveis os endpoints de upload falham silenciosamente.
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Nota: DB_URL, DB_USER e DB_PASS não são necessários no profile local —
# o arquivo application-local.yml já aponta para localhost:54322 com
# postgres/postgres. Essas variáveis só precisam ser definidas em produção
# (Railway as injeta automaticamente).
