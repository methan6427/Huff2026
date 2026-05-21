#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Removes "Compress with Huffman" from the Windows Explorer right-click menu.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$base = 'HKEY_CLASSES_ROOT\*\shell\HuffmanCompress'

reg delete "$base" /f 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Removed 'Compress with Huffman' from Explorer context menu." -ForegroundColor Green
} else {
    Write-Host "Context menu entry not found — nothing to remove." -ForegroundColor Yellow
}
