const fs = require("fs");
const { promisify } = require("util");

module.exports = async function(filePath) {
  let fileContents = "";

  // If a file was specified, ensure that it
  // is valid before attempting to start the server.
  if (filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`The specified file doesn't exist: ${filePath}`);
    }

    if (fs.statSync(filePath).isDirectory()) {
      throw new Error(
        `The specified path refers to a directory not a file: ${filePath}`
      );
    }

    fileContents = fs.readFileSync(filePath, "utf8");
  }

  const port = await require("get-port")();
  const startServer = require("../server");
  startServer(port);

  const WebSocket = require("ws");
  const socket = new WebSocket(`ws://localhost:${port}`);
  await require("./shareClient")(socket, fileContents);

  const copyPaste = require("copy-paste");
  const ngrok = require("ngrok");

  const copyToClipboard = promisify(copyPaste.copy);
  const createTunnel = promisify(ngrok.connect);

  const tunnelUrl = await createTunnel(port);
  await copyToClipboard(tunnelUrl);

  return {
    localUrl: `http://localhost:${port}`,
    tunnelUrl
  };
};
