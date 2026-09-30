const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // Regras do React Compiler que chegaram com o upgrade do Expo 57. Ficam
    // como aviso até o código existente ser adaptado:
    //  - set-state-in-effect: padrão `useEffect(() => { carregar(); })` dos hooks;
    //  - immutability: falso positivo com `sharedValue.value = ...` do Reanimated.
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
    },
  },
]);
