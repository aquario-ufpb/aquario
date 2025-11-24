#!/bin/bash
set -e

# Script to initialize and update all git submodules
# Handles both first-time clone (initialization) and updates existing submodules

echo "🔧 Setting up git submodules..."

# Navigate to the project root (in case script is called from elsewhere)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

# Check if .gitmodules exists
if [ ! -f .gitmodules ]; then
    echo "❌ No .gitmodules file found. Are you in the correct repository?"
    exit 1
fi

# Get list of submodules from .gitmodules
SUBMODULES=$(git config --file .gitmodules --get-regexp path | awk '{print $2}')

if [ -z "$SUBMODULES" ]; then
    echo "ℹ️  No submodules found in .gitmodules"
    exit 0
fi

echo "📦 Found submodules:"
for submodule in $SUBMODULES; do
    echo "   - $submodule"
done
echo ""

# Initialize submodules if not already initialized (for first-time clones)
echo "🔍 Checking submodule initialization status..."
for submodule in $SUBMODULES; do
    if [ ! -d "$submodule/.git" ]; then
        echo "📥 Initializing submodule: $submodule"
        git submodule init "$submodule"
        git submodule update "$submodule"
    else
        echo "✅ Submodule already initialized: $submodule"
    fi
done

echo ""
echo "🔄 Updating all submodules to latest..."

# Update all submodules to latest from their remotes
for submodule in $SUBMODULES; do
    echo ""
    echo "📦 Updating $submodule..."
    cd "$PROJECT_ROOT/$submodule"
    
    # Fetch latest changes
    git fetch origin
    
    # Detect the default branch - try main first, then master
    DEFAULT_BRANCH=""
    if git show-ref --verify --quiet refs/remotes/origin/main; then
        DEFAULT_BRANCH="main"
    elif git show-ref --verify --quiet refs/remotes/origin/master; then
        DEFAULT_BRANCH="master"
    else
        # Try to get from remote HEAD
        REMOTE_HEAD=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@' || echo "")
        if [ -n "$REMOTE_HEAD" ] && git show-ref --verify --quiet "refs/remotes/origin/$REMOTE_HEAD"; then
            DEFAULT_BRANCH="$REMOTE_HEAD"
        else
            echo "   ⚠️  Could not determine default branch, skipping update"
            cd "$PROJECT_ROOT"
            continue
        fi
    fi
    
    # Checkout the latest commit from the default branch (detached HEAD is fine for submodules)
    if [ -z "$DEFAULT_BRANCH" ]; then
        echo "   ⚠️  Default branch is empty, skipping update"
        cd "$PROJECT_ROOT"
        continue
    fi
    
    if git show-ref --verify --quiet "refs/remotes/origin/$DEFAULT_BRANCH"; then
        git checkout "origin/$DEFAULT_BRANCH" 2>/dev/null
    else
        echo "   ⚠️  Branch origin/$DEFAULT_BRANCH not found, skipping update"
        cd "$PROJECT_ROOT"
        continue
    fi
    
    # Show current commit
    echo "   Current commit: $(git log -1 --oneline)"
done

cd "$PROJECT_ROOT"

echo ""
echo "✅ All submodules initialized and updated successfully!"
echo ""
echo "📝 Submodule status:"
git submodule status

