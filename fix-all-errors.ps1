#!/usr/bin/env pwsh
# Comprehensive TypeScript Build Error Fix Script

Write-Host "Fixing all 16 TypeScript build errors..." -ForegroundColor Cyan

# 1. Fix ProductsView.tsx - Remove unused 'type' parameter (line 49 refers to function parameter)
# The error is in a nested function - need to find and fix it
(Get-Content "src/components/merchant/ProductsView.tsx") -replace 'function\s+\w+\(\{[^}]*,\s*type[^}]*\}\)', {
    $_.Value -replace ',\s*type', ''
} | Set-Content "src/components/merchant/ProductsView.tsx"

# 2. Fix ReportsView.tsx - Remove BarChart3 and Package
$content = Get-Content "src/components/merchant/ReportsView.tsx" -Raw
$content = $content -replace 'BarChart3,\s*', ''
$content = $content -replace ',\s*Package', ''
$content | Set-Content "src/components/merchant/ReportsView.tsx"

# 3. Fix CartContext.tsx - Already fixed (no React import)

# 4. Fix MockDatabaseContext.tsx - Already fixed (no React import, products is const)

# 5. Fix MerchantDashboard.tsx - Change .name to .businessName
(Get-Content "src/pages/MerchantDashboard.tsx") -replace '\.name\b', '.businessName' | Set-Content "src/pages/MerchantDashboard.tsx"

# 6. Fix MerchantOnboarding.tsx - Remove Building2, Upload, Product imports
$content = Get-Content "src/pages/MerchantOnboarding.tsx" -Raw
$content = $content -replace 'Building2,\s*', ''
$content = $content -replace ',\s*Upload', ''
$content = $content -replace 'import\s+\{\s*Product\s*\}\s+from\s+[^;]+;[\r\n]+', ''
$content | Set-Content "src/pages/MerchantOnboarding.tsx"

# 7. Fix StoreFront.tsx - Remove MapPin and isProfileOpen
$content = Get-Content "src/pages/customer/StoreFront.tsx" -Raw
$content = $content -replace 'MapPin,\s*', ''
$content = $content -replace 'const\s+\[,\s*setIsProfileOpen\]\s*=\s*useState\(false\);[\r\n]+', ''
$content = $content -replace 'setIsProfileOpen\(true\)', '() => {}'
$content | Set-Content "src/pages/customer/StoreFront.tsx"

# 8. Fix SupermarketStore.tsx - Remove userLocation and size parameter
$content = Get-Content "src/pages/customer/store-types/SupermarketStore.tsx" -Raw
$content = $content -replace 'const\s+userLocation\s*=\s*[^;]+;[\r\n]+', ''
$content = $content -replace ',\s*size\?\s*:\s*string', ''
$content | Set-Content "src/pages/customer/store-types/SupermarketStore.tsx"

Write-Host "All fixes applied!" -ForegroundColor Green
