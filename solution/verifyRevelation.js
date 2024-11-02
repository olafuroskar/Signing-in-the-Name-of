const db = require("./db.json");
const { spawn } = require("child_process");
const prompt = require("prompt-sync")();
const fs = require("fs");

(async () => {
  const files = Object.entries(db.files);

  const fileMap = {};
  files.forEach((fileObj, i) => {
    const file = Object.entries(fileObj[1])[0];
    console.log(`${i + 1}: ${file[1].filePath}`);
    fileMap[i] = { key: fileObj[0], ...file[1] };
  });
  const fileNr = prompt(
    "Enter the file number whose signature revelation you want to verify: ",
  );

  const file = fileMap[fileNr - 1];
  if (!file) {
    console.log("No file in database");
    return;
  }

  const proof = file.revealed.proof;
  const public = file.revealed.public;

  fs.writeFile("reveal/target/proof.json", proof, () => {});
  fs.writeFile("reveal/target/public.json", public, () => {});

  const verifyProcess = spawn("just", [
    "verify_proof",
    "solution/reveal",
    "reveal",
  ]);

  verifyProcess.on("close", (code) => {
    if (code === 0) {
      fs.rm("reveal/target/proof.json", () => {
        console.log("Deleted proof.json");
      });
      fs.rm("reveal/target/public.json", () => {
        console.log("Deleted public.json");
      });
      const user = db.users.find(
        (user) => user.publicKey === JSON.parse(public)[0],
      );
      console.log(
        `Verified that \x1b[35m%s\x1b[0m signed the file. ✅`,
        user.username,
      );
    }
  });

  // Listen to output from shell command
  verifyProcess.stdout.on("data", (data) => {
    console.log(`Output: ${data}`);
  });

  verifyProcess.stderr.on("data", (data) => {
    console.error(`Error: ${data}`);
  });
})();
