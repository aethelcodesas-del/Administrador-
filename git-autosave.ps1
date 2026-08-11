# git-autosave.ps1
# Script de Auto-Guardado en Git con nombre INFOGENERALSOFTWARE + Push automatico a GitHub

$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectDir

Write-Host "Verificando cambios para auto-guardado..." -ForegroundColor Cyan

$status = git status --porcelain
if ($status) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    git add -A
    git commit -m "INFOGENERALSOFTWARE - $timestamp"
    Write-Host "Commit creado: INFOGENERALSOFTWARE - $timestamp" -ForegroundColor Green

    Write-Host "Subiendo a GitHub (INFGENERAL-SOFTWARE)..." -ForegroundColor Cyan
    git push origin master
    Write-Host "Guardado exitoso en GitHub!" -ForegroundColor Green
} else {
    Write-Host "Sin cambios pendientes. Todo esta actualizado." -ForegroundColor Yellow
}
