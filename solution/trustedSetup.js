const crypto = require("crypto");
const db = require("./db.json");
const { exec, spawn } = require("child_process");
const prompt = require("prompt-sync")();

(async () => {
  const depth = db.merkleDepth;
  console.log(
    `Compiling the circuit with the given Merkle tree depth (${depth}) in input.json`,
  );
  exec(
    `just build_depth solution/sign sign ${depth} && just build solution/reveal reveal`,
    (error, stdout) => {
      if (error) {
        console.error(`Error compiling the circuit: ${error.message}`);
        return;
      }
      if (error) {
        console.error(`Error compiling the circuit: ${error}`);
        return;
      }
      console.log("Circuit compiled successfully!");

      console.log("Starting trusted setup...");

      const setupProcess = spawn("just", [
        "trusted_setup",
        "solution/sign",
        "sign",
      ]);

      // Listen to output from shell command
      setupProcess.stdout.on("data", (data) => {
        console.log(`Output: ${data}`);
        // Check if the script prompts for entropy
        if (data.toString().includes("Enter a random text. (Entropy):")) {
          /**
           * Simulate getting entropy from multiple users.
           */
          let entropy = "";
          const numEntropies = Math.max(5, db.users.length);
          console.log(
            `Simulate entropy from multiple users (max(5, ${numEntropies}))`,
          );
          for (let i = 0; i < numEntropies; i++) {
            entropy += prompt(`User #${i + 1} Enter a random text. (Entropy):`);
          }
          // Respond to the input prompt
          setupProcess.stdin.write(`${entropy}\n`); // Replace with actual input
        }
      });

      setupProcess.stderr.on("data", (data) => {
        console.error(`Error: ${data}`);
      });

      setupProcess.on("close", (code) => {
        if (code === 0) {
          console.log("Running trusted setup for reveal circuit...");
          const revealSetupProcess = spawn("just", [
            "trusted_setup",
            "solution/reveal",
            "reveal",
          ]);

          // Listen to output from shell command
          revealSetupProcess.stdout.on("data", (data) => {
            console.log(`Output: ${data}`);
            // Check if the script prompts for entropy
            if (data.toString().includes("Enter a random text. (Entropy):")) {
              /**
               * Simulate random entropy.
               * ! crypto.randomBytes is not truly random, but we use it here for simplicity.
               */
              // Respond to the input prompt
              revealSetupProcess.stdin.write(
                `${crypto.randomBytes(32).toString("hex")}\n`,
              ); // Replace with actual input
            }
          });

          revealSetupProcess.stderr.on("data", (data) => {
            console.error(`Error: ${data}`);
          });

          revealSetupProcess.on("close", (code) => {
            if (code === 0) {
              console.log("Setup finished successfully!");
              console.log("Run `node sign.js` to generate a signature.");
            } else {
              console.error(`Trusted setup process exited with code ${code}`);
            }
          });
        } else {
          console.error(`Trusted setup process exited with code ${code}`);
        }
      });
    },
  );
})();
