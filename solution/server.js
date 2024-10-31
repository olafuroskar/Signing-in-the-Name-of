/**
 * This file contains functions that simulate the server-side logic for our trusted server-side
 * - signUp
 * - Merkle tree generation
 * - Merkle proof generation
 * - File to BigInt conversion
 */
const crypto = require("crypto");
const fs = require("fs");
const { stringToBigInt, CIRCOM_PRIME_FIELD, poseidonHash } = require("./utils");

/**
 * Sign up a user by hashing their password and generating a random salt.
 */
async function signUp(password) {
  const numericSecret = stringToBigInt(password);

  // Generate a random salt (as a BigInt) using Node's crypto module
  const salt =
    BigInt("0x" + crypto.randomBytes(32).toString("hex")) % CIRCOM_PRIME_FIELD;

  // Append the salt to the inputs before hashing
  const inputsWithSalt = [numericSecret, salt];

  const publicKey = await poseidonHash(inputsWithSalt);

  return { publicKey, salt };
}

/**
 * Verify that a passwword and salt hashed together result in the given public key.
 */
async function verifyPasswordAndSalt(password, salt, publicKey) {
  const numericSecret = stringToBigInt(password);

  // Append the salt to the inputs before hashing
  const inputsWithSalt = [numericSecret, salt];

  const hash = await poseidonHash(inputsWithSalt);

  return hash === publicKey;
}

/**
 * Generate a Merkle tree from an array of leaves.
 */
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

  return { tree, merkleRoot };
}

/**
 * Generate a Merkle proof for a leaf node at a given index,
 * i.e. get the intermediate nodes needed to verify the leaf.
 */
function generateProof(tree, leafIndex) {
  let elements = [];
  let sides = [];
  let index = leafIndex;

  // Traverse each level and collect sibling hashes
  for (let i = 0; i < tree.length - 1; i++) {
    const level = tree[i];
    const isLeftNode = index % 2 !== 0;
    let siblingIndex = isLeftNode ? index - 1 : index + 1;
    siblingIndex = tree[i].length <= siblingIndex ? index : siblingIndex; // If odd number, duplicate last node

    if (siblingIndex < level.length) {
      elements.push(level[siblingIndex]); // Add sibling hash to the proof
      sides.push(isLeftNode ? 1 : 0);
    }

    index = Math.floor(index / 2); // Move to the next level
  }

  return { pathElements: elements, pathIndices: sides };
}

/**
 * Convert a file to a BigInt in the prime field of the Poseidon hash function.
 */
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

module.exports = {
  generateMerkleTree,
  generateProof,
  fileToBigIntInPrimeField,
  signUp,
  verifyPasswordAndSalt,
};
