import 'react-native-url-polyfill/auto';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

/**
 * Cliente do Supabase Auth. O login e o cadastro acontecem aqui; o backend só
 * valida o token (access_token) que o app manda no header Authorization.
 *
 * A sessão fica no AsyncStorage e o token é renovado sozinho enquanto o app
 * está aberto. Usa a chave anônima (pública) — a service key nunca vai no app.
 */
export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// Renovação automática só com o app em primeiro plano (recomendação do Supabase pra React Native).
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

/** Erro de login já com a mensagem pronta pra tela. */
export class LoginError extends Error {
  name = 'LoginError';
}

/** Entra com e-mail e senha e devolve o access_token da sessão. */
export async function entrar(email: string, senha: string): Promise<string> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error || !data.session) {
    if (error?.code === 'invalid_credentials') {
      throw new LoginError('E-mail ou senha inválidos.');
    }
    if (error?.name === 'AuthRetryableFetchError') {
      throw new LoginError(
        'Sem conexão com o servidor de login. Confira o EXPO_PUBLIC_SUPABASE_URL no .env.'
      );
    }
    throw new LoginError(error?.message ?? 'Falha no login.');
  }
  return data.session.access_token;
}

/** Encerra a sessão; o listener do Router limpa o authStore. */
export async function sair(): Promise<void> {
  await supabase.auth.signOut();
}
