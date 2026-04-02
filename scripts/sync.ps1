# iCal Pro CLI: Trigger immediate sync from shell
# Requirements: Obsidian must be open.

$vaultName = "zhihaol"
$pluginId = "obsidian-ical-plugin-pro"
$commandId = "save-calendar"

$uri = "obsidian://advanced-uri?vault=$vaultName&commandid=$pluginId`:$commandId"

Write-Host "Triggering iCal Pro Sync in Obsidian..." -ForegroundColor Cyan
Start-Process $uri

Write-Host "Sync command sent. Check Obsidian for notifications." -ForegroundColor Green
