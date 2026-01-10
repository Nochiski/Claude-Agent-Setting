#!/bin/bash
# Claude Code Agents - Unix 설치 스크립트
# 실행: bash install.sh

set -e

CLAUDE_DIR="$HOME/.claude"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "\033[36mClaude Code Agents 설치 시작...\033[0m"

# .claude 디렉토리 생성
if [ ! -d "$CLAUDE_DIR" ]; then
    mkdir -p "$CLAUDE_DIR"
    echo -e "\033[32mCreated: $CLAUDE_DIR\033[0m"
fi

# settings.json 백업 및 병합
SETTINGS_FILE="$CLAUDE_DIR/settings.json"
if [ -f "$SETTINGS_FILE" ]; then
    BACKUP_FILE="$CLAUDE_DIR/settings.backup.$(date +%Y%m%d_%H%M%S).json"
    cp "$SETTINGS_FILE" "$BACKUP_FILE"
    echo -e "\033[33mBackup created: $BACKUP_FILE\033[0m"
fi

# 새 설정 복사 및 경로 변환
SOURCE_SETTINGS="$SCRIPT_DIR/.claude/settings.local.json"
if [ -f "$SOURCE_SETTINGS" ]; then
    cp "$SOURCE_SETTINGS" "$SETTINGS_FILE"

    # Windows 경로를 Unix 경로로 변환
    # %USERPROFILE%\\.claude\\ -> $HOME/.claude/
    sed -i '' 's|%USERPROFILE%\\\\.claude\\\\|$HOME/.claude/|g' "$SETTINGS_FILE"
    # 남은 백슬래시를 슬래시로 변환
    sed -i '' 's|\\\\|/|g' "$SETTINGS_FILE"
    # cmd /c 를 직접 실행으로 변환 (figma MCP)
    sed -i '' 's|"command": "cmd",|"command": "npx",|g' "$SETTINGS_FILE"
    sed -i '' 's|"/c", "npx", "-y",|"-y",|g' "$SETTINGS_FILE"

    echo -e "\033[32mSettings copied to: $SETTINGS_FILE (paths converted for Unix)\033[0m"
fi

# hooks 디렉토리 복사
HOOKS_DIR="$CLAUDE_DIR/hooks"
mkdir -p "$HOOKS_DIR"
if [ -d "$SCRIPT_DIR/hooks" ]; then
    cp -r "$SCRIPT_DIR/hooks/"* "$HOOKS_DIR/" 2>/dev/null || true
    echo -e "\033[32mHooks copied to: $HOOKS_DIR\033[0m"
fi

# skills 디렉토리 복사
SKILLS_DIR="$CLAUDE_DIR/skills"
mkdir -p "$SKILLS_DIR"
if [ -d "$SCRIPT_DIR/skills" ] && [ "$(ls -A $SCRIPT_DIR/skills 2>/dev/null)" ]; then
    cp -r "$SCRIPT_DIR/skills/"* "$SKILLS_DIR/"
    echo -e "\033[32mSkills copied to: $SKILLS_DIR\033[0m"
fi

# agents 디렉토리 복사 (서브에이전트)
AGENTS_DIR="$CLAUDE_DIR/agents"
mkdir -p "$AGENTS_DIR"
if [ -d "$SCRIPT_DIR/.claude/agents" ] && [ "$(ls -A $SCRIPT_DIR/.claude/agents 2>/dev/null)" ]; then
    cp -r "$SCRIPT_DIR/.claude/agents/"* "$AGENTS_DIR/"
    echo -e "\033[32mAgents copied to: $AGENTS_DIR\033[0m"
fi

# CLAUDE.md 복사 (에이전트 오케스트레이션 규칙)
CLAUDE_MD="$SCRIPT_DIR/.claude/CLAUDE.md"
if [ -f "$CLAUDE_MD" ]; then
    cp "$CLAUDE_MD" "$CLAUDE_DIR/CLAUDE.md"
    echo -e "\033[32mCLAUDE.md copied to: $CLAUDE_DIR/CLAUDE.md\033[0m"
fi

# MCP 설정 복사
MCP_SOURCE="$SCRIPT_DIR/mcp/mcp.json"
if [ -f "$MCP_SOURCE" ]; then
    cp "$MCP_SOURCE" "$CLAUDE_DIR/mcp.json"
    echo -e "\033[32mMCP config copied to: $CLAUDE_DIR/mcp.json\033[0m"
fi

echo ""
echo -e "\033[32m설치 완료!\033[0m"
echo ""
echo -e "\033[36m설정 위치: $CLAUDE_DIR\033[0m"
echo ""
echo -e "\033[33mMCP 서버 설치 (선택):\033[0m"
echo "  # Context7 (라이브러리 문서 조회)"
echo "  claude mcp add context7 -- npx -y @upstash/context7-mcp@latest"
echo ""
echo "  # Figma (디자인 데이터 조회 - 토큰 필요)"
echo "  export FIGMA_ACCESS_TOKEN=your-token"
echo "  claude mcp add figma -- npx -y @anthropic/mcp-figma"
echo ""
echo "  # GitHub (리포지토리, 이슈, PR 조회)"
echo "  # 방법 1: gh CLI OAuth 로그인 사용 (권장)"
echo "  gh auth login"
echo "  export GITHUB_PERSONAL_ACCESS_TOKEN=\$(gh auth token)"
echo ""
echo "  # 방법 2: PAT 직접 설정"
echo "  export GITHUB_PERSONAL_ACCESS_TOKEN=your-token"
echo ""
echo "  claude mcp add github -- npx -y @modelcontextprotocol/server-github"
echo ""
