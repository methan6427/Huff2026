#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Removes "Compress with Huffman" from the Windows Explorer right-click menu.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$shellKey = 'HKCR:\*\shell\HuffmanCompress'

if (Test-Path $shellKey) {
    Remove-Item -Path $shellKey -Recurse -Force
    Write-Host "Removed 'Compress with Huffman' from Explorer context menu." -ForegroundColor Green
} else {
    Write-Host "Context menu entry not found — nothing to remove." -ForegroundColor Yellow
}
