const boxen = require("boxen");
const opn = require("opn");
const startSession = require("./startSession");
const { copy } = require("copy-paste");
const { cyan, gray, green, red } = require("chalk");
const { promisify } = require("util");

const copyToClipboard = promisify(copy);

module.exports = async function(filePath) {
  try {
    const { localUrl, tunnelUrl } = await startSession(filePath);

    await copyToClipboard(tunnelUrl);

    const successMessage = [
      green("New collaborative sesion started!\n"),
      `${cyan("Local URL:")}  ${localUrl}`,
      `${cyan("Tunnel URL:")} ${tunnelUrl}\n`,
      gray("Tunnel URL has been copied to your clipboard")
    ].join("\n");

    console.log(
      boxen(successMessage, {
        margin: { bottom: 1, top: 1 },
        padding: 1
      })
    );

    opn(tunnelUrl);
  } catch ({ message }) {
    console.error(message);
    process.exit(1);
  }
};
