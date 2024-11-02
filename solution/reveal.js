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
  const signatureAttestation = file[1].public[0];
  const fileKey = file[0];

  const y = prompt(
    `Would you like to reveal that you signed the file at ${filePath}? (Y/n)`,
    {
      value: "Y",
    },
  );

  if (y.toUpperCase() !== "Y") {
    console.log("Cancelled...");
    return;
  }
  const username = prompt("Enter your username: ");
  const password = prompt("Enter your password: ");

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
  fs.writeFile(
    "reveal/input.json",
    JSON.stringify({
      identity_secret: stringToBigInt(password).toString(),
      salt: user.salt,
      document: fileKey,
      signatureAttestation,
    }),
    () => {
      const proofProcess = spawn("just", [
        "generate_proof",
        "solution/reveal",
        "reveal",
      ]);

      // Listen to output from shell command
      proofProcess.stdout.on("data", (data) => {
        console.log(`Output: ${data}`);
      });

      proofProcess.stderr.on("data", (data) => {
        console.error(`Error: ${data}`);
      });

      proofProcess.on("close", (code) => {
        if (code === 0) {
          const proof = fs.readFileSync("reveal/target/proof.json", "utf8");
          const public = fs.readFileSync("reveal/target/public.json", "utf8");
          const newDb = {
            ...db,
            files: db.files.map((f) => {
              if (Object.keys(f)[0] === fileKey) {
                return {
                  [fileKey]: {
                    ...f[fileKey],
                    revealed: {
                      proof,
                      public,
                    },
                  },
                };
              }
              return f;
            }),
          };
          fs.writeFile("db.json", JSON.stringify(newDb), () => {
            console.log("Proof generated successfully!");

            fs.rm("reveal/target/proof.json", () => {
              console.log("Deleted proof.json");
            });
            fs.rm("reveal/target/public.json", () => {
              console.log("Deleted public.json");
            });
          });
        } else {
          console.error(`Proof generation process exited with code ${code}`);
        }
      });
    },
  );
})();
