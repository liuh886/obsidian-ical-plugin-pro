# iCal Pro CLI: Trigger immediate sync from shell
# Usage: .\sync.ps1 -Vault "YourVaultName"

param (
    [string]$Vault = "zhihaol"
)

$pluginId = "obsidian-ical-plugin-pro"
$commandId = "save-calendar"

$uri = "obsidian://advanced-uri?vault=$Vault&commandid=$pluginId`:$commandId"

Write-Host "Triggering iCal Pro Sync in Obsidian (Vault: $Vault)..." -ForegroundColor Cyan
Start-Process $uri

Write-Host "Sync command sent. Check Obsidian for notifications." -ForegroundColor Green
