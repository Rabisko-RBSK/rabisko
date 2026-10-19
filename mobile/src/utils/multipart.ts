/**
 * Monta o body multipart para upload de uma imagem local (URI `file://`)
 * em RN. O `as any` é o cast padrão pro tipo do RN, que aceita o objeto
 * `{ uri, name, type }` mas não está expresso na lib `FormData` do DOM.
 *
 * `extras` vira campos de texto adicionais (ignorados quando vazios).
 */
export function multipartImage(
  uri: string,
  fieldName: string,
  extras: Record<string, string | undefined> = {},
): FormData {
  const form = new FormData();
  const nome = uri.split('/').pop() || 'imagem.jpg';
  const ext = nome.split('.').pop()?.toLowerCase();
  const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  form.append(fieldName, { uri, name: nome, type: mime } as any);
  for (const [chave, valor] of Object.entries(extras)) {
    if (valor) form.append(chave, valor);
  }
  return form;
}
