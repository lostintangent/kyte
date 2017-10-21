#! /usr/bin/env node

if (!process.version.startsWith("v8")) {
  exit("The Kyte CLI requires Node v8.0.0 or greater in order to run");
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

const { filePath } = parser.parse();
require("../lib/cli")(filePath);
