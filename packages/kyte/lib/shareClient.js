const { Connection, types } = require("sharedb/lib/client");
const { promisify } = require("util");
const { type: textType } = require("ot-text");

module.exports = async (webSocket, content = "") => {
  // ShareDB operates against JSON documents, so we need to
  // ensure that we can perform OT operations on child text properties,
  // since that is the core focus on the Kyte CLI.
  types.map["json0"].registerSubtype(textType);

  // "Wrap" the provided WebSocket with the ShareDB app protocol client
  const shareConnection = new Connection(webSocket);

  // Create the remote document, using the initial contents if specified
  const document = shareConnection.get("documents", "demo.js");
  if (content) {
    await promisify(document.create).call(document, { content });
  }

  return document;
};
