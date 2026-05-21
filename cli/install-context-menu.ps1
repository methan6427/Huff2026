#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Adds "Compress with Huffman" to the Windows Explorer right-click menu for all files.

.DESCRIPTION
    Writes two registry keys under HKEY_CLASSES_ROOT\*\shell\HuffmanCompress so that
    right-clicking any file in Explorer shows the option.
    .huff files are rejected at runtime by huff-compress-windows.mjs.

.NOTES
    Run once as Administrator.  To undo, run uninstall-context-menu.ps1.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ── Locate node.exe ──────────────────────────────────────────────────────────
$nodeExe = (Get-Command node -ErrorAction SilentlyContinue)?.Source
if (-not $nodeExe) {
    Write-Host "ERROR: node.exe not found in PATH. Install Node.js and try again." -ForegroundColor Red
    exit 1
}
Write-Host "Found node: $nodeExe"

# ── Absolute path to the companion script ────────────────────────────────────
$scriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Definition
$mjs        = Join-Path $scriptDir 'huff-compress-windows.mjs'
if (-not (Test-Path $mjs)) {
    Write-Host "ERROR: huff-compress-windows.mjs not found at:`n  $mjs" -ForegroundColor Red
    exit 1
}
Write-Host "Found script: $mjs"

# ── Registry paths ───────────────────────────────────────────────────────────
$shellKey   = 'HKCR:\*\shell\HuffmanCompress'
$commandKey = "$shellKey\command"

# ── Build the command string ─────────────────────────────────────────────────
# Explorer passes the file path as %1 (already quoted by the shell).
# We add our own quotes around the script path to handle spaces in paths.
$cmd = "`"$nodeExe`" `"$mjs`" `"%1`""

# ── Write registry entries ───────────────────────────────────────────────────
if (-not (Test-Path $shellKey)) {
    New-Item -Path $shellKey -Force | Out-Null
}
Set-ItemProperty -Path $shellKey -Name '(Default)' -Value 'Compress with Huffman'
Set-ItemProperty -Path $shellKey -Name 'Icon'      -Value 'shell32.dll,46'

if (-not (Test-Path $commandKey)) {
    New-Item -Path $commandKey -Force | Out-Null
}
Set-ItemProperty -Path $commandKey -Name '(Default)' -Value $cmd

Write-Host ""
Write-Host "Done! Right-click any file in Explorer and choose 'Compress with Huffman'." -ForegroundColor Green
Write-Host "To remove: run uninstall-context-menu.ps1 as Administrator."
