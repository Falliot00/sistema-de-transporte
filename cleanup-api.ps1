# Script para limpiar getAuthHeaders() del archivo api.ts
$filePath = "c:\Users\FerminA\Desktop\Proyectos\sistema-de-transporte\frontend\lib\api.ts"
$content = Get-Content $filePath -Raw

# Reemplazar varios patrones de headers con getAuthHeaders()
$content = $content -replace ',\s*\{\s*headers:\s*getAuthHeaders\(\),?\s*\}', ''
$content = $content -replace '\{\s*headers:\s*getAuthHeaders\(\),?\s*\}', ''
$content = $content -replace ',\s*headers:\s*getAuthHeaders\(\)', ''
$content = $content -replace 'headers:\s*getAuthHeaders\(\),?', ''

# Limpiar comas dobles que puedan haber quedado
$content = $content -replace ',\s*,', ','

Set-Content $filePath $content
Write-Host "Archivo limpiado exitosamente"
