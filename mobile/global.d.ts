// Imports de CSS (ex.: `import './src/styles/global.css'` do NativeWind) são
// resolvidos pelo Metro. Sem esta declaração o TypeScript rejeita o import
// de efeito colateral (TS2882).
declare module '*.css';
