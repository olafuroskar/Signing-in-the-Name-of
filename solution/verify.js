const db = require("./db.json");
const { spawn } = require("child_process");
const prompt = require("prompt-sync")();
const { verifyPasswordAndSalt } = require("./server");
const { stringToBigInt } = require("./utils");
const fs = require("fs");

(async () => {
  const files = Object.entries(db.files);

  const fileMap = {};
  files.forEach((fileObj, i) => {
    const file = Object.entries(fileObj[1])[0];
    console.log(`${i + 1}: ${file[1].filePath}`);
    fileMap[i] = { key: fileObj[0], ...file[1] };
  });
  const fileNr = prompt("Enter the file number you want to verify: ");

  const file = fileMap[fileNr - 1];
  if (!file) {
    console.log("No file in database");
    return;
  }

  const proof = file.proof;
  const public = file.public;

  fs.writeFile("target/proof.json", JSON.stringify(proof), () => {});
  fs.writeFile("target/public.json", JSON.stringify(public), () => {});

  const verifyProcess = spawn("just", ["verify_proof", "solution"]);

  // Listen to output from shell command
  verifyProcess.stdout.on("data", (data) => {
    console.log(`Output: ${data}`);
  });

  verifyProcess.stderr.on("data", (data) => {
    console.error(`Error: ${data}`);
  });
})();
