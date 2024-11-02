pragma circom 2.0.0;

include "circomlib/circuits/poseidon.circom";

template Reveal() {
  signal input identity_secret;
  signal input salt;
  signal input document;
  signal input signatureAttestation;
  signal output myIdentity;

  // Identity commitment
  component identityHasher = Poseidon(2);
  identityHasher.inputs[0] <== identity_secret;
  identityHasher.inputs[1] <== salt;
  myIdentity <== identityHasher.out;

  // Signature
  component signatureHasher = Poseidon(2);
  signatureHasher.inputs[0] <== identity_secret;
  signatureHasher.inputs[1] <== document;
  signal signature <== signatureHasher.out;

  signal diff <== signatureAttestation - signature;

  diff === 0;
}

component main {public [document, signatureAttestation]} = Reveal();
