#!/bin/bash
# Claude Agent Setting - Unix Installation Script
# Run: bash install.sh

set -e

CLAUDE_DIR="$HOME/.claude"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "\033[36m"
echo "================================================================"
echo "       Claude Agent Setting - Installation                      "
echo "       Self-Verification Pipeline + Specialized Agents          "
echo "================================================================"
echo -e "\033[0m"

# Create .claude directory
if [ ! -d "$CLAUDE_DIR" ]; then
    mkdir -p "$CLAUDE_DIR"
    echo -e "\033[32m[OK] Created: $CLAUDE_DIR\033[0m"
fi

# Backup existing settings.json
SETTINGS_FILE="$CLAUDE_DIR/settings.json"
if [ -f "$SETTINGS_FILE" ]; then
    BACKUP_FILE="$CLAUDE_DIR/settings.backup.$(date +%Y%m%d_%H%M%S).json"
    cp "$SETTINGS_FILE" "$BACKUP_FILE"
    echo -e "\033[33m[!] Backup created: $BACKUP_FILE\033[0m"
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

    echo -e "\033[32m[OK] Settings installed: $SETTINGS_FILE\033[0m"
fi

# Copy hooks directory (with subdirectories)
HOOKS_DIR="$CLAUDE_DIR/hooks"
if [ -d "$SCRIPT_DIR/hooks" ]; then
    rm -rf "$HOOKS_DIR"
    cp -r "$SCRIPT_DIR/hooks" "$HOOKS_DIR"
    echo -e "\033[32m[OK] Hooks installed: $HOOKS_DIR\033[0m"
fi

# Copy skills directory
SKILLS_DIR="$CLAUDE_DIR/skills"
if [ -d "$SCRIPT_DIR/.claude/skills" ]; then
    rm -rf "$SKILLS_DIR"
    cp -r "$SCRIPT_DIR/.claude/skills" "$SKILLS_DIR"
    echo -e "\033[32m[OK] Skills installed: $SKILLS_DIR\033[0m"
fi

# Copy agents directory (Norse mythology agents)
AGENTS_DIR="$CLAUDE_DIR/agents"
if [ -d "$SCRIPT_DIR/.claude/agents" ]; then
    rm -rf "$AGENTS_DIR"
    cp -r "$SCRIPT_DIR/.claude/agents" "$AGENTS_DIR"
    echo -e "\033[32m[OK] Agents installed: $AGENTS_DIR\033[0m"
fi

# Copy CLAUDE.md (orchestration rules)
CLAUDE_MD="$SCRIPT_DIR/.claude/CLAUDE.md"
if [ -f "$CLAUDE_MD" ]; then
    cp "$CLAUDE_MD" "$CLAUDE_DIR/CLAUDE.md"
    echo -e "\033[32m[OK] CLAUDE.md installed: $CLAUDE_DIR/CLAUDE.md\033[0m"
fi

# Copy MCP config
MCP_SOURCE="$SCRIPT_DIR/mcp/mcp.json"
if [ -f "$MCP_SOURCE" ]; then
    cp "$MCP_SOURCE" "$CLAUDE_DIR/mcp.json"
    echo -e "\033[32m[OK] MCP config installed: $CLAUDE_DIR/mcp.json\033[0m"
fi

# Copy ast-grep rules
if [ -d "$SCRIPT_DIR/.claude/ast-grep" ]; then
    AST_GREP_DIR="$CLAUDE_DIR/ast-grep"
    rm -rf "$AST_GREP_DIR"
    cp -r "$SCRIPT_DIR/.claude/ast-grep" "$AST_GREP_DIR"
    echo -e "\033[32m[OK] ast-grep rules installed: $AST_GREP_DIR\033[0m"
fi

# Install ast-grep if not present
AST_GREP_INSTALLED=false
if command -v ast-grep &> /dev/null; then
    echo -e "\033[32m[OK] ast-grep already installed\033[0m"
    AST_GREP_INSTALLED=true
else
    echo ""
    echo -e "\033[33mast-grep is not installed.\033[0m"
    echo -e "\033[33mast-grep enables AST-based code analysis for security and quality checks.\033[0m"
    echo ""
    read -p "Install ast-grep now? (Y/n) " response
    if [[ "$response" == "" || "$response" == "Y" || "$response" == "y" ]]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS - use brew
            if command -v brew &> /dev/null; then
                echo -e "\033[36mInstalling ast-grep via brew...\033[0m"
                brew install ast-grep
                echo -e "\033[32m[OK] ast-grep installed successfully\033[0m"
                AST_GREP_INSTALLED=true
            else
                echo -e "\033[33m[!] Homebrew not found. Install manually: brew install ast-grep\033[0m"
            fi
        else
            # Linux - use cargo or npm
            if command -v cargo &> /dev/null; then
                echo -e "\033[36mInstalling ast-grep via cargo...\033[0m"
                cargo install ast-grep --locked
                echo -e "\033[32m[OK] ast-grep installed successfully\033[0m"
                AST_GREP_INSTALLED=true
            elif command -v npm &> /dev/null; then
                echo -e "\033[36mInstalling ast-grep via npm...\033[0m"
                npm install -g @ast-grep/cli
                echo -e "\033[32m[OK] ast-grep installed successfully\033[0m"
                AST_GREP_INSTALLED=true
            else
                echo -e "\033[33m[!] cargo/npm not found. Install manually: cargo install ast-grep\033[0m"
            fi
        fi
    else
        echo -e "\033[33mSkipped ast-grep installation\033[0m"
    fi
fi

# Install uv (for ast-grep MCP server) if not present
if command -v uv &> /dev/null; then
    echo -e "\033[32m[OK] uv already installed\033[0m"
else
    if [ "$AST_GREP_INSTALLED" = true ]; then
        echo ""
        read -p "Install uv (required for ast-grep MCP server)? (Y/n) " response
        if [[ "$response" == "" || "$response" == "Y" || "$response" == "y" ]]; then
            echo -e "\033[36mInstalling uv via pip...\033[0m"
            pip install uv --quiet 2>/dev/null || pip3 install uv --quiet
            echo -e "\033[32m[OK] uv installed successfully\033[0m"
        fi
    fi
fi

echo ""
echo -e "\033[32m===============================================================\033[0m"
echo -e "\033[32m  Installation Complete!\033[0m"
echo -e "\033[32m===============================================================\033[0m"
echo ""
echo -e "\033[36mInstalled Components:\033[0m"
echo "  * 9 Agents: odin, huginn, mimir, heimdall, forseti, freya, tyr, baldur, loki"
echo "  * 9 Skills: sisyphus, ultrawork, deepsearch, ralph-loop, plan, review, orchestrator, analyze, ast-grep"
echo "  * Self-Verification Pipeline (code->heimdall, plan->loki)"
echo ""
echo -e "\033[36mConfiguration: $CLAUDE_DIR\033[0m"
echo ""
echo -e "\033[33mOptional MCP Servers:\033[0m"
echo "  claude mcp add context7 -- npx -y @upstash/context7-mcp@latest"
echo "  claude mcp add github -- npx -y @modelcontextprotocol/server-github"
echo ""
