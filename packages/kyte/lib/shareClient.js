module.exports = (webSocket, initialContents = "") => {
  return new Promise((resolve, reject) => {
    const { Connection, types } = require("sharedb/lib/client");
    types.map["json0"].registerSubtype(require("ot-text").type);

    const shareConnection = new Connection(webSocket);
    const document = shareConnection.get("documents", "demo.js");

    if (initialContents) {
      document.create({ content: initialContents }, () => resolve(document));
    } else {
      resolve(document);
    }
  });
};
