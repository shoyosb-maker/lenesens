# ============================================================
# BUILD — Minifica CSS y JS (Windows)
# Lenesens Hydralight
# ============================================================

Write-Host "🚀 Iniciando build de Lenesens Hydralight..." -ForegroundColor Yellow

# Verificar Node.js
if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
  Write-Host "❌ npx no está instalado. Instala Node.js primero." -ForegroundColor Red
  exit 1
}

# Crear estructura dist
New-Item -ItemType Directory -Force -Path "dist/css/components" | Out-Null
New-Item -ItemType Directory -Force -Path "dist/css/pages" | Out-Null
New-Item -ItemType Directory -Force -Path "dist/js" | Out-Null

# Minificar CSS
Write-Host "`n🎨 Minificando CSS..." -ForegroundColor Yellow

$cssFiles = @()
$cssFiles += Get-ChildItem -Path "css" -Filter "*.css" -File
$cssFiles += Get-ChildItem -Path "css/components" -Filter "*.css" -File
$cssFiles += Get-ChildItem -Path "css/pages" -Filter "*.css" -File

foreach ($file in $cssFiles) {
  $output = "dist/$($file.FullName.Replace((Get-Location).Path + '\', '').Replace('\', '/'))"
  $outputDir = Split-Path $output -Parent
  New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

  npx csso "$($file.FullName)" --output "$output"
  Write-Host "  ✅ $($file.Name)" -ForegroundColor Green
}

# Minificar JS
Write-Host "`n⚡ Minificando JS..." -ForegroundColor Yellow

Get-ChildItem -Path "js" -Filter "*.js" -File | ForEach-Object {
  $output = "dist/js/$($_.Name)"
  npx terser "$($_.FullName)" --compress --mangle --output "$output"
  Write-Host "  ✅ $($_.Name)" -ForegroundColor Green
}

# Copiar HTML
Write-Host "`n📄 Copiando HTML..." -ForegroundColor Yellow
Get-ChildItem -Path "." -Filter "*.html" -File | ForEach-Object {
  Copy-Item $_.FullName "dist/$($_.Name)"
  Write-Host "  ✅ $($_.Name)" -ForegroundColor Green
}

# Copiar assets
Write-Host "`n📦 Copiando assets..." -ForegroundColor Yellow
Copy-Item -Recurse -Force "assets" "dist/"
Write-Host "  ✅ assets/" -ForegroundColor Green

# Reporte final
Write-Host "`n🎉 Build completo!" -ForegroundColor Green
Write-Host "Carpeta: dist/`n"

$size = (Get-ChildItem -Recurse dist | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host ("📊 Tamaño total: {0:N2} MB" -f $size) -ForegroundColor Yellow