/**
 * Corrige o crash na abertura do APK:
 *   "Failed to create an instance of class androidx.work.impl.WorkDatabase"
 *
 * O react-native-maps declara androidx.work:work-runtime:2.9.1, mas outra
 * dependência transitiva traz o Room 2.7+. O WorkDatabase_Impl gerado no
 * WorkManager 2.9 não é compatível com o Room 2.7+ e o app morre antes de
 * carregar o JS. Forçamos uma versão do WorkManager compatível.
 */
const { withAppBuildGradle } = require('expo/config-plugins');

const WORK_VERSION = '2.10.1';
const MARKER = '// withWorkManagerFix';

module.exports = function withWorkManagerFix(config) {
  return withAppBuildGradle(config, (cfg) => {
    if (!cfg.modResults.contents.includes(MARKER)) {
      cfg.modResults.contents += `
${MARKER}
configurations.all {
    resolutionStrategy.force "androidx.work:work-runtime:${WORK_VERSION}"
}
`;
    }
    return cfg;
  });
};
