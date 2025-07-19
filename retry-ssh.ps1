# Retry SSH Connection
Write-Host "Retrying SSH connection to 167.88.43.193..." -ForegroundColor Cyan
ssh -o ConnectTimeout=10 root@167.88.43.193 'echo "SSH working" && pm2 list'
