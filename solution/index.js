const { buildPoseidon } = require("circomlibjs");
const crypto = require("crypto");
const fs = require("fs");
const prompt = require("prompt-sync")();

const CIRCOM_PRIME_FIELD = BigInt(
  "21888242871839275222246405745257275088548364400416034343698204186575808495617",
);

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
  const salt =
    BigInt("0x" + crypto.randomBytes(32).toString("hex")) % CIRCOM_PRIME_FIELD;

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
  let elements = [];
  let sides = [];
  let index = leafIndex;

  // Traverse each level and collect sibling hashes
  for (let i = 0; i < tree.length - 1; i++) {
    const level = tree[i];
    const isLeftNode = index % 2 !== 0;
    const siblingIndex = isLeftNode ? index - 1 : index + 1;

    if (siblingIndex < level.length) {
      elements.push(level[siblingIndex]); // Add sibling hash to the proof
      sides.push(isLeftNode ? 1 : 0);
    }

    index = Math.floor(index / 2); // Move to the next level
  }

  return { elements, sides };
}

async function fileToBigIntInPrimeField(filePath) {
  try {
    // Read file content as binary data
    const fileBuffer = fs.readFileSync(filePath);

    // Create a SHA-256 hash of the binary data for a deterministic result
    const hash = crypto.createHash("sha256").update(fileBuffer).digest();

    // Convert hash to a BigInt
    const bigIntFromHash =
      BigInt(`0x${hash.toString("hex")}`) % CIRCOM_PRIME_FIELD;

    return bigIntFromHash;
  } catch (error) {
    console.error("Error reading or processing file:", error);
    throw error;
  }
}

// Main function to handle command-line arguments and run the example
(async () => {
  const password = prompt("Enter your password: ");
  const numUsers = parseInt(
    prompt("Enter the number of users in your group: "),
    10,
  );

  // Generate random passwords for users in the group
  const passwords = [];
  const randomIndex = Math.floor(Math.random() * numUsers);
  for (let i = 0; i < numUsers; i++) {
    if (i === randomIndex) {
      passwords.push(password);
    } else {
      passwords.push(crypto.randomBytes(16).toString("hex"));
    }
  }

  const publicKeys = [];
  const salts = [];
  const pKsAndSalts = await Promise.all(
    passwords.map(async (pk) => await signUpClient(pk)),
  );

  pKsAndSalts.forEach(({ publicKey, salt }) => {
    publicKeys.push(publicKey);
    salts.push(salt);
  });

  const { tree, merkleRoot } = await generateMerkleTree(publicKeys);
  const { elements, sides } = generateProof(tree, randomIndex);

  const filePath = prompt("Enter the file path to generate a bigint: ");
  const fileBigInt = await fileToBigIntInPrimeField(filePath);

  const bits = (arr) => arr.map((bi) => bi.toString());

  fs.writeFile(
    "input.json",
    JSON.stringify({
      identity_secret: stringToBigInt(password).toString(),
      salt: salts[randomIndex].toString(),
      pathElements: bits(elements),
      pathIndices: bits(sides),
      merkleRoot: merkleRoot.toString(),
      message: fileBigInt.toString(),
    }),
    () => {},
  );

  console.log(`Run: just build_depth solution ${tree.length}`);

  fs.writeFile(
    "debug.json",
    JSON.stringify({
      tree: tree.map((level) => level.map((node) => node.toString())),
      salts: bits(salts),
      merkleRoot: merkleRoot.toString(),
      pathElements: bits(elements),
      pathIndices: bits(sides),
      publicKeys: bits(publicKeys),
    }),
    () => {},
  );
})();
