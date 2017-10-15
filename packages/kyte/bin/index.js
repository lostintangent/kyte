#! /usr/bin/env node

if (!process.version.startsWith("v8")) {
  exit("The Kyte CLI requires Node v8.0.0 or greater in order to run");
}

const parser = require("yargs")
  .usage("$0 [filePath] [options]", "Start a new co-editing session", yargs => {
    yargs.positional("filePath", {
      describe: "The file path to begin collaborating on",
      type: "string"
    });
  })
  .alias({ h: "help", v: "version" })
  .strict()
  .fail(exit);

const { filePath } = parser.parse();
require("../lib/cli")(filePath).catch(exit);

function exit(error) {
  const { red } = require("chalk");
  console.error(red(error.message || error));
  process.exit(1);
}
