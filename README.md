# Signing in the Name of

## Prerequisites
As specified in the repo and in the `prepare` script, Rust, Circom, snarkjs, and of course Nodejs are prerequisites to run the application. Also, all the node commands below must be run from the `/solution` folder. `npm install` must also be run before running the scripts.

## Signup
Run `node signup.js` and you will be prompted to enter a username, a password, how many group members you'd like to simulate. Finally you are prompted for the path to a file you'd like to ``add to the database'', i.e. some file that will be put in the pseudo-database `db.json`.

## Trusted setup
Run `node trustedSetup.js` and the `solution.circom` circuit will be created from the `solution-template.circom` with the relevant depth. Then it will perform the trusted setup with the generated file, and prompt for entropy from each user (max 5). Then it will also compile and perform the trusted setup for the reveal circuit.

## Sign Document
Run `node sign.js` and you will be prompted to sign the first file in the database for simplicity's sake. Then you are prompted for username and password to create the signature. Then the `proof.json` and `public.json` are saved in the database.

## Verify Signature
Run `node verifySignature.js` and you will be prompted to choose a file whose signature you'd like to verify.

## Reveal Yourself
Run `node reveal.js` and you will be prompted to verify that you'd like to reveal yourself as the signer of the first document. Then you have to input your username and password for verification.

## Verify Revelation
Run `node verifyRevelation.js` and you will be promted to pick a file whose signer revelation you'd like to verify. It will then output the user that revealed themselves as the signer.
