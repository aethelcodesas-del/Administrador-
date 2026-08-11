# git-autosave.ps1
# Script de Auto-Guardado en Git con nombre INFOGENERALSOFTWARE

$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectDir

Write-Host "Verificando cambios para auto-guardado..." -ForegroundColor Cyan

$status = git status --porcelain
if ($status) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    git add -A
    git commit -m "INFOGENERALSOFTWARE - $timestamp"
    Write-Host "Guardado exitoso: INFOGENERALSOFTWARE - $timestamp" -ForegroundColor Green
} else {
    Write-Host "Sin cambios pendientes. Todo esta actualizado." -ForegroundColor Yellow
}
