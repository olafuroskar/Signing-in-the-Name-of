const crypto = require("crypto");
const fs = require("fs");
const prompt = require("prompt-sync")();
const { stringToBigInt, CIRCOM_PRIME_FIELD, poseidonHash } = require("./utils");
const {
  generateProof,
  signUp,
  generateMerkleTree,
  fileToBigIntInPrimeField,
} = require("./server");
/**
 * Main function that simulates the user sign-up process.
 */
(async () => {
  const username = prompt("Enter your username: ");
  const password = prompt("Enter your password: ");
  const numUsers = parseInt(prompt("How many simulated users: "), 10);

  // Generate random passwords for users in the group
  const users = [];
  const randomIndex = Math.floor(Math.random() * numUsers);
  for (let i = 0; i < numUsers; i++) {
    if (i === randomIndex) {
      users.push({ username, password });
    } else {
      users.push({
        username: "user" + i,
        password: crypto.randomBytes(16).toString("hex"),
      });
    }
  }

  const pKsAndSalts = await Promise.all(
    users.map(async ({ username, password }) => ({
      username,
      ...(await signUp(password)),
    })),
  );

  const { tree, merkleRoot } = await generateMerkleTree(
    pKsAndSalts.map(({ publicKey }) => publicKey),
  );

  const filePath = prompt("Enter the file path to generate a bigint: ");
  const fileBigInt = await fileToBigIntInPrimeField(filePath);

  const bits = (arr) => arr.map((bi) => bi.toString());

  fs.writeFile(
    "db.json",
    JSON.stringify({
      users: pKsAndSalts.map(({ username, publicKey, salt }, i) => ({
        publicKey: publicKey.toString(),
        username,
        salt: salt.toString(),
        // Generate pathElements and pathIndices for each user
        ...Object.fromEntries(
          Object.entries(generateProof(tree, i)).map(([k, v]) => [k, bits(v)]),
        ),
      })),
      files: [
        { [fileBigInt.toString()]: { filePath } },
        {
          ["123456789"]: {
            filePath: "unverifiable.pdf",
            proof: {},
            public: {},
          },
        },
      ],
      merkleRoot,
      merkleDepth: tree.length,
    }),
    () => {},
  );
  console.log("db written to db.json");
  console.log("To compile the circuit, run `node trustedSetup.js`");

  fs.writeFile(
    "debug.json",
    JSON.stringify({
      tree: tree.map((level) => level.map((node) => node.toString())),
    }),
    () => {},
  );
})();
