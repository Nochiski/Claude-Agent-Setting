# Claude Agent Setting - Windows Installation Script
# Run in PowerShell: .\install.ps1

$ErrorActionPreference = "Stop"

$CLAUDE_DIR = "$env:USERPROFILE\.claude"
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "       Claude Agent Setting - Installation                      " -ForegroundColor Cyan
Write-Host "       Self-Verification Pipeline + Specialized Agents          " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Create .claude directory
if (!(Test-Path $CLAUDE_DIR)) {
    New-Item -ItemType Directory -Path $CLAUDE_DIR -Force | Out-Null
    Write-Host "[OK] Created: $CLAUDE_DIR" -ForegroundColor Green
}

# Backup existing settings.json
$SETTINGS_FILE = "$CLAUDE_DIR\settings.json"
if (Test-Path $SETTINGS_FILE) {
    $BACKUP_FILE = "$CLAUDE_DIR\settings.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss').json"
    Copy-Item $SETTINGS_FILE $BACKUP_FILE
    Write-Host "[!] Backup created: $BACKUP_FILE" -ForegroundColor Yellow
}

# Copy settings
$SOURCE_SETTINGS = "$SCRIPT_DIR\.claude\settings.local.json"
if (Test-Path $SOURCE_SETTINGS) {
    Copy-Item $SOURCE_SETTINGS $SETTINGS_FILE -Force
    Write-Host "[OK] Settings installed: $SETTINGS_FILE" -ForegroundColor Green
}

# Copy hooks directory (with subdirectories)
$HOOKS_DIR = "$CLAUDE_DIR\hooks"
if (Test-Path "$SCRIPT_DIR\hooks") {
    if (Test-Path $HOOKS_DIR) {
        Remove-Item $HOOKS_DIR -Recurse -Force
    }
    Copy-Item "$SCRIPT_DIR\hooks" $HOOKS_DIR -Recurse -Force
    Write-Host "[OK] Hooks installed: $HOOKS_DIR" -ForegroundColor Green
}

# Copy skills directory
$SKILLS_DIR = "$CLAUDE_DIR\skills"
if (Test-Path "$SCRIPT_DIR\.claude\skills") {
    if (Test-Path $SKILLS_DIR) {
        Remove-Item $SKILLS_DIR -Recurse -Force
    }
    Copy-Item "$SCRIPT_DIR\.claude\skills" $SKILLS_DIR -Recurse -Force
    Write-Host "[OK] Skills installed: $SKILLS_DIR" -ForegroundColor Green
}

# Copy agents directory (Norse mythology agents)
$AGENTS_DIR = "$CLAUDE_DIR\agents"
if (Test-Path "$SCRIPT_DIR\.claude\agents") {
    if (Test-Path $AGENTS_DIR) {
        Remove-Item $AGENTS_DIR -Recurse -Force
    }
    Copy-Item "$SCRIPT_DIR\.claude\agents" $AGENTS_DIR -Recurse -Force
    Write-Host "[OK] Agents installed: $AGENTS_DIR" -ForegroundColor Green
}

# Copy CLAUDE.md (orchestration rules)
$CLAUDE_MD = "$SCRIPT_DIR\.claude\CLAUDE.md"
if (Test-Path $CLAUDE_MD) {
    Copy-Item $CLAUDE_MD "$CLAUDE_DIR\CLAUDE.md" -Force
    Write-Host "[OK] CLAUDE.md installed: $CLAUDE_DIR\CLAUDE.md" -ForegroundColor Green
}

# Copy MCP config
$MCP_SOURCE = "$SCRIPT_DIR\mcp\mcp.json"
if (Test-Path $MCP_SOURCE) {
    Copy-Item $MCP_SOURCE "$CLAUDE_DIR\mcp.json" -Force
    Write-Host "[OK] MCP config installed: $CLAUDE_DIR\mcp.json" -ForegroundColor Green
}

# Copy ast-grep rules
if (Test-Path "$SCRIPT_DIR\.claude\ast-grep") {
    $AST_GREP_DIR = "$CLAUDE_DIR\ast-grep"
    if (Test-Path $AST_GREP_DIR) {
        Remove-Item $AST_GREP_DIR -Recurse -Force
    }
    Copy-Item "$SCRIPT_DIR\.claude\ast-grep" $AST_GREP_DIR -Recurse -Force
    Write-Host "[OK] ast-grep rules installed: $AST_GREP_DIR" -ForegroundColor Green
}

# Install ast-grep if not present
$AST_GREP_INSTALLED = $false
try {
    $null = Get-Command ast-grep -ErrorAction Stop
    $AST_GREP_INSTALLED = $true
    Write-Host "[OK] ast-grep already installed" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "ast-grep is not installed." -ForegroundColor Yellow
    Write-Host "ast-grep enables AST-based code analysis for security and quality checks." -ForegroundColor Yellow
    Write-Host ""
    $response = Read-Host "Install ast-grep now? (Y/n)"
    if ($response -eq "" -or $response -eq "Y" -or $response -eq "y") {
        Write-Host "Installing ast-grep via winget..." -ForegroundColor Cyan
        try {
            winget install ast-grep.ast-grep --silent --accept-package-agreements --accept-source-agreements
            Write-Host "[OK] ast-grep installed successfully" -ForegroundColor Green
            $AST_GREP_INSTALLED = $true
        } catch {
            Write-Host "[!] Failed to install ast-grep. Install manually: winget install ast-grep.ast-grep" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Skipped ast-grep installation" -ForegroundColor Yellow
    }
}

# Install uv (for ast-grep MCP server) if not present
try {
    $null = Get-Command uv -ErrorAction Stop
    Write-Host "[OK] uv already installed" -ForegroundColor Green
} catch {
    if ($AST_GREP_INSTALLED) {
        Write-Host ""
        $response = Read-Host "Install uv (required for ast-grep MCP server)? (Y/n)"
        if ($response -eq "" -or $response -eq "Y" -or $response -eq "y") {
            Write-Host "Installing uv via pip..." -ForegroundColor Cyan
            try {
                pip install uv --quiet
                Write-Host "[OK] uv installed successfully" -ForegroundColor Green
            } catch {
                Write-Host "[!] Failed to install uv. Install manually: pip install uv" -ForegroundColor Yellow
            }
        }
    }
}

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Green
Write-Host "  Installation Complete!" -ForegroundColor Green
Write-Host "===============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Installed Components:" -ForegroundColor Cyan
Write-Host "  * 9 Agents: odin, huginn, mimir, heimdall, forseti, freya, tyr, baldur, loki"
Write-Host "  * 9 Skills: sisyphus, ultrawork, deepsearch, ralph-loop, plan, review, orchestrator, analyze, ast-grep"
Write-Host "  * Self-Verification Pipeline (code->heimdall, plan->loki)"
Write-Host ""
Write-Host "Configuration: $CLAUDE_DIR" -ForegroundColor Cyan
Write-Host ""
Write-Host "Optional MCP Servers:" -ForegroundColor Yellow
Write-Host "  claude mcp add context7 -- npx -y @upstash/context7-mcp@latest"
Write-Host "  claude mcp add github -- npx -y @modelcontextprotocol/server-github"
Write-Host ""
