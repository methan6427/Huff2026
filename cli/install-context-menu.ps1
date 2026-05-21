#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Adds "Compress with Huffman" to the Windows Explorer right-click menu for all files.
.NOTES
    Run once as Administrator.  To undo, run uninstall-context-menu.ps1.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ── Locate node.exe ──────────────────────────────────────────────────────────
$nodCmd  = Get-Command node -ErrorAction SilentlyContinue
$nodeExe = if ($nodCmd) { $nodCmd.Source } else { $null }
if (-not $nodeExe) {
    Write-Host "ERROR: node.exe not found in PATH. Install Node.js and try again." -ForegroundColor Red
    exit 1
}
Write-Host "Found node: $nodeExe"

# ── Absolute path to the companion script ────────────────────────────────────
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$mjs       = Join-Path $scriptDir 'huff-compress-windows.mjs'
if (-not (Test-Path $mjs)) {
    Write-Host "ERROR: huff-compress-windows.mjs not found at:`n  $mjs" -ForegroundColor Red
    exit 1
}
Write-Host "Found script: $mjs"

# ── Build the command string ─────────────────────────────────────────────────
# Quotes around each path so spaces are handled; %1 is the file Explorer passes in.
$cmd = "`"$nodeExe`" `"$mjs`" `"%1`""
Write-Host "Command: $cmd"

# ── Write registry via .NET (handles embedded quotes reliably) ────────────────
$shellKey = [Microsoft.Win32.Registry]::ClassesRoot.CreateSubKey('*\shell\HuffmanCompress')
$shellKey.SetValue('', 'Compress with Huffman')
$shellKey.SetValue('Icon', 'shell32.dll,46')
$shellKey.Close()

$cmdKey = [Microsoft.Win32.Registry]::ClassesRoot.CreateSubKey('*\shell\HuffmanCompress\command')
$cmdKey.SetValue('', $cmd)
$cmdKey.Close()

Write-Host ""
Write-Host "Done! Right-click any file in Explorer and choose 'Compress with Huffman'." -ForegroundColor Green
Write-Host "To remove: run uninstall-context-menu.ps1 as Administrator."
