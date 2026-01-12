#!/bin/bash
# Claude Agent Setting - Unix Installation Script
# Run: bash install.sh

set -e

CLAUDE_DIR="$HOME/.claude"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "\033[36m"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║       Claude Agent Setting - Installation                    ║"
echo "║       Self-Verification Pipeline & Norse Agents              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "\033[0m"

# Create .claude directory
if [ ! -d "$CLAUDE_DIR" ]; then
    mkdir -p "$CLAUDE_DIR"
    echo -e "\033[32m✓ Created: $CLAUDE_DIR\033[0m"
fi

# Backup existing settings.json
SETTINGS_FILE="$CLAUDE_DIR/settings.json"
if [ -f "$SETTINGS_FILE" ]; then
    BACKUP_FILE="$CLAUDE_DIR/settings.backup.$(date +%Y%m%d_%H%M%S).json"
    cp "$SETTINGS_FILE" "$BACKUP_FILE"
    echo -e "\033[33m⚠ Backup created: $BACKUP_FILE\033[0m"
fi

# Copy and convert settings
SOURCE_SETTINGS="$SCRIPT_DIR/.claude/settings.local.json"
if [ -f "$SOURCE_SETTINGS" ]; then
    cp "$SOURCE_SETTINGS" "$SETTINGS_FILE"

    # Convert Windows paths to Unix paths
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' 's|%USERPROFILE%\\\\.claude\\\\|'"$HOME"'/.claude/|g' "$SETTINGS_FILE"
        sed -i '' 's|\\\\|/|g' "$SETTINGS_FILE"
        sed -i '' 's|"command": "cmd",|"command": "npx",|g' "$SETTINGS_FILE"
        sed -i '' 's|"/c", "npx", "-y",|"-y",|g' "$SETTINGS_FILE"
    else
        # Linux
        sed -i 's|%USERPROFILE%\\\\.claude\\\\|'"$HOME"'/.claude/|g' "$SETTINGS_FILE"
        sed -i 's|\\\\|/|g' "$SETTINGS_FILE"
        sed -i 's|"command": "cmd",|"command": "npx",|g' "$SETTINGS_FILE"
        sed -i 's|"/c", "npx", "-y",|"-y",|g' "$SETTINGS_FILE"
    fi

    echo -e "\033[32m✓ Settings installed: $SETTINGS_FILE\033[0m"
fi

# Copy hooks directory (with subdirectories)
HOOKS_DIR="$CLAUDE_DIR/hooks"
if [ -d "$SCRIPT_DIR/hooks" ]; then
    rm -rf "$HOOKS_DIR"
    cp -r "$SCRIPT_DIR/hooks" "$HOOKS_DIR"
    echo -e "\033[32m✓ Hooks installed: $HOOKS_DIR\033[0m"
fi

# Copy skills directory
SKILLS_DIR="$CLAUDE_DIR/skills"
if [ -d "$SCRIPT_DIR/.claude/skills" ]; then
    rm -rf "$SKILLS_DIR"
    cp -r "$SCRIPT_DIR/.claude/skills" "$SKILLS_DIR"
    echo -e "\033[32m✓ Skills installed: $SKILLS_DIR\033[0m"
fi

# Copy agents directory (Norse mythology agents)
AGENTS_DIR="$CLAUDE_DIR/agents"
if [ -d "$SCRIPT_DIR/.claude/agents" ]; then
    rm -rf "$AGENTS_DIR"
    cp -r "$SCRIPT_DIR/.claude/agents" "$AGENTS_DIR"
    echo -e "\033[32m✓ Agents installed: $AGENTS_DIR\033[0m"
fi

# Copy CLAUDE.md (orchestration rules)
CLAUDE_MD="$SCRIPT_DIR/.claude/CLAUDE.md"
if [ -f "$CLAUDE_MD" ]; then
    cp "$CLAUDE_MD" "$CLAUDE_DIR/CLAUDE.md"
    echo -e "\033[32m✓ CLAUDE.md installed: $CLAUDE_DIR/CLAUDE.md\033[0m"
fi

# Copy MCP config
MCP_SOURCE="$SCRIPT_DIR/mcp/mcp.json"
if [ -f "$MCP_SOURCE" ]; then
    cp "$MCP_SOURCE" "$CLAUDE_DIR/mcp.json"
    echo -e "\033[32m✓ MCP config installed: $CLAUDE_DIR/mcp.json\033[0m"
fi

# Copy ast-grep rules
if [ -d "$SCRIPT_DIR/.claude/ast-grep" ]; then
    AST_GREP_DIR="$CLAUDE_DIR/ast-grep"
    rm -rf "$AST_GREP_DIR"
    cp -r "$SCRIPT_DIR/.claude/ast-grep" "$AST_GREP_DIR"
    echo -e "\033[32m✓ ast-grep rules installed: $AST_GREP_DIR\033[0m"
fi

echo ""
echo -e "\033[32m═══════════════════════════════════════════════════════════════\033[0m"
echo -e "\033[32m  Installation Complete!\033[0m"
echo -e "\033[32m═══════════════════════════════════════════════════════════════\033[0m"
echo ""
echo -e "\033[36mInstalled Components:\033[0m"
echo "  • 9 Norse Agents: odin, huginn, mimir, heimdall, forseti, freya, tyr, baldur, loki"
echo "  • 8 Skills: sisyphus, ultrawork, deepsearch, ralph-loop, plan, review, orchestrator, analyze"
echo "  • Self-Verification Pipeline (code→heimdall, plan→loki)"
echo ""
echo -e "\033[36mConfiguration: $CLAUDE_DIR\033[0m"
echo ""
echo -e "\033[33mOptional MCP Servers:\033[0m"
echo "  claude mcp add context7 -- npx -y @upstash/context7-mcp@latest"
echo "  claude mcp add github -- npx -y @modelcontextprotocol/server-github"
echo ""
echo -e "\033[33mOptional ast-grep:\033[0m"
echo "  brew install ast-grep  # macOS"
echo "  pip install uv         # for ast-grep MCP server"
echo ""
