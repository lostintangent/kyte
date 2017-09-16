const { red } = require("chalk");
module.exports.exit = (message) => {
    console.error(red(message));
};