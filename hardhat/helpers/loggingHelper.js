///////////////////////////////////////////////////////////////////////////////
//
//                BASE STYLES AND FUNCTIONS
//
///////////////////////////////////////////////////////////////////////////////

// map readable style to its code used in styleMessage function
const formattingStyles = {
  bold: 1,
  italic: 3,
  underline: 4,
  black: 30,
  red: 31,
  green: 32,
  blue: 34,
  magenta: 35,
  cyan: 36,
  white: 37,
  blackBackground: 40,
  redBackground: 41,
  yellowBackground: 43,
  cyanBackground: 46,
  whiteBackground: 47,
  brightBlack: 90,
  brightRed: 91,
  brightGreen: 92,
  brightYellow: 93,
  brightBlue: 94,
  brightMagenta: 95,
  brightCyan: 96,
  brightWhite: 97,
  brightBlackBackground: 100,
  brightRedBackground: 101,
  brightGreenBackground: 102,
  brightYellowBackground: 103,
  brightBlueBackground: 104,
  brightMagentaBackground: 105,
  brightCyanBackground: 106,
  brightWhiteBackground: 107,
};

/**
 * @description Formats a message with given styles
 * @param { string } msg - The message to format
 * @param { string[] } msgStyles - Array of style to apply
 * @returns { string } - The styled message
 */
const styleMessage = (msg, msgStyles) => {
  const preparedStyle = msgStyles.map((style) => {
    return formattingStyles[style];
  });
  const styleHeader = "\x1b[" + preparedStyle.join(";") + "m";
  const styleFooter = "\x1b[0m";

  return `${styleHeader}${msg}${styleFooter}`;
};

// @todo make it more generic to ease msg logging
// 80 :"::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::"
const dDotSeparator = ":".repeat(80);
const sDotSeparator = ".".repeat(80);
const sDashSeparator = "-".repeat(80);
const dDashSeparator = "=".repeat(80);
const titleSeparator = dDashSeparator;

const toTitle = (titleSeparator, msg) => {
  const formattedMsg = `\n${titleSeparator}\n===========>   ${msg}\n${titleSeparator}`;
  return styleMessage(formattedMsg, ["bold"]);
};

///////////////////////////////////////////////////////////////////////////////
//
//                GENERAL FUNCTIONS FOR STYLING AND FORMATTING MESSAGES
//
///////////////////////////////////////////////////////////////////////////////

/**
 * @description Shortcut for styling message
 */
const toStyle = {
  success: (msg) => {
    return styleMessage(msg, ["brightGreen"]);
  },
  h1: (msg) => {
    return toTitle(dDashSeparator, msg);
  },
  h2: (msg) => {
    return toTitle(sDashSeparator, msg);
  },
  error: (msg) => {
    return styleMessage(msg, ["red", "bold", "brightYellowBackground"]);
  },
  italic: (msg) => {
    return styleMessage(msg, ["italic"]);
  },
  redItalic: (msg) => {
    return styleMessage(msg, ["red", "italic"]);
  },
  blueItalic: (msg) => {
    return styleMessage(msg, ["cyan", "italic"]);
  },
  yellowItalic: (msg) => {
    return styleMessage(msg, ["brightYellow", "italic"]);
  },
  greenItalic: (msg) => {
    return styleMessage(msg, ["green", "italic"]);
  },
  bold: (msg) => {
    return styleMessage(msg, ["bold"]);
  },
  redBold: (msg) => {
    return styleMessage(msg, ["red", "bold"]);
  },
  blueBold: (msg) => {
    return styleMessage(msg, ["cyan", "bold"]);
  },
  yellowBold: (msg) => {
    return styleMessage(msg, ["yellow", "bold"]);
  },
  greenBold: (msg) => {
    return styleMessage(msg, ["green", "bold"]);
  },
  discrete: (msg) => {
    return styleMessage(msg, ["brightBlack", "italic"]);
  },
};

/**
 * @description Shortcut for general formats
 */
const display = {
  h1: (msg) => console.log(toStyle.h1(msg)),
  h2: (msg) => console.log(toStyle.h2(msg)),
  context: (action, context, withToken = true, withSigner = true) => {
    const endAction = withToken || withSigner ? " with" : "";
    console.log(
      `${action} ${toStyle.blueItalic(
        context.network
      )} (chainId ${toStyle.blueItalic(context.chainId)})${endAction}:`
    );

    if (withToken || withSigner) {
      let details = "";
      if (withToken) {
        details += `- native token ${toStyle.blueItalic(
          context.nativeTokenName
        )} (${toStyle.blueItalic(context.nativeTokenSymbol)})`;
      }
      if (withSigner) {
        details += `${
          withToken ? "\n" : ""
        }- admin / deployer address: ${toStyle.blueItalic(
          context.accounts[0].address
        )}`;
      }
      console.log(details);
    }
  },
  tokenSet: (name, address, chainId) => {
    console.log(
      `token: ${toStyle.blueItalic(
        name
      )} set in storage at ${toStyle.blueItalic(
        address
      )} for chainId ${chainId}`
    );
  },
  deployContract: (contractName, contractAddress, deployer = null) => {
    console.log(
      `==> ${contractName} deployed to: ${contractAddress}${
        deployer ? " by " + deployer : ""
      }`
    );
  },
  writingAddress: (contractName, tokenSymbol = null) => {
    console.log(
      toStyle.discrete(
        `Writing deployed address of ${contractName}${
          tokenSymbol ? " " + tokenSymbol + " " : " "
        }to deployedAddresses.json...`
      )
    );
  },
};

module.exports = {
  formattingStyles,
  styleMessage,
  toStyle,
  display,
};
