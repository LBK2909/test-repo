const winston = require("winston");
const path = require("path");
const config = require("./config");

const enumerateErrorFormat = winston.format((info) => {
  if (info instanceof Error) {
    Object.assign(info, { message: info.stack });
  }
  return info;
});

// Custom format to add file name and line number
const filenameAndLineNumber = winston.format((info) => {
  const err = new Error();
  Error.captureStackTrace(err);
  const stack = err.stack.split("\n");
  // Adjust the index 3 to locate the correct line where logger was called
  const caller = stack[3] || "";
  const match = caller.match(/\((.*?):(\d+):\d+\)$/);
  if (match) {
    info.filename = path.basename(match[1]); // Only the filename
    info.line = match[2];
  }
  return info;
});

const logger = winston.createLogger({
  level: config.env === "development" ? "debug" : "info",
  format: winston.format.combine(
    enumerateErrorFormat(),
    filenameAndLineNumber(),
    config.env === "development" ? winston.format.colorize() : winston.format.uncolorize(),
    winston.format.splat(),
    winston.format.printf(({ level, message, filename, line }) => `${level}: ${message} (at ${filename}:${line})`)
  ),
  transports: [
    new winston.transports.Console({
      stderrLevels: ["error"],
    }),
  ],
});

module.exports = logger;
