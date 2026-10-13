/** Formulário da issue #187. Persistência e transporte pertencem à issue #188. */
export type CampoFicha = keyof FichaAnamnese['cliente'] | keyof FichaAnamnese['procedimento'];
export type ErrosAnamnese = Record<string, string>;

export interface ProdutoAnamnese {
  nome: string;
  lote: string;
  fabricante: string;
  registroAnvisa: string;
  fabricacao: string;
  validade: string;
  abertura: string;
}

export interface AnexoConsentimento {
  uri: string;
  nome: string;
}

export interface FichaAnamnese {
  cliente: {
    nomeCompleto: string;
    nascimento: string;
    sexo: string;
    identidade: string;
    enderecoCompleto: string;
  };
  procedimento: {
    atendimento: string;
    dataProcedimento: string;
    tipo: string;
    localCorpo: string;
    profissional: string;
    intercorrencias: string;
  };
  produtos: ProdutoAnamnese[];
  consentimento: {
    anexos: AnexoConsentimento[];
    orientado: boolean;
    segundaViaEntregue: boolean;
  };
}

export const camposCliente = [
  ['nomeCompleto', 'Nome completo'],
  ['nascimento', 'Data de nascimento'],
  ['sexo', 'Sexo'],
  ['identidade', 'Número da identidade'],
  ['enderecoCompleto', 'Endereço completo'],
] as const;

export const camposProcedimento = [
  ['atendimento', 'Data do atendimento'],
  ['dataProcedimento', 'Data do procedimento'],
  ['tipo', 'Tipo de procedimento'],
  ['localCorpo', 'Local do corpo'],
  ['profissional', 'Nome do profissional'],
  ['intercorrencias', 'Eventos adversos / intercorrências'],
] as const;

export const camposProduto = [
  ['nome', 'Nome do produto'], ['lote', 'Número do lote'],
  ['fabricante', 'Fabricante'], ['registroAnvisa', 'Registro na Anvisa'],
  ['fabricacao', 'Data de fabricação'], ['validade', 'Data de validade'],
  ['abertura', 'Data de abertura do frasco'],
] as const;

export const camposData = new Set<string>([
  'nascimento', 'atendimento', 'dataProcedimento', 'fabricacao', 'validade', 'abertura',
]);

export function novoProduto(): ProdutoAnamnese {
  return { nome: '', lote: '', fabricante: '', registroAnvisa: '', fabricacao: '', validade: '', abertura: '' };
}

export function novaFicha(profissional = ''): FichaAnamnese {
  return {
    cliente: { nomeCompleto: '', nascimento: '', sexo: '', identidade: '', enderecoCompleto: '' },
    procedimento: { atendimento: '', dataProcedimento: '', tipo: 'Tatuagem', localCorpo: '', profissional, intercorrencias: '' },
    produtos: [novoProduto()],
    consentimento: { anexos: [], orientado: false, segundaViaEntregue: false },
  };
}

/** Datas civis, sem conversão UTC que possa alterar o dia no Brasil. */
export function lerData(valor: string): Date | null {
  const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(valor);
  if (!partes) return null;
  const [, dia, mes, ano] = partes.map(Number);
  if (ano < 1900) return null;
  const data = new Date(ano, mes - 1, dia);
  return data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia ? data : null;
}

export function validarFicha(ficha: FichaAnamnese, hoje = new Date()): ErrosAnamnese {
  const erros: ErrosAnamnese = {};
  const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const texto = (valor: string, chave: string) => {
    if (!valor.trim()) erros[chave] = 'Preencha este campo.';
    else if (valor.trim().length > 2000) erros[chave] = 'Use até 2.000 caracteres.';
  };
  const data = (valor: string, chave: string, futura = false) => {
    const resultado = lerData(valor);
    if (!resultado) erros[chave] = 'Informe uma data válida: DD/MM/AAAA.';
    else if (!futura && resultado > inicioHoje) erros[chave] = 'A data não pode estar no futuro.';
    return resultado;
  };
  for (const [campo] of camposCliente) texto(ficha.cliente[campo], `cliente.${campo}`);
  for (const [campo] of camposProcedimento) texto(ficha.procedimento[campo], `procedimento.${campo}`);
  const nascimento = data(ficha.cliente.nascimento, 'cliente.nascimento');
  const atendimento = data(ficha.procedimento.atendimento, 'procedimento.atendimento');
  const procedimento = data(ficha.procedimento.dataProcedimento, 'procedimento.dataProcedimento');
  if (nascimento && procedimento) {
    const aniversario = new Date(nascimento.getFullYear() + 18, nascimento.getMonth(), nascimento.getDate());
    if (procedimento < aniversario) erros['cliente.nascimento'] = 'Em São Paulo, tatuagem e piercing são proibidos para menores de 18 anos, mesmo com autorização dos pais.';
  }
  if (atendimento && procedimento && procedimento < atendimento) {
    erros['procedimento.dataProcedimento'] = 'O procedimento não pode anteceder o atendimento.';
  }
  if (!ficha.produtos.length) erros.produtos = 'Adicione ao menos um produto utilizado.';
  ficha.produtos.forEach((produto, indice) => {
    const prefixo = `produtos.${indice}.`;
    for (const [campo] of camposProduto) texto(produto[campo], prefixo + campo);
    const fabricacao = data(produto.fabricacao, prefixo + 'fabricacao');
    const validade = data(produto.validade, prefixo + 'validade', true);
    const abertura = data(produto.abertura, prefixo + 'abertura');
    if (fabricacao && validade && validade < fabricacao) erros[prefixo + 'validade'] = 'A validade não pode anteceder a fabricação.';
    if (fabricacao && abertura && abertura < fabricacao) erros[prefixo + 'abertura'] = 'A abertura não pode anteceder a fabricação.';
    if (procedimento && abertura && abertura > procedimento) erros[prefixo + 'abertura'] = 'A abertura não pode ocorrer após o procedimento.';
    if (procedimento && validade && validade < procedimento) erros[prefixo + 'validade'] = 'O produto estava vencido na data do procedimento.';
  });
  if (!ficha.consentimento.anexos.length) erros.anexos = 'Anexe todas as páginas do termo assinado.';
  if (!ficha.consentimento.orientado) erros.orientado = 'Confirme a orientação prévia e a assinatura do termo.';
  if (!ficha.consentimento.segundaViaEntregue) erros.segundaViaEntregue = 'Confirme a entrega da segunda via ao cliente.';
  return erros;
}
