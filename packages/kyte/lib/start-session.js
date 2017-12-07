const fs = require("fs");
const WebSocket = require("ws");
const { promisify } = require("util");

const connectTunnel = promisify(require("ngrok").connect);

function assertFilePath(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`The specified file doesn't exist: ${filePath}`);
  }

  if (fs.statSync(filePath).isDirectory()) {
    throw new Error(
      `The specified path refers to a directory not a file: ${filePath}`
    );
  }
}

async function populateFileContents(serverUrl, filePath) {
  const socket = new WebSocket(serverUrl);

  const fileContents = fs.readFileSync(filePath, "utf8");
  await require("./share-client")(socket, fileContents);

  socket.close();
}

module.exports = async function(filePath, createTunnel) {
  // If a file was specified, ensure that it
  // is valid before attempting to start the server.
  filePath && assertFilePath(filePath);

  // Spin up the OT server + web front-end,
  // using a locally available port.
  const port = await require("get-port")({ port: 8558 });
  const startServer = require("../server");
  const { url: localUrl, wsUrl } = startServer(port);

  // If a file was specified, then we need to connect
  // to the newly started server and initialize the
  // shared document with the local contents.
  filePath && (await populateFileContents(wsUrl, filePath));

  // Spin up the internet tunnel, so that the co-editing
  // session can be accessible to any other developers.
  let tunnelUrl;
  if (createTunnel) {
    tunnelUrl = await connectTunnel(port);
  }

  return {
    localUrl,
    tunnelUrl
  };
};
