# Claude Code Agents - Windows 설치 스크립트
# PowerShell에서 실행: .\install.ps1

$ErrorActionPreference = "Stop"

$CLAUDE_DIR = "$env:USERPROFILE\.claude"
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Claude Code Agents 설치 시작..." -ForegroundColor Cyan

# .claude 디렉토리 생성
if (!(Test-Path $CLAUDE_DIR)) {
    New-Item -ItemType Directory -Path $CLAUDE_DIR -Force | Out-Null
    Write-Host "Created: $CLAUDE_DIR" -ForegroundColor Green
}

# settings.json 백업 및 병합
$SETTINGS_FILE = "$CLAUDE_DIR\settings.json"
if (Test-Path $SETTINGS_FILE) {
    $BACKUP_FILE = "$CLAUDE_DIR\settings.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss').json"
    Copy-Item $SETTINGS_FILE $BACKUP_FILE
    Write-Host "Backup created: $BACKUP_FILE" -ForegroundColor Yellow
}

# 새 설정 복사 및 경로 치환
$SOURCE_SETTINGS = "$SCRIPT_DIR\.claude\settings.local.json"
if (Test-Path $SOURCE_SETTINGS) {
    Copy-Item $SOURCE_SETTINGS $SETTINGS_FILE -Force

    # Unix 스타일 경로를 Windows 경로로 치환 (혹시 남아있을 경우)
    $settingsContent = Get-Content $SETTINGS_FILE -Raw
    $windowsPath = $env:USERPROFILE -replace '\\', '\\\\'
    $settingsContent = $settingsContent -replace '~/\.claude/', "$windowsPath\\.claude\\"
    $settingsContent = $settingsContent -replace '~/', "$windowsPath\\"
    # UTF8 without BOM
    [System.IO.File]::WriteAllText($SETTINGS_FILE, $settingsContent)

    Write-Host "Settings copied to: $SETTINGS_FILE" -ForegroundColor Green
}

# hooks 디렉토리 복사
$HOOKS_DIR = "$CLAUDE_DIR\hooks"
if (!(Test-Path $HOOKS_DIR)) {
    New-Item -ItemType Directory -Path $HOOKS_DIR -Force | Out-Null
}
if (Test-Path "$SCRIPT_DIR\hooks\*.js") {
    Copy-Item "$SCRIPT_DIR\hooks\*.js" $HOOKS_DIR -Force
    $hookCount = (Get-ChildItem "$HOOKS_DIR\*.js").Count
    Write-Host "Hooks copied to: $HOOKS_DIR ($hookCount files)" -ForegroundColor Green
}

# skills 디렉토리 복사
$SKILLS_DIR = "$CLAUDE_DIR\skills"
if (!(Test-Path $SKILLS_DIR)) {
    New-Item -ItemType Directory -Path $SKILLS_DIR -Force | Out-Null
}
if (Test-Path "$SCRIPT_DIR\skills\*") {
    Copy-Item "$SCRIPT_DIR\skills\*" $SKILLS_DIR -Recurse -Force
    Write-Host "Skills copied to: $SKILLS_DIR" -ForegroundColor Green
}

# agents 디렉토리 복사 (서브에이전트)
$AGENTS_DIR = "$CLAUDE_DIR\agents"
if (!(Test-Path $AGENTS_DIR)) {
    New-Item -ItemType Directory -Path $AGENTS_DIR -Force | Out-Null
}
if (Test-Path "$SCRIPT_DIR\.claude\agents\*") {
    Copy-Item "$SCRIPT_DIR\.claude\agents\*" $AGENTS_DIR -Recurse -Force
    Write-Host "Agents copied to: $AGENTS_DIR" -ForegroundColor Green
}

# CLAUDE.md 복사 (에이전트 오케스트레이션 규칙)
$CLAUDE_MD = "$SCRIPT_DIR\.claude\CLAUDE.md"
if (Test-Path $CLAUDE_MD) {
    Copy-Item $CLAUDE_MD "$CLAUDE_DIR\CLAUDE.md" -Force
    Write-Host "CLAUDE.md copied to: $CLAUDE_DIR\CLAUDE.md" -ForegroundColor Green
}

# MCP 설정 복사
$MCP_SOURCE = "$SCRIPT_DIR\mcp\mcp.json"
if (Test-Path $MCP_SOURCE) {
    Copy-Item $MCP_SOURCE "$CLAUDE_DIR\mcp.json" -Force
    Write-Host "MCP config copied to: $CLAUDE_DIR\mcp.json" -ForegroundColor Green
}

Write-Host ""
Write-Host "설치 완료!" -ForegroundColor Green
Write-Host ""
Write-Host "설정 위치: $CLAUDE_DIR" -ForegroundColor Cyan
Write-Host ""
Write-Host "MCP 서버 설치 (선택):" -ForegroundColor Yellow
Write-Host "  # Context7 (라이브러리 문서 조회)"
Write-Host "  claude mcp add context7 -- npx -y @upstash/context7-mcp@latest"
Write-Host ""
Write-Host "  # Figma (디자인 데이터 조회 - 토큰 필요)"
Write-Host "  set FIGMA_ACCESS_TOKEN=your-token"
Write-Host "  claude mcp add figma -- npx -y @anthropic/mcp-figma"
Write-Host ""
Write-Host "  # GitHub (리포지토리, 이슈, PR 조회)"
Write-Host "  # 방법 1: gh CLI OAuth 로그인 사용 (권장)"
Write-Host "  gh auth login"
Write-Host "  `$env:GITHUB_PERSONAL_ACCESS_TOKEN = `$(gh auth token)"
Write-Host ""
Write-Host "  # 방법 2: PAT 직접 설정"
Write-Host "  set GITHUB_PERSONAL_ACCESS_TOKEN=your-token"
Write-Host ""
Write-Host "  claude mcp add github -- npx -y @modelcontextprotocol/server-github"
Write-Host ""
