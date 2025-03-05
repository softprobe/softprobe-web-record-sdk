#!/bin/bash

# Pull the latest tags from the remote repository
git pull --tags

# Fetch the most recent tag
latest_tag=$(git tag --sort=-creatordate | head -n 1)

# Extract the major, minor, and patch versions
major=$(echo $latest_tag | cut -d. -f1 | tr -d 'v')
minor=$(echo $latest_tag | cut -d. -f2)
patch=$(echo $latest_tag | cut -d. -f3)

# Increase the patch version
new_patch=$((patch + 1))

# Form the new version
new_version="v${major}.${minor}.${new_patch}"

# Create the new tag and release
gh release create $new_version --title "Release $new_version" -n "Description for release $new_version"

echo "Created new release: $new_version"
