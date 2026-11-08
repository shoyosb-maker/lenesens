# ============================================================
# Genera la imagen de la card de WhatsApp / redes (Open Graph)
# Lenesens Hydralight
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File scripts\make-og.ps1 -Source "C:\ruta\imagen.png"
#   powershell -ExecutionPolicy Bypass -File scripts\make-og.ps1 -Buscar   (toma la imagen más nueva de Descargas)
#
# Salida: assets/img/brand/og-whatsapp.jpg · 1200x630 · JPEG < 300 KB
# (WhatsApp recomienda 1200x630, relación 1.91:1 y menos de 300 KB)
# ============================================================

param(
  [string]$Source,
  [switch]$Buscar,
  [string]$Out = "assets/img/brand/og-whatsapp.jpg",
  [int]$Quality = 3
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

if ($Buscar -or -not $Source) {
  $candidates = @()
  foreach ($dir in @("$env:USERPROFILE\Downloads", "$env:USERPROFILE\Desktop", "$env:USERPROFILE\Pictures")) {
    if (Test-Path $dir) {
      $candidates += Get-ChildItem -Path $dir -Include *.png, *.jpg, *.jpeg, *.webp -File -Recurse -Depth 2 -ErrorAction SilentlyContinue
    }
  }
  $newest = $candidates | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if (-not $newest) { throw "No encontré imágenes recientes. Pasa la ruta con -Source." }
  $Source = $newest.FullName
  Write-Host "Usando la imagen más reciente: $Source"
}

if (-not (Test-Path $Source)) { throw "No existe el archivo: $Source" }

$outPath = Join-Path $root $Out
$outDir = Split-Path -Parent $outPath
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

# Recorte centrado a 1200x630 (rellena el ancho completo sin deformar).
$filter = "scale=1200:630:force_original_aspect_ratio=increase:flags=lanczos,crop=1200:630,format=yuvj420p"
& ffmpeg -hide_banner -loglevel error -y -i $Source -vf $filter -frames:v 1 -q:v $Quality $outPath

$info = Get-Item $outPath
$kb = [math]::Round($info.Length / 1KB, 0)

# Si supera el límite de WhatsApp (300 KB) se recomprime más fuerte.
if ($kb -gt 290) {
  & ffmpeg -hide_banner -loglevel error -y -i $Source -vf $filter -frames:v 1 -q:v 6 $outPath
  $kb = [math]::Round((Get-Item $outPath).Length / 1KB, 0)
}

Write-Host ("Listo: {0} · {1} KB" -f $outPath, $kb)
if ($kb -le 300) { Write-Host "Peso correcto para WhatsApp (< 300 KB)." } else { Write-Host "Aviso: sigue por encima de 300 KB." }
