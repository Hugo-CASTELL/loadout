#!/usr/bin/env bash

set -euo pipefail

OUTPUT="loadouts_shared_generated.ts"
BACKEND_DIR="../backend/src/utils"
FRONTEND_DIR="../frontend/src/lib"

# Generate the file
{
    echo "// Generated the $(date '+%d/%m/%y')"
    echo

    for file in ./*.ts; do
        # Don't include the output file itself
        [[ "$file" == "./$OUTPUT" ]] && continue

        echo "// ===== $file ====="
        cat "$file"
        echo
    done
} > "$OUTPUT"

# Create destination directories if necessary
mkdir -p "$BACKEND_DIR"
mkdir -p "$FRONTEND_DIR"

# Copy the generated file
cp "$OUTPUT" "$BACKEND_DIR/$OUTPUT"
cp "$OUTPUT" "$FRONTEND_DIR/$OUTPUT"

# Remove the generated file from the current directory
rm "$OUTPUT"

echo "Generated and copied $OUTPUT successfully."