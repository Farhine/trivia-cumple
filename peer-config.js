// Servidor de señalización: por defecto el gratuito de PeerJS.
// Para pruebas locales se puede usar ?peerhost=localhost:9000
const PEER_OPTS = (() => {
  const h = new URLSearchParams(location.search).get('peerhost');
  if (!h) return {};
  const [host, port] = h.split(':');
  return { host, port: +port || 9000, path: '/', secure: false };
})();
