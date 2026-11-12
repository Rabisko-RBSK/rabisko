/**
 * Corrige o crash na abertura do APK:
 *   "Failed to create an instance of class androidx.work.impl.WorkDatabase"
 *
 * O template do SDK 58 liga o R8 (android.enableMinifyInReleaseBuilds=true).
 * O WorkManager (trazido pelo react-native-maps) cria o WorkDatabase_Impl do
 * Room por reflexão no boot, e o R8 deixa essa classe impossível de instanciar.
 * Desligamos a minificação no release, como era antes do upgrade.
 */
const { withGradleProperties } = require('expo/config-plugins');

const KEY = 'android.enableMinifyInReleaseBuilds';

module.exports = function withWorkManagerFix(config) {
  return withGradleProperties(config, (cfg) => {
    cfg.modResults = cfg.modResults.filter(
      (item) => !(item.type === 'property' && item.key === KEY)
    );
    cfg.modResults.push({ type: 'property', key: KEY, value: 'false' });
    return cfg;
  });
};
