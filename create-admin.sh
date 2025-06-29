#!/bin/bash
# Create admin user script
# Usage: ./create-admin.sh <email> <password> [firstName] [lastName]

# Check if at least email and password are provided
if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Usage: ./create-admin.sh <email> <password> [firstName] [lastName]"
  exit 1
fi

# Run the Node.js script with provided arguments
node ./scripts/create-admin.js "$1" "$2" "${3:-Admin}" "${4:-User}"
