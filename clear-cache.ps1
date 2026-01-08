# Clear Cache Script for Restaurant Reservation System

#  .\clear-cache.ps1 (Command to run the script)

Write-Host 'Clearing caches...' -ForegroundColor Yellow

# Clear Prisma cache
Write-Host 'Clearing Prisma cache...' -ForegroundColor Cyan
Remove-Item -Path 'node_modules\.prisma' -Recurse -Force -ErrorAction SilentlyContinue
Write-Host '✓ Prisma cache cleared' -ForegroundColor Green

# Clear tsx cache
Write-Host 'Clearing tsx cache...' -ForegroundColor Cyan
Remove-Item -Path "$env:TEMP\*tsx*" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host '✓ tsx cache cleared' -ForegroundColor Green

# Clear node_modules cache
Write-Host 'Clearing node_modules cache...' -ForegroundColor Cyan
Remove-Item -Path 'node_modules\.cache' -Recurse -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path 'packages' -Filter 'node_modules' -Recurse -Directory | ForEach-Object {
    Remove-Item -Path "$($_.FullName)\.cache" -Recurse -Force -ErrorAction SilentlyContinue
}
Write-Host '✓ node_modules cache cleared' -ForegroundColor Green

# Clear Vite cache
Write-Host 'Clearing Vite cache...' -ForegroundColor Cyan
Remove-Item -Path 'packages\frontend\node_modules\.vite' -Recurse -Force -ErrorAction SilentlyContinue
Write-Host '✓ Vite cache cleared' -ForegroundColor Green

Write-Host ''
Write-Host 'Cache clearing complete!' -ForegroundColor Green
Write-Host 'Now regenerate Prisma Client:' -ForegroundColor Yellow
Write-Host '  cd packages\user-service' -ForegroundColor Cyan
Write-Host '  npm run db:generate' -ForegroundColor Cyan
