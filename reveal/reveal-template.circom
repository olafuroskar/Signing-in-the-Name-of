pragma circom 2.0.0;

include "circomlib/circuits/poseidon.circom";

template Reveal() {
  signal input identity_secret;
  signal input salt;
  signal input message;
  signal input signatureAttestation;

  // Signature
  component signatureHasher = Poseidon(3);
  signatureHasher.inputs[0] <== identity_secret;
  signatureHasher.inputs[1] <== message;
  signatureHasher.inputs[2] <== salt;
  signature <== signatureHasher.out;

  signal diff <== signatureAttestation - signature;

  diff === 0;
}

component main {public [message, signatureAttestation]} = Reveal();

