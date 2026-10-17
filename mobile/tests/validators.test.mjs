import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidCNPJ } from '../src/utils/validators.ts';

// Teste de CNPJ Válido
test('isValidCNPJ valida CNPJs autênticos com e sem máscara', () => {
  assert.equal(isValidCNPJ('11.222.333/0001-81'), true);
  assert.equal(isValidCNPJ('11222333000181'), true);
  assert.equal(isValidCNPJ('04.252.011/0001-10'), true);
  assert.equal(isValidCNPJ('33.000.167/0001-01'), true);
});

// Teste de CNPJ Repetido
test('isValidCNPJ rejeita sequências repetidas (ex: 11.111.111/1111-11)', () => {
  assert.equal(isValidCNPJ('00.000.000/0000-00'), false);
  assert.equal(isValidCNPJ('11.111.111/1111-11'), false);
  assert.equal(isValidCNPJ('22.222.222/2222-22'), false);
  assert.equal(isValidCNPJ('33.333.333/3333-33'), false);
  assert.equal(isValidCNPJ('99.999.999/9999-99'), false);
});

// Teste de CNPJ Inválido
test('isValidCNPJ rejeita dígitos verificadores inválidos ou incompletos', () => {
  assert.equal(isValidCNPJ('11.222.333/0001-82'), false);
  assert.equal(isValidCNPJ('11.222.333/0001-00'), false);
  assert.equal(isValidCNPJ('12345678901234'), false);
  assert.equal(isValidCNPJ('12345'), false);
  assert.equal(isValidCNPJ(''), false);
  assert.equal(isValidCNPJ(null), false);
  assert.equal(isValidCNPJ(undefined), false);
});

// Teste de Validação de Senha e Confirmação de Senha
test('Regra de senha e confirmação de senha', () => {
  const validatePasswords = (senha, confirmarSenha) => {
    if (senha.length < 8) return { valid: false, error: 'Mínimo 8 caracteres' };
    if (senha !== confirmarSenha) return { valid: false, error: 'As senhas não coincidem.' };
    return { valid: true, error: null };
  };

  assert.deepEqual(validatePasswords('senha1234', 'senha9999'), {
    valid: false,
    error: 'As senhas não coincidem.'
  });

  assert.deepEqual(validatePasswords('senha1234', 'senha1234'), {
    valid: true,
    error: null
  });

  assert.deepEqual(validatePasswords('curta', 'curta'), {
    valid: false,
    error: 'Mínimo 8 caracteres'
  });
});

// Teste da Máscara de CNPJ
test('Máscara de CNPJ formata progressivamente até 14 dígitos', () => {
  function maskCNPJ(s) {
    const d = s.replace(/\D/g, '').slice(0, 14);
    if (d.length <= 2) return d;
    if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
    if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
    if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  }

  assert.equal(maskCNPJ('11'), '11');
  assert.equal(maskCNPJ('11222'), '11.222');
  assert.equal(maskCNPJ('11222333'), '11.222.333');
  assert.equal(maskCNPJ('112223330001'), '11.222.333/0001');
  assert.equal(maskCNPJ('11222333000181'), '11.222.333/0001-81');
  assert.equal(maskCNPJ('11.222.333/0001-8199999'), '11.222.333/0001-81'); // trava em 14
});
