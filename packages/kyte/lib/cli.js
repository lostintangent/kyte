const { promisify } = require("util");

module.exports = async function(filePath) {
  const startSession = require("./startSession");
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
};
