// Allow easily enabling debug mode (i.e. verbose log output),
// by toggling the right Node debug module flags. Note that in order
// for this to take effect, without requiring a browser refresh, it
// needs to be set before the "dependent" module is loaded, which
// is why the "monaco-share" module is require'd below.
if (location.search.includes("debug")) {
  localStorage.debug = "monaco-share";
}

const monacoShare = require("monaco-share");
const shareClient = require("../../lib/shareClient");

// The local server uses HTTP, whereas the internet tunnel uses HTTPS,
// so we simply want to connect the WebSocket to the server using the
// correct protocol. Otherwise, the connection will fail.
const protocol = location.protocol === "http:" ? "ws:" : "wss:";
shareClient(new WebSocket(`${protocol}//${location.host}`)).then(monacoShare);
