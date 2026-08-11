# git-autosave.ps1
# Auto-guardado en Git + Push a GitHub
# Netlify redesplega automaticamente desde GitHub

$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectDir

Write-Host "Verificando cambios para auto-guardado..." -ForegroundColor Cyan

$status = git status --porcelain
if ($status) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

    # 1. Commit
    git add -A
    git commit -m "INFOGENERALSOFTWARE - $timestamp"
    Write-Host "Commit creado: INFOGENERALSOFTWARE - $timestamp" -ForegroundColor Green

    # 2. Push a GitHub (Netlify redeploya automaticamente)
    Write-Host "Subiendo a GitHub..." -ForegroundColor Cyan
    git push origin master
    Write-Host "Guardado exitoso en GitHub! Netlify redesplega automaticamente." -ForegroundColor Green
} else {
    Write-Host "Sin cambios pendientes. Todo esta actualizado." -ForegroundColor Yellow
}
