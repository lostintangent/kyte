#! /usr/bin/env node

if (!process.version.startsWith("v8")) {
  console.error("The Kyte CLI requires Node v8.0.0 or greater in order to run");
  process.exit(1);
}

const { usage } = require("yargs");
const parser = usage(
  "$0 [filePath] [options]",
  "Easily share and collaboratively edit a file in real-time",
  yargs => {
    yargs
      .positional("filePath", {
        describe: "The file path to begin collaborating on",
        type: "string"
      })
      .option("no-tunnel", {
        describe: "Disable tunnel auto-creation",
        alias: "n",
        type: "boolean",
        default: false
      })
      .example(
        "kyte",
        "Start a new collaborative session, using a new empty file"
      )
      .example(
        "kyte index.js",
        "Start a new collaborative session, using the 'index.js' file"
      )
      .alias({ h: "help", v: "version" })
      .strict()
      .showHelpOnFail(false);
  }
);

const { filePath, noTunnel } = parser.parse();
require("../lib/cli")(filePath, !noTunnel);
