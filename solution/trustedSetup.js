const db = require("./db.json");
const { exec, spawn } = require("child_process");
const prompt = require("prompt-sync")();

(async () => {
  const depth = db.merkleDepth;
  console.log(
    `Compiling the circuit with the given Merkle tree depth (${depth}) in input.json`,
  );
  exec(`just build_depth solution ${depth}`, (error, stdout) => {
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

    const setupProcess = spawn("just", ["trusted_setup", "solution"]);

    // Listen to output from shell command
    setupProcess.stdout.on("data", (data) => {
      console.log(`Output: ${data}`);
      // Check if the script prompts for entropy
      if (data.toString().includes("Enter a random text. (Entropy):")) {
        /**
         * Simulate getting entropy from multiple users.
         */
        let entropy = "";
        for (let i = 0; i < 5; i++) {
          entropy += prompt("Enter a random text. (Entropy):");
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
        console.log("Setup finished successfully!");
        console.log("Run `node generateProof.js` to generate a signature.");
      } else {
        console.error(`Trusted setup process exited with code ${code}`);
      }
    });
  });
})();
