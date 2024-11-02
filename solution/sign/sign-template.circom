pragma circom 2.0.0;

include "circomlib/circuits/poseidon.circom";
include "merkle.circom";

// n is the depth of the Merkle tree
template SignDocument (n) {
  signal input identity_secret;
  // signal input merkleProof[n - 1];
  signal input pathElements[n - 1];
  signal input pathIndices[n - 1];
  signal input salt;
  signal input merkleRoot;
  signal input document;
  signal output signature;

  // Identity commitment
  component identityHasher = Poseidon(2);
  identityHasher.inputs[0] <== identity_secret;
  identityHasher.inputs[1] <== salt;
  signal myIdentity <== identityHasher.out;

  // Signature
  component signatureHasher = Poseidon(2);
  signatureHasher.inputs[0] <== identity_secret;
  signatureHasher.inputs[1] <== document;
  signature <== signatureHasher.out;

  // Membership check
  component tree = MerkleTreeChecker(n - 1);
  tree.leaf <== myIdentity;
  tree.root <== merkleRoot;
  for (var i = 0; i < n - 1; i++) {
    tree.pathElements[i] <== pathElements[i];
    tree.pathIndices[i] <== pathIndices[i];
  }
}

component main {public [merkleRoot, document]} = SignDocument(<DEPTH_OF_MERKLE_TREE>);
