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

const toStyle = {
  success: (msg) => {
    return styleMessage(msg, ["brightGreen"]);
  },
  title: (msg) => {
    return styleMessage(msg, ["bold"]);
  },
  error: (msg) => {
    return styleMessage(msg, ["red", "bold", "brightYellowBackground"]);
  },
  italic: (msg) => {
    return styleMessage(msg, ["italic"]);
  },
};

module.exports = {
  formattingStyles,
  styleMessage,
  toStyle,
};
