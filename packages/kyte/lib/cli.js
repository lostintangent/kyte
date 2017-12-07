const boxen = require("boxen");
const emoji = require("node-emoji");
const opn = require("opn");
const startSession = require("./startSession");
const { copy } = require("copy-paste");
const { cyan, gray, green, magenta, red } = require("chalk");
const { promisify } = require("util");

const copyToClipboard = promisify(copy);

module.exports = async function(filePath, createTunnel) {
  try {
    const { localUrl, tunnelUrl } = await startSession(filePath, createTunnel);

    const tunnelUrlDisplay = tunnelUrl ? tunnelUrl : magenta("N/A (Disabled)");
    const successMessage = [
      green(`New collaborative sesion started! ${emoji.get("rocket")}\n`),
      `${cyan("Local URL:")}  ${localUrl}`,
      `${cyan("Tunnel URL:")} ${tunnelUrlDisplay}\n`,
      gray(`${tunnelUrl ? "Tunnel" : "Local"} URL is copied to your clipboard`)
    ].join("\n");

    await copyToClipboard(tunnelUrl || localUrl);
    opn(localUrl);

    console.log(
      boxen(successMessage, {
        margin: { bottom: 1, top: 1 },
        padding: 1
      })
    );
  } catch ({ message, stack }) {
    console.error(red(message));
    process.exit(1);
  }
};
