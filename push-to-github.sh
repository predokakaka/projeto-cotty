#!/usr/bin/env bash
set -euo pipefail

# push-to-github.sh
# Usage:
#   GITHUB_TOKEN=ghp_xxx ./push-to-github.sh
#   or run without token to push interactively (you will be prompted for credentials)

REPO_URL="https://github.com/predokakaka/projetoBarbearia.git"
GIT_NAME="predokakaka"
GIT_EMAIL="pedromine2202a@gmail.com"

if ! command -v git >/dev/null 2>&1; then
  echo "ERROR: git not installed. Install git and retry." >&2
  exit 2
fi

echo "Using repository: $REPO_URL"

# configure user
git config user.name "$GIT_NAME"
git config user.email "$GIT_EMAIL"

# init repo if needed
if [ ! -d .git ]; then
  echo "Initializing git repository..."
  git init -b main
fi

# prepare remote URL (use token if provided)
if [ -n "${GITHUB_TOKEN-}" ]; then
  # embed token for non-interactive push
  AUTH_URL=$(echo "$REPO_URL" | sed -E "s#https://#https://$GITHUB_TOKEN@#")
  git remote remove origin 2>/dev/null || true
  git remote add origin "$AUTH_URL"
else
  git remote remove origin 2>/dev/null || true
  git remote add origin "$REPO_URL"
fi

echo "Adding files..."
git add -A

if git rev-parse --verify HEAD >/dev/null 2>&1; then
  if git diff --quiet --cached; then
    echo "No changes to commit."
  else
    git commit -m "chore: update project"
  fi
else
  git commit -m "chore: initial commit" || true
fi

# ensure branch name
git branch -M main || true

echo "Pushing to origin main..."
if git push -u origin main; then
  echo "Push successful."
  exit 0
else
  echo "Push failed. If you used a token ensure it has repo scope, or run interactively and provide credentials." >&2
  exit 3
fi
