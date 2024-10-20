const { buildPoseidon } = require("circomlibjs");
const crypto = require("crypto");
const fs = require("fs");

// Helper function to convert a string to an array of Unicode code points (BigInt)
function stringToBigInt(str) {
  return BigInt(
    Array.from(str)
      .map((char) => char.charCodeAt(0).toString())
      .join(""),
  );
}

// Server side
function signUpServer(publicKey, salt) {
  // Store public key and salt
  console.log({ publicKey, salt });
}

async function poseidonHash(inputs) {
  const poseidon = await buildPoseidon();
  return poseidon.F.toString(poseidon(inputs));
}

// Client side
async function signUpClient(password) {
  const numericSecret = stringToBigInt(password);

  // Generate a random salt (as a BigInt) using Node's crypto module
  const salt = BigInt("0x" + crypto.randomBytes(32).toString("hex"));

  // Append the salt to the inputs before hashing
  const inputsWithSalt = [numericSecret, salt];

  const publicKey = await poseidonHash(inputsWithSalt);

  // Send public key to server
  signUpServer(publicKey, salt);

  return { publicKey, salt };
}

function commitMerkleTree(tree, merkleRoot) {
  // Save tree and merkleRoot to database
}

// Server side
async function generateMerkleTree(leaves) {
  // We expect the leaves to already be hashed.
  let tree = [leaves];
  while (tree[tree.length - 1].length > 1) {
    const currLevel = tree[tree.length - 1];
    const nextLevel = [];
    // Hash adjacent nodes
    for (let i = 0; i < currLevel.length; i += 2) {
      const left = currLevel[i];
      const right = i + 1 < currLevel.length ? currLevel[i + 1] : left; // If odd number, duplicate last node
      const combinedHash = await poseidonHash([BigInt(left), BigInt(right)]);
      nextLevel.push(combinedHash);
    }

    tree.push(nextLevel);
  }

  // Merkle root should be the only element in the last level
  const merkleRoot = tree[tree.length - 1][0];

  commitMerkleTree(tree, merkleRoot);

  return { tree, merkleRoot };
}

function generateProof(tree, leafIndex) {
  let proof = [];
  let index = leafIndex;

  // Traverse each level and collect sibling hashes
  for (let i = 0; i < tree.length - 1; i++) {
    const level = tree[i];
    const isRightNode = index % 2 !== 0;
    const siblingIndex = isRightNode ? index - 1 : index + 1;

    if (siblingIndex < level.length) {
      proof.push(level[siblingIndex]); // Add sibling hash to the proof
    }

    index = Math.floor(index / 2); // Move to the next level
  }

  return proof;
}

// Main function to handle command-line arguments and run the example
(async () => {
  // Get command-line arguments (ignoring the first two which are the path to Node.js and the script itself)
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Please provide some input strings as arguments.");
    process.exit(1);
  }

  const publicKeys = [];
  const salts = [];
  const pKsAndSalts = await Promise.all(
    args.map(async (pk) => await signUpClient(pk)),
  );

  pKsAndSalts.forEach(({ publicKey, salt }) => {
    publicKeys.push(publicKey);
    salts.push(salt);
  });

  const { tree, merkleRoot } = await generateMerkleTree(publicKeys);

  const proof = generateProof(tree, 0);

  fs.writeFile(
    "input.json",
    JSON.stringify({
      identity_secret: stringToBigInt(args[0]).toString(),
      salt: salts[0].toString(),
      merkleProof: proof.map((lvl) => lvl.toString()),
      merkleRoot: merkleRoot.toString(),
      message: 123456789,
    }),
    () => {},
  );

  const bits = (arr) => arr.map((bi) => bi.toString());

  fs.writeFile(
    "debug.json",
    JSON.stringify({
      tree: tree.map((level) => level.map((node) => node.toString())),
      salts: bits(salts),
      merkleRoot: merkleRoot.toString(),
      proof: bits(proof),
      publicKeys: bits(publicKeys),
    }),
    () => {},
  );

  console.log({ tree });
  console.log({
    publicKeys,
    proverSalt: salts[0],
    proverSk: args[0],
    proof,
    merkleRoot,
    depth: tree.length,
  });
})();
