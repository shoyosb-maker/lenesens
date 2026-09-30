#!/bin/bash

# ============================================================
# BUILD — Minifica CSS y JS
# Lenesens Hydralight
# ============================================================

set -e

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🚀 Iniciando build de Lenesens Hydralight...${NC}\n"

# ------------------------------------------------------------
# 1. Verificar dependencias
# ------------------------------------------------------------
if ! command -v npx &> /dev/null; then
  echo -e "${RED}❌ npx no está instalado. Instala Node.js primero.${NC}"
  exit 1
fi

# ------------------------------------------------------------
# 2. Instalar herramientas (si no están)
# ------------------------------------------------------------
if ! npx --no-install csso-cli --version &> /dev/null; then
  echo -e "${YELLOW}📦 Instalando csso-cli y terser...${NC}"
  npm install -g csso-cli terser
fi

# ------------------------------------------------------------
# 3. Crear carpeta dist
# ------------------------------------------------------------
mkdir -p dist
mkdir -p dist/css/components
mkdir -p dist/css/pages
mkdir -p dist/js

# ------------------------------------------------------------
# 4. Minificar CSS
# ------------------------------------------------------------
echo -e "${YELLOW}🎨 Minificando CSS...${NC}"

for file in css/*.css css/components/*.css css/pages/*.css; do
  if [ -f "$file" ]; then
    output="dist/$file"
    csso "$file" --output "$output"
    original_size=$(wc -c < "$file")
    minified_size=$(wc -c < "$output")
    saved=$((original_size - minified_size))
    percent=$((saved * 100 / original_size))
    echo "  ✅ $file → ${percent}% más pequeño (${saved} bytes ahorrados)"
  fi
done

# ------------------------------------------------------------
# 5. Minificar JS
# ------------------------------------------------------------
echo -e "\n${YELLOW}⚡ Minificando JS...${NC}"

for file in js/*.js; do
  if [ -f "$file" ]; then
    output="dist/$file"
    terser "$file" \
      --compress \
      --mangle \
      --output "$output"
    original_size=$(wc -c < "$file")
    minified_size=$(wc -c < "$output")
    saved=$((original_size - minified_size))
    percent=$((saved * 100 / original_size))
    echo "  ✅ $file → ${percent}% más pequeño (${saved} bytes ahorrados)"
  fi
done

# ------------------------------------------------------------
# 6. Copiar HTML (no se minifica pero se versiona)
# ------------------------------------------------------------
echo -e "\n${YELLOW}📄 Copiando HTML...${NC}"

for file in *.html; do
  if [ -f "$file" ]; then
    cp "$file" "dist/$file"
    echo "  ✅ $file"
  fi
done

# ------------------------------------------------------------
# 7. Copiar assets
# ------------------------------------------------------------
echo -e "\n${YELLOW}📦 Copiando assets...${NC}"
cp -r assets dist/

# ------------------------------------------------------------
# 8. Reporte final
# ------------------------------------------------------------
echo -e "\n${GREEN}🎉 Build completo!${NC}\n"
echo -e "Carpeta: ${GREEN}dist/${NC}"
echo -e "Para servir localmente:"
echo -e "  ${YELLOW}cd dist && python3 -m http.server 8000${NC}\n"

# Tamaños finales
echo -e "📊 Tamaño total:"
du -sh dist/
echo -e "\n📊 Desglose:"
du -sh dist/css dist/js dist/assets 2>/dev/null