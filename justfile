# Install tools and dependencies
prepare:
    ./scripts/prepare.sh

# Build a circuit, output .r1cs and .wasm files
build dir name:
    ./scripts/build.sh {{dir}}/{{name}}.circom

# Run a trusted setup (both phases), output proving and verification keys
trusted_setup dir name:
    ./scripts/trusted_setup.sh {{dir}}/target/{{name}}.r1cs

# Run a trusted setup using pot12, phase 2 only, output proving and verification keys
trusted_setup_phase2 dir name:
    ./scripts/trusted_setup_phase2.sh ptau/pot12.ptau {{dir}}/target/{{name}}.r1cs

# Generate a proof, output proof and public output files
generate_proof dir name:
    ./scripts/generate_proof.sh {{dir}}/target/{{name}}_0001.zkey \
        {{dir}}/target/{{name}}_js/{{name}}.wasm \
        {{dir}}/input.json

# Verifies a proof, output true or false
verify_proof dir name:
    ./scripts/verify_proof.sh {{dir}}/target/{{name}}_verification_key.json \
        {{dir}}/target/public.json \
        {{dir}}/target/proof.json

generate_identity:
    ./scripts/generate_identity.sh

set_depth dir name depth:
    ./scripts/set_depth.sh {{dir}}/{{name}} \
    {{depth}}

# Build a circuit, output .r1cs and .wasm files with certain merkle tree depth
build_depth dir name depth:
    ./scripts/build_depth.sh {{dir}}/{{name}} \
    {{depth}}

# Run all steps for a specific example
all dir name:
    just prepare
    just build {{dir}} {{name}}
    just trusted_setup {{dir}} {{name}}
    just trusted_setup_phase2 {{dir}} {{name}}
    just generate_proof {{dir}} {{name}}
    just verify_proof {{dir}} {{name}}
    just set_depth {{dir}} {{name}} 8
    just build_depth {{dir}} {{name}} 8
