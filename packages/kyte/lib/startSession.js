const fs = require("fs");
const { promisify } = require("util");

module.exports = async function(filePath) {
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
  }

  // Spin up the OT server + web front-end,
  // using a locally available port.
  const port = await require("get-port")();
  const startServer = require("../server");
  startServer(port);

  // If a file was specified, then we need to connect
  // to the newly started server and initialize the
  // shared document with the local contents.
  if (filePath) {
    const WebSocket = require("ws");
    const socket = new WebSocket(`ws://localhost:${port}`);

    const fileContents = fs.readFileSync(filePath, "utf8");
    await require("./shareClient")(socket, fileContents);

    socket.close();
  }

  const createTunnel = promisify(require("ngrok").connect);

  return {
    localUrl: `http://localhost:${port}`,
    tunnelUrl: await createTunnel(port)
  };
};
