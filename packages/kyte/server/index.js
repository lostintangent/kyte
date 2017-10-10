const express = require("express");
const http = require("http");
const path = require("path");
const ShareDB = require("sharedb");
const WebSocketServer = require("ws").Server;
const WebSocketJsonStream = require("websocket-json-stream");

module.exports = port => {
  const app = express();
  app.use(express.static(path.join(__dirname, "assets")));

  const server = http.createServer(app);
  server.listen(port);

  ShareDB.types.map["json0"].registerSubtype(require("ot-text").type);
  const shareDB = ShareDB();

  const webSocketServer = new WebSocketServer({ server });
  webSocketServer.on("connection", socket => {
    shareDB.listen(WebSocketJsonStream(socket));
  });
};
