module.exports = (webSocket, content = "") => {
  return new Promise((resolve, reject) => {
    const { Connection, types } = require("sharedb/lib/client");
    const { type: textType } = require("ot-text");

    // ShareDB operates against JSON documents, so we need to
    // ensure that we can perform OT operations on text properties,
    // since that is the core focus on the Kyte CLI.
    types.map["json0"].registerSubtype(textType);

    // "Wrap" the provided WebSocket with the ShareDB app protocol client
    const shareConnection = new Connection(webSocket);

    // Create the remote document, using the initial contents if specified
    const document = shareConnection.get("documents", "demo.js");

    if (content) {
      document.create({ content }, () => resolve(document));
    } else {
      resolve(document);
    }
  });
};
