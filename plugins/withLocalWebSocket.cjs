const { withAndroidManifest } = require('expo/config-plugins');
// Permite o broker WS local de demonstração nos builds Android próprios.
// A conexão padrão continua usando WSS com TLS.
module.exports = config => withAndroidManifest(config, result => {
  const application = result.modResults.manifest.application?.[0];
  if (application) application.$['android:usesCleartextTraffic'] = 'true';
  return result;
});
