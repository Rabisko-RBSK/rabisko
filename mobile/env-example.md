# Todas as variáveis desse env devem obrigatoriamente começar com EXPO_PUBLIC

# URL base da API do backend.
# Substitua pelo IP da sua máquina na rede local (ex.: ipconfig no Windows, ifconfig no Mac/Linux).
# Use localhost apenas se estiver rodando no emulador/simulador — dispositivos físicos precisam do IP real.
EXPO_PUBLIC_API_URL=http://[SEU-IP]:8080

# Supabase Auth (login e cadastro). O app fala direto com o Supabase só pra autenticar.
# Local: rode `supabase status` (Git Bash, na raiz do repo) e use:
#   EXPO_PUBLIC_SUPABASE_URL      -> http://[SEU-IP]:54321  (mesmo IP do EXPO_PUBLIC_API_URL — 127.0.0.1 não funciona no celular)
#   EXPO_PUBLIC_SUPABASE_ANON_KEY -> "ANON_KEY" (ou a "Publishable" sb_publishable_...)
# NUNCA coloque aqui a service role / secret key: tudo que começa com EXPO_PUBLIC vai dentro do app.
EXPO_PUBLIC_SUPABASE_URL=http://[SEU-IP]:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=
