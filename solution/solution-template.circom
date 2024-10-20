include "circomlib/circuits/poseidon.circom";
include "merkle.circom"

// n is the depth of the Merkle tree
template SignMessage (n) {
  signal input identity_secret;
  signal input merkleProof[n - 1];
  signal input salt;
  signal input merkleRoot;
  signal input message;
  signal output signature;

  // Identity commitment
  component identityHasher = Poseidon(2);
  identityHasher.inputs[0] <== identity_secret;
  identityHasher.inputs[1] <== salt;
  signal myIdentity <== identityHasher.out;

  // Signature
  component signatureHasher = Poseidon(2);
  signatureHasher.inputs[0] <== identity_secret;
  signatureHasher.inputs[1] <== message;
  signature <== signatureHasher.out;

  // Membership check
  component proofHashers[n - 1];
  proofHashers[0] = Poseidon(2);
  proofHashers[0].inputs[0] <== myIdentity;
  proofHashers[0].inputs[1] <== merkleProof[0];
  signal currentHash <== proofHashers[0].out;

  for (var i = 1; i < n - 1; i++) {
    proofHashers[i] = Poseidon(2);
    proofHashers[i].inputs[0] <== currentHash;
    proofHashers[i].inputs[1] <== merkleProof[i];
    currentHash <== proofHashers[i].out;
  }

  signal hashDiff <== currentHash - merkleRoot;
  hashDiff === 0;
}

component main {public [salt, merkleRoot, message]} = SignMessage(<DEPTH_OF_MERKLE_TREE>);
