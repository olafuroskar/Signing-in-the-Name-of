const public = require("../solution/target/public.json");
const input = require("../solution/input.json");
const fs = require("fs");
const prompt = require("prompt-sync")();

function stringToBigInt(str) {
  return BigInt(
    Array.from(str)
      .map((char) => char.charCodeAt(0).toString())
      .join(""),
  );
}

function generateInput() {
  const publicJson = JSON.parse(public);
  const inputJson = JSON.parse(input);

  const password = BigInt(prompt("Enter your password: "));
  // Simulate server getting the salt
  const salt = inputJson.salt;

  const identity_secret = stringToBigInt(password);

  const signatureAttestation = publicJson[0];
  const message = public[2];

  fs.writeFile(
    "input.json",
    JSON.stringify({
      signatureAttestation,
      salt,
      identity_secret,
      message,
    }),
    () => {},
  );
}

(async () => {
  generateInput();
})();
