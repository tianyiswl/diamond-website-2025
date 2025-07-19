# Simple Website Monitor
Write-Host "Diamond Website Status:" -ForegroundColor Cyan
ssh root@167.88.43.193 'pm2 list'
Write-Host ""
Write-Host "API Test:" -ForegroundColor Cyan
ssh root@167.88.43.193 'curl -s http://localhost:3001/api/status | head -3'
