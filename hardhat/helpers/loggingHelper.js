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
const dashSeparator = "-".repeat(80);
const titleSeparator = dashSeparator;

const toStyle = {
  success: (msg) => {
    return styleMessage(msg, ["brightGreen"]);
  },
  title: (msg) => {
    const formattedMsg = `\n${titleSeparator}\n===========>   ${msg}\n${titleSeparator}`;
    return styleMessage(formattedMsg, ["bold"]);
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

module.exports = {
  formattingStyles,
  styleMessage,
  toStyle,
};
