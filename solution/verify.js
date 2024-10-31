const db = require("./db.json");
const { spawn } = require("child_process");
const prompt = require("prompt-sync")();
const { verifyPasswordAndSalt } = require("./server");
const { stringToBigInt } = require("./utils");
const fs = require("fs");

(async () => {
  const file = Object.entries(db.files[0])[0];
  if (!file) {
    console.log("No file in database");
    return;
  }

  const filePath = file[1].filePath;
  const fileKey = file[0];

  const y = prompt(`Would you like to sign the file at ${filePath}? (Y/n)`, {
    value: "Y",
  });

  if (y.toUpperCase() !== "Y") {
    console.log("Cancelled...");
    return;
  }
  const username = prompt("Enter your username: ");
  const password = prompt("Enter your password to verify signature: ");

  const user = db.users.find((u) => u.username === username);

  const isVerified = await verifyPasswordAndSalt(
    password,
    user.salt,
    user.publicKey,
  );

  if (!isVerified) {
    console.log("The username and password combination does not exist");
    return;
  }

  const merkleRoot = db.merkleRoot;

  fs.writeFile(
    "input.json",
    JSON.stringify({
      identity_secret: stringToBigInt(password).toString(),
      salt: user.salt,
      pathElements: user.pathElements,
      pathIndices: user.pathIndices,
      merkleRoot,
      message: fileKey,
    }),
    () => {
      const proofProcess = spawn("just", ["generate_proof", "solution"]);

      // Listen to output from shell command
      proofProcess.stdout.on("data", (data) => {
        console.log(`Output: ${data}`);
      });

      proofProcess.stderr.on("data", (data) => {
        console.error(`Error: ${data}`);
      });

      proofProcess.on("close", (code) => {
        if (code === 0) {
          console.log("Proof generated successfully!");
        } else {
          console.error(`Proof generation process exited with code ${code}`);
        }
      });
    },
  );
})();
