#!/bin/sh -e

exec >> deploy-log.txt
exec 2>&1

BRANCH=hugo

echo "Deployment on $(date):"

# Update repo
git fetch --all
git reset --hard origin/$BRANCH
git submodule update

# Rebuild static files
hugo
