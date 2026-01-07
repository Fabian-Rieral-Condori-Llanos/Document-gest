Fix tests · SH
Copiar

#!/bin/bash

# 🔧 Script de Corrección Automática de Tests
# Fase 3: Actualizar tests para usar "data" en lugar de "datas"

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo "${BLUE}╔═══════════════════════════════════════════════════╗${NC}"
echo "${BLUE}║   🧪 Fase 3: Corrección Automática de Tests      ║${NC}"
echo "${BLUE}╚═══════════════════════════════════════════════════╝${NC}"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -d "tests" ]; then
    echo "${RED}❌ Error: Directorio tests/ no encontrado${NC}"
    echo "Ejecuta este script desde backend/"
    exit 1
fi

# Paso 1: Crear backup
echo "${BLUE}📦 Paso 1: Creando backup de tests...${NC}"
BACKUP_DIR="tests_backup_$(date +%Y%m%d_%H%M%S)"
cp -r tests/ "$BACKUP_DIR"
echo "${GREEN}✅ Backup creado en: $BACKUP_DIR${NC}"
echo ""

# Paso 2: Contar cambios necesarios
echo "${BLUE}📊 Paso 2: Analizando archivos...${NC}"
TOTAL_DATAS=$(grep -r "\.datas" tests/ 2>/dev/null | wc -l)
echo "${YELLOW}⚠️  Se encontraron $TOTAL_DATAS referencias a 'datas' en tests${NC}"
echo ""

# Mostrar archivos que serán modificados
echo "${BLUE}📝 Archivos que serán modificados:${NC}"
grep -l "\.datas" tests/*.test.js 2>/dev/null | while read file; do
    count=$(grep -c "\.datas" "$file")
    echo "   - $(basename $file): $count cambios"
done
echo ""

# Confirmar con usuario
read -p "¿Continuar con los cambios? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "${YELLOW}⚠️  Operación cancelada${NC}"
    exit 0
fi

# Paso 3: Aplicar correcciones
echo ""
echo "${BLUE}🔧 Paso 3: Aplicando correcciones...${NC}"

# Fix 1: .body.datas -> .body.data
echo "   Corrigiendo .body.datas..."
find tests/ -name "*.test.js" -type f -exec sed -i 's/\.body\.datas/.body.data/g' {} \;

# Fix 2: expect(response.body.datas) -> expect(response.body.data)
echo "   Corrigiendo expects..."
find tests/ -name "*.test.js" -type f -exec sed -i 's/expect(response\.body\.datas)/expect(response.body.data)/g' {} \;

# Fix 3: const { datas } -> const { data }
echo "   Corrigiendo destructuring const..."
find tests/ -name "*.test.js" -type f -exec sed -i 's/const { datas }/const { data }/g' {} \;

# Fix 4: var { datas } -> var { data }
echo "   Corrigiendo destructuring var..."
find tests/ -name "*.test.js" -type f -exec sed -i 's/var { datas }/var { data }/g' {} \;

# Fix 5: response.datas -> response.data (sin .body)
echo "   Corrigiendo response.datas directo..."
find tests/ -name "*.test.js" -type f -exec sed -i 's/response\.datas/response.data/g' {} \;

# Fix 6: .json().datas -> .json().data
echo "   Corrigiendo .json().datas..."
find tests/ -name "*.test.js" -type f -exec sed -i 's/\.json()\.datas/.json().data/g' {} \;

echo "${GREEN}✅ Correcciones aplicadas${NC}"
echo ""

# Paso 4: Verificar cambios
echo "${BLUE}📊 Paso 4: Verificando cambios...${NC}"
REMAINING_DATAS=$(grep -r "\.datas" tests/ 2>/dev/null | wc -l)
FIXED=$(($TOTAL_DATAS - $REMAINING_DATAS))

echo "${GREEN}✅ Referencias corregidas: $FIXED${NC}"
if [ $REMAINING_DATAS -gt 0 ]; then
    echo "${YELLOW}⚠️  Referencias restantes: $REMAINING_DATAS${NC}"
    echo ""
    echo "${YELLOW}Archivos con referencias restantes:${NC}"
    grep -n "\.datas" tests/*.test.js 2>/dev/null | head -10
else
    echo "${GREEN}✅ Todas las referencias corregidas!${NC}"
fi
echo ""

# Paso 5: Mostrar diff de un archivo como ejemplo
echo "${BLUE}📝 Paso 5: Ejemplo de cambios (user.test.js):${NC}"
if [ -f "$BACKUP_DIR/user.test.js" ] && [ -f "tests/user.test.js" ]; then
    echo "${BLUE}Primeras 5 diferencias:${NC}"
    diff -u "$BACKUP_DIR/user.test.js" "tests/user.test.js" | grep "^[-+]" | grep -v "^---\|^+++" | head -10
fi
echo ""

# Paso 6: Próximos pasos
echo "${BLUE}╔═══════════════════════════════════════════════════╗${NC}"
echo "${BLUE}║               ✅ CORRECCIONES COMPLETADAS          ║${NC}"
echo "${BLUE}╚═══════════════════════════════════════════════════╝${NC}"
echo ""
echo "${GREEN}📋 PRÓXIMOS PASOS:${NC}"
echo ""
echo "1. Verificar que app.js exporta correctamente:"
echo "   ${BLUE}# Verificar última línea de src/app.js${NC}"
echo "   ${BLUE}module.exports = application.app; ${NC}"
echo ""
echo "2. Ejecutar tests individuales primero:"
echo "   ${BLUE}npm test -- tests/user.test.js${NC}"
echo ""
echo "3. Si pasa, ejecutar todos:"
echo "   ${BLUE}npm test${NC}"
echo ""
echo "4. Si algo falla, restaurar backup:"
echo "   ${BLUE}rm -rf tests/${NC}"
echo "   ${BLUE}cp -r $BACKUP_DIR tests/${NC}"
echo ""
echo "${YELLOW}📦 Backup disponible en: $BACKUP_DIR${NC}"
echo ""

# Resumen estadístico
echo "${BLUE}📊 RESUMEN:${NC}"
echo "   Total de tests: $(find tests/ -name "*.test.js" | wc -l) archivos"
echo "   Referencias corregidas: $FIXED"
echo "   Referencias restantes: $REMAINING_DATAS"
echo ""