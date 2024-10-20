#!/bin/bash

set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <path_to_circom_file> <depth_of_merkle_tree>"
  exit 1
fi

CIRCOM_FILE=$1
DEPTH_OF_MERKLE_TREE=$2

cp "$CIRCOM_FILE-template.circom" "$CIRCOM_FILE.circom"

sed -i '' "s/<DEPTH_OF_MERKLE_TREE>/$DEPTH_OF_MERKLE_TREE/g" "$CIRCOM_FILE.circom"
