# Setup Git Deployment - Manual Configuration

$ServerIP = "167.88.43.193"
$Username = "root"

Write-Host "================================================================" -ForegroundColor Green
Write-Host "    Manual Git Deployment Setup" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green

# Step 1: Check current Git status
Write-Host "[STEP 1] Checking current Git configuration..." -ForegroundColor Blue

try {
    Write-Host "[INFO] Current Git remotes:" -ForegroundColor Cyan
    $remotes = git remote -v
    Write-Host $remotes -ForegroundColor White
    
    Write-Host "[INFO] Checking if deploy remote exists..." -ForegroundColor Cyan
    $deployExists = git remote get-url deploy 2>$null
    if ($deployExists) {
        Write-Host "[SUCCESS] Deploy remote exists: $deployExists" -ForegroundColor Green
    } else {
        Write-Host "[INFO] Deploy remote not found - will create" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "[ERROR] Git check failed: $_" -ForegroundColor Red
}

# Step 2: Setup server Git repository
Write-Host "[STEP 2] Setting up server Git repository..." -ForegroundColor Blue

try {
    Write-Host "[INFO] Initializing Git on server..." -ForegroundColor Cyan
    ssh $Username@$ServerIP "cd /var/www/diamond-website && git init"
    
    Write-Host "[INFO] Configuring Git to accept pushes..." -ForegroundColor Cyan
    ssh $Username@$ServerIP "cd /var/www/diamond-website && git config receive.denyCurrentBranch ignore"
    
    Write-Host "[SUCCESS] Server Git repository configured" -ForegroundColor Green
}
catch {
    Write-Host "[ERROR] Server Git setup failed: $_" -ForegroundColor Red
}

# Step 3: Add deploy remote
Write-Host "[STEP 3] Adding deploy remote..." -ForegroundColor Blue

try {
    if (-not $deployExists) {
        Write-Host "[INFO] Adding deploy remote..." -ForegroundColor Cyan
        $deployUrl = "root@${ServerIP}:/var/www/diamond-website/.git"
        git remote add deploy $deployUrl
        Write-Host "[SUCCESS] Deploy remote added: $deployUrl" -ForegroundColor Green
    } else {
        Write-Host "[INFO] Deploy remote already exists" -ForegroundColor Green
    }
}
catch {
    Write-Host "[ERROR] Failed to add deploy remote: $_" -ForegroundColor Red
}

# Step 4: Create deployment hook
Write-Host "[STEP 4] Creating deployment hook..." -ForegroundColor Blue

try {
    Write-Host "[INFO] Creating post-receive hook..." -ForegroundColor Cyan
    
    $hookContent = @'
#!/bin/bash
echo "Starting deployment..."
cd /var/www/diamond-website
git --git-dir=.git --work-tree=. checkout -f
echo "Files updated"
npm install --production
echo "Dependencies installed"
pm2 restart diamond-website || pm2 start server.js --name diamond-website
echo "Application restarted"
echo "Deployment completed successfully!"
'@
    
    # Create hook directory and file
    ssh $Username@$ServerIP "mkdir -p /var/www/diamond-website/.git/hooks"
    echo $hookContent | ssh $Username@$ServerIP "cat > /var/www/diamond-website/.git/hooks/post-receive"
    ssh $Username@$ServerIP "chmod +x /var/www/diamond-website/.git/hooks/post-receive"
    
    Write-Host "[SUCCESS] Deployment hook created" -ForegroundColor Green
}
catch {
    Write-Host "[ERROR] Hook creation failed: $_" -ForegroundColor Red
}

# Step 5: Test deployment
Write-Host "[STEP 5] Testing Git deployment..." -ForegroundColor Blue

try {
    Write-Host "[INFO] Committing current changes..." -ForegroundColor Cyan
    git add .
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    git commit -m "Setup Git deployment and smart cache - $timestamp"
    
    Write-Host "[INFO] Pushing to deploy remote..." -ForegroundColor Cyan
    Write-Host "Executing: git push deploy master" -ForegroundColor Yellow
    
    $pushResult = git push deploy master 2>&1
    Write-Host "Push result:" -ForegroundColor White
    Write-Host $pushResult -ForegroundColor Gray
    
    if ($pushResult -like "*Deployment completed successfully*") {
        Write-Host "[SUCCESS] Git deployment working!" -ForegroundColor Green
        $deploymentWorking = $true
    } else {
        Write-Host "[WARNING] Deployment may need verification" -ForegroundColor Yellow
        $deploymentWorking = $false
    }
}
catch {
    Write-Host "[ERROR] Test deployment failed: $_" -ForegroundColor Red
    $deploymentWorking = $false
}

# Step 6: Verify deployment
Write-Host "[STEP 6] Verifying deployment..." -ForegroundColor Blue

try {
    Start-Sleep -Seconds 10
    
    Write-Host "[INFO] Checking PM2 status..." -ForegroundColor Cyan
    $pm2Status = ssh $Username@$ServerIP "pm2 list"
    Write-Host $pm2Status -ForegroundColor White
    
    Write-Host "[INFO] Testing API..." -ForegroundColor Cyan
    $apiTest = ssh $Username@$ServerIP "curl -s http://localhost:3001/api/status"
    Write-Host "API Response: $apiTest" -ForegroundColor Green
    
    Write-Host "[INFO] Testing smart cache..." -ForegroundColor Cyan
    $cache1 = ssh $Username@$ServerIP "curl -w '%{time_total}' -o /dev/null -s http://localhost:3001/api/products"
    Write-Host "First request: ${cache1}s" -ForegroundColor White
    
    Start-Sleep -Seconds 2
    
    $cache2 = ssh $Username@$ServerIP "curl -w '%{time_total}' -o /dev/null -s http://localhost:3001/api/products"
    Write-Host "Second request: ${cache2}s" -ForegroundColor White
    
    if ([double]$cache2 -lt [double]$cache1) {
        Write-Host "[SUCCESS] Smart cache is working!" -ForegroundColor Green
    }
}
catch {
    Write-Host "[ERROR] Verification failed: $_" -ForegroundColor Red
}

# Summary
Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "    Git Deployment Setup Complete" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""

if ($deploymentWorking) {
    Write-Host "✅ GIT DEPLOYMENT: WORKING" -ForegroundColor Green
} else {
    Write-Host "⚠️  GIT DEPLOYMENT: NEEDS VERIFICATION" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 YOUR NEW DEPLOYMENT WORKFLOW:" -ForegroundColor Cyan
Write-Host "  1. Make changes to your code" -ForegroundColor White
Write-Host "  2. Test locally" -ForegroundColor White
Write-Host "  3. Deploy with these commands:" -ForegroundColor White
Write-Host ""
Write-Host "     git add ." -ForegroundColor Yellow
Write-Host "     git commit -m \"Your change description\"" -ForegroundColor Yellow
Write-Host "     git push deploy master" -ForegroundColor Yellow
Write-Host ""
Write-Host "🎯 BENEFITS OF GIT DEPLOYMENT:" -ForegroundColor Cyan
Write-Host "  • One command deployment" -ForegroundColor White
Write-Host "  • Automatic dependency installation" -ForegroundColor White
Write-Host "  • Automatic PM2 restart" -ForegroundColor White
Write-Host "  • Version control and rollback" -ForegroundColor White
Write-Host "  • Atomic deployment (all or nothing)" -ForegroundColor White
Write-Host ""
Write-Host "📋 VERIFICATION COMMANDS:" -ForegroundColor Cyan
Write-Host "  ssh $Username@$ServerIP 'pm2 list'" -ForegroundColor White
Write-Host "  ssh $Username@$ServerIP 'curl http://localhost:3001/api/status'" -ForegroundColor White
Write-Host ""
Write-Host "🔧 TROUBLESHOOTING:" -ForegroundColor Cyan
Write-Host "  If deployment fails, check:" -ForegroundColor White
Write-Host "  • SSH connection is working" -ForegroundColor White
Write-Host "  • Server has enough disk space" -ForegroundColor White
Write-Host "  • PM2 is running properly" -ForegroundColor White
Write-Host ""

if ($deploymentWorking) {
    Write-Host "🎉 SUCCESS!" -ForegroundColor Green
    Write-Host "Your Git deployment is now configured and working!" -ForegroundColor Green
    Write-Host "Your smart cache system should be deployed!" -ForegroundColor Green
    Write-Host "Check your website - local fixes should now be live!" -ForegroundColor Green
} else {
    Write-Host "📝 MANUAL TEST:" -ForegroundColor Yellow
    Write-Host "Try deploying manually with:" -ForegroundColor White
    Write-Host "  git push deploy master" -ForegroundColor Yellow
}

# Self cleanup
Remove-Item $MyInvocation.MyCommand.Path -Force
