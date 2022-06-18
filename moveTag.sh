#!/bin/bash

# This script gets executed by semantic-release/exec after a release is published.
# It will push a shortened tag (e.g. v1 for v1.0.0) as it is considered best practice to do so in GitHub Actions.

FULL_TAG="v$1"
SHORT_TAG=$(echo $FULL_TAG | cut -d '.' -f 1)

git config --global user.name 'Vitest Coverage Action Bot'
git config --global user.email '41898282+github-actions[bot]@users.noreply.github.com'
git push origin :refs/tags/$SHORT_TAG
git tag -f $SHORT_TAG $FULL_TAG
git push origin $SHORT_TAG
