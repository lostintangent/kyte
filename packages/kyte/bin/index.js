#! /usr/bin/env node

const { exit } = require("../lib/util");
const { promisify } = require("util");

if (!process.version.startsWith("v8")) {
  exit("The Kyte CLI requires Node v8.0.0 or greater in order to run");
}

const yargs = require("yargs");
const { _: [filePath] } = yargs
  .usage("Usage: kyte [<filePath>] [options]")
  .example("kyte", "Spin up a new co-editing session, using a new empty file")
  .example(
    "kyte index.js",
    "Spin up a new co-editing session, using the contents of the local file 'index.js'"
  )
  .help()
  .alias("h", "help")
  .version()
  .alias("v", "version").argv;

!(async function() {
  try {
    const startSession = require("../lib/startSession");
    const { localUrl, tunnelUrl } = await startSession(filePath);

    if (process.stdout.isTTY) {
      const copyToClipboard = promisify(require("copy-paste").copy);
      await copyToClipboard(tunnelUrl);

      const boxen = require("boxen");
      const { cyan, gray, green } = require("chalk");

      const successMessage = [
        green("New collaborative sesion started!\n"),
        `${cyan("Local URL:")}  ${localUrl}`,
        `${cyan("Tunnel URL:")} ${tunnelUrl}\n`,
        gray("Tunnel URL has been copied to your clipboard")
      ];

      console.log(
        boxen(successMessage.join("\n"), {
          padding: 1,
          margin: { bottom: 1, top: 1 }
        })
      );

      require("opn")(tunnelUrl);
    } else {
      console.log(tunnelUrl);
    }
  } catch ({ message }) {
    exit(message);
  }
})();
