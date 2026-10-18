export interface CepResultado {
  cep: string;         
  logradouro: string; 
  bairro: string;      
  cidade: string;      
  uf: string;
}

const TIMEOUT_MS = 8000;

export function apenasDigitos(valor: string): string{
    return valor.replace(/\D/g, '');
}

export function formatarCep(valor: string): string{
    const cepDigitos = apenasDigitos(valor).slice(0, 8);

    if(cepDigitos.length > 5){
        return cepDigitos.slice(0, 5) + "-" + cepDigitos.slice(5, 8)
    }else{
        return cepDigitos;
    }
}

export async function buscar(cep: string): Promise<CepResultado | null>{

    const cepFormatado = apenasDigitos(cep);
    if (cepFormatado.length !== 8) return null;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let response: Response;
    try {
        response = await fetch(`https://viacep.com.br/ws/${cepFormatado}/json/`, {
            signal: controller.signal,
        });
    } catch (err: any) {
        if (err?.name === 'AbortError') {
            throw new Error("Tempo esgotado ao buscar CEP");
        }
        throw err;
    } finally {
        clearTimeout(timer);
    }

    if (!response.ok) throw new Error("Erro ao buscar CEP")

    const responseJson = await response.json()

    if (responseJson.erro) {
      return null;
    }

    return {
        cep: responseJson.cep ?? '',
        logradouro: responseJson.logradouro ?? '',
        bairro: responseJson.bairro ?? '',
        cidade: responseJson.localidade ?? '',
        uf: responseJson.uf ?? '',
    };

}