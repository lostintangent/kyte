#! /usr/bin/env node

const fs = require("fs");

const { exit } = require("../lib/util");
if (!process.version.startsWith("v8")) {
  exit("The Kyte CLI requires Node v8.0.0 or greater in order to run");
}

const yargs = require("yargs");
const { _: [filePath] } = yargs
  .usage("Usage: kyte [<filePath>] [options]")
  .example("kyte", "Spin up a new co-editing session, using a blank file")
  .example("kyte index.js", "Spin up a new co-editing session, using the contents of the local file 'index.js'")
  .alias("h", "help").version()
  .alias("v", "version")
  .help()
  .argv;

!async function () {
  const startServer = require("../server");
  const port = await require("get-port")();
  startServer(port);

  if (filePath) {
    if (!fs.existsSync(filePath)) {
      exit("The specified file doesn't exist.");
    }

    if (fs.statSync(filePath).isDirectory()) {
      exit("The specified path refers to a directory not a file.");
    }

    const fileContents = fs.readFileSync(filePath, "utf8");

    const WebSocket = require("ws");
    const socket = new WebSocket(`ws://localhost:${port}`);
    await require("../lib/shareClient")(socket, fileContents);
  }

  const opn = require("opn");
  const { connect } = require("ngrok");
  const { cyan } = require("chalk");
  connect(port, async (error, url) => {
    if (error) {
      return exit(error);
    }
  
    const copy = require("util").promisify(require("copy-paste").copy);
    await copy(url);

    console.log(`Co-editing session available at ${cyan(url)} (it's also copied to your clipboard!)`);
    console.log(`Press ${cyan("<CTRL+C>")} to stop sharing this file`);
    opn(url);
  });
}();