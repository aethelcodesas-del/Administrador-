# git-autosave.ps1
# Auto-guardado en Git + Push a GitHub + Deploy a Netlify

$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectDir

$NETLIFY_SITE_ID = "693b8fe0-c6a2-494e-8b00-41696ca2520e"

Write-Host "Verificando cambios para auto-guardado..." -ForegroundColor Cyan

$status = git status --porcelain
if ($status) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

    # 1. Commit a Git
    git add -A
    git commit -m "INFOGENERALSOFTWARE - $timestamp"
    Write-Host "Commit creado: INFOGENERALSOFTWARE - $timestamp" -ForegroundColor Green

    # 2. Push a GitHub
    Write-Host "Subiendo a GitHub..." -ForegroundColor Cyan
    git push origin master
    Write-Host "GitHub actualizado!" -ForegroundColor Green

    # 3. Build y deploy a Netlify
    Write-Host "Construyendo proyecto..." -ForegroundColor Cyan
    npm.cmd run build
    Write-Host "Desplegando a Netlify..." -ForegroundColor Cyan
    npx.cmd netlify-cli deploy --prod --dir=dist --site=$NETLIFY_SITE_ID --allow-anonymous --message="INFOGENERALSOFTWARE - $timestamp"
    Write-Host "Deploy completado en Netlify!" -ForegroundColor Green
} else {
    Write-Host "Sin cambios pendientes. Todo esta actualizado." -ForegroundColor Yellow
}
