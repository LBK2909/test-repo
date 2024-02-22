// Save the original console.log function
const originalConsoleLog = console.log;
// Override console.log
console.log = (...args) => {
  // Create a new Error and capture its stack
  const stack = new Error().stack;
  // Parse the stack for file and line information
  const stackLine = stack.split("\n")[2];
  const match = stackLine.match(/\((.*):(\d+):(\d+)\)/) || stackLine.match(/at (.*):(\d+):(\d+)/);
  const filePath = match ? match[1] : "unknown";
  const lineNumber = match ? match[2] : "unknown";

  // Extract the filename from the full path
  const fileName = filePath.split("/").pop();

  // Get the current date and time
  const now = new Date().toISOString();

  // Call the original console.log with the date-time, file name, line number, and original arguments
  originalConsoleLog(` [${fileName}:${lineNumber}]`, ...args);
};
