const { buildPoseidon } = require("circomlibjs");

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

async function poseidonHash(inputs) {
  const poseidon = await buildPoseidon();
  return poseidon.F.toString(poseidon(inputs));
}

module.exports = { CIRCOM_PRIME_FIELD, stringToBigInt, poseidonHash };
