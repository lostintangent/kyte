#! /usr/bin/env node

if (!process.version.startsWith("v8")) {
  exit("The Kyte CLI requires Node v8.0.0 or greater in order to run");
}

const yargs = require("yargs");
const { _: [filePath] } = yargs
  .usage("kyte [filePath] [options]")
  .example("kyte", "Spin up a new co-editing session, using a new empty file")
  .example(
    "kyte index.js",
    "Spin up a new co-editing session, using the contents of the local file 'index.js'"
  )
  .fail(exit)
  .strict()
  .alias({ h: "help", v: "version" })
  .parse();

require("../lib/cli")(filePath).catch(exit);

function exit(error) {
  const { red } = require("chalk");
  console.error(red(error.message || error));
  process.exit(1);
}
