module.exports = (webSocket, initialContent) => {
  return new Promise((resolve, reject) => {
    const { Connection, types } = require("sharedb/lib/client");
    types.map["json0"].registerSubtype(require("ot-text").type);

    const shareConnection = new Connection(webSocket);
    const document = shareConnection.get("documents", "demo.js");
    if (initialContent) {
      document.subscribe(() => {
        document.create({ content: initialContent }, resolve);
      });
    } else {
      resolve(document);
    }
  });
};
