const fs = require("fs");
const { createCanvas, registerFont } = require("canvas");
registerFont("./src/Caveat-Regular.ttf", { family: "Caveat" });
const axios = require("axios");
const width = 2000;
const height = 2000;

const canvas = createCanvas(width, height);
const context = canvas.getContext("2d");

context.fillStyle = "#000000";
context.fillRect(0, 0, width, height);

context.textAlign = "center";
context.textBaseline = "middle";
context.fillStyle = "#FFFFFF";

async function doGetRequest() {
  let res = await axios.get("https://api.quotable.io/random");

  let data = res.data;
  console.log("Quote: " + data.content);

  const fontSizeUsed = drawMultilineText(context, data.content, {
    rect: {
      x: 1000,
      y: 500,
      width: 1080,
      height: 1080,
    },
    font: "Caveat",
    verbose: true,
    lineHeight: 0,
    minFontSize: 100,
    maxFontSize: 100,
  });

  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync("./output/quote.png", buffer);
}
doGetRequest();

function drawMultilineText(ctx, text, opts) {
  // Default options
  if (!opts) opts = {};
  if (!opts.font) opts.font = "sans-serif";
  if (typeof opts.stroke == "undefined") opts.stroke = false;
  if (typeof opts.verbose == "undefined") opts.verbose = false;
  if (!opts.rect)
    opts.rect = {
      x: 0,
      y: 0,
      width: ctx.canvas.width,
      height: ctx.canvas.height,
    };
  if (!opts.lineHeight) opts.lineHeight = 1.1;
  if (!opts.minFontSize) opts.minFontSize = 30;
  if (!opts.maxFontSize) opts.maxFontSize = 100;
  // Default log function is console.log - Note: if verbose il false, nothing will be logged anyway
  if (!opts.logFunction)
    opts.logFunction = function (message) {
      console.log(message);
    };

  const words = require("words-array")(text);
  if (opts.verbose)
    opts.logFunction("Text contains " + words.length + " words");
  var lines = [];
  let y; //New Line

  // Finds max font size  which can be used to print whole text in opts.rec

  let lastFittingLines; // declaring 4 new variables (addressing issue 3)
  let lastFittingFont;
  let lastFittingY;
  let lastFittingLineHeight;
  for (
    var fontSize = opts.minFontSize;
    fontSize <= opts.maxFontSize;
    fontSize++
  ) {
    // Line height
    var lineHeight = fontSize * opts.lineHeight;

    // Set font for testing with measureText()
    ctx.font = " " + fontSize + "px " + opts.font;

    // Start
    var x = opts.rect.x;
    y = lineHeight; //modified line        // setting to lineHeight as opposed to fontSize (addressing issue 1)
    lines = [];
    var line = "";

    // Cycles on words

    for (var word of words) {
      // Add next word to line
      var linePlus = line + word + " ";
      // If added word exceeds rect width...
      if (ctx.measureText(linePlus).width > opts.rect.width) {
        // ..."prints" (save) the line without last word
        lines.push({ text: line, x: x, y: y });
        // New line with ctx last word
        line = word + " ";
        y += lineHeight;
      } else {
        // ...continues appending words
        line = linePlus;
      }
    }

    // "Print" (save) last line
    lines.push({ text: line, x: x, y: y });

    // If bottom of rect is reached then breaks "fontSize" cycle

    if (y > opts.rect.height) break;

    lastFittingLines = lines; // using 4 new variables for 'step back' (issue 3)
    lastFittingFont = ctx.font;
    lastFittingY = y;
    lastFittingLineHeight = lineHeight;
  }

  lines = lastFittingLines; // assigning last fitting values (issue 3)
  ctx.font = lastFittingFont;
  if (opts.verbose) opts.logFunction("Font used: " + ctx.font);
  const offset =
    opts.rect.y -
    lastFittingLineHeight / 2 +
    (opts.rect.height - lastFittingY) / 2; // modifying calculation (issue 2)
  // Fill or stroke
  for (var line of lines)
    if (opts.stroke)
      ctx.strokeText(line.text.trim(), line.x, line.y + offset); //modified line
    else ctx.fillText(line.text.trim(), line.x, line.y + offset); //modified line

  // Returns font size
  return fontSize;
}
