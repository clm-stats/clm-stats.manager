const joinWords = (strs) => strs.join(" ");
const consoleLogFn = (strs, isErr) => {
  const str = joinWords(strs);
  if (isErr) {
    console.error(str);
  } else {
    console.log(str);
  }
};
let logFn;
export const setLogFn = (newLogFn) => (logFn = newLogFn);
const log = (...args) => (logFn || consoleLogFn)(...args);
export const info = (...args) => log(args, false);
export const err = (...args) => log(args, true);
