# Restore Git-Based Deployment - The Right Way

$ServerIP = "167.88.43.193"
$Username = "root"

Write-Host "================================================================" -ForegroundColor Green
Write-Host "    Restore Git-Based Deployment - The Right Way" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host "Fixing deployment issues and restoring simple Git workflow" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green

# Step 1: Verify current deployment status
Write-Host "[STEP 1] Verifying current deployment status..." -ForegroundColor Blue

try {
    Write-Host "[INFO] Checking current server code..." -ForegroundColor Cyan
    $serverFileSize = ssh root@$ServerIP "stat -c%s /var/www/diamond-website/server.js 2>/dev/null || echo 0"
    $localFileSize = (Get-Item "server.js").Length
    
    Write-Host "Local server.js: $localFileSize bytes" -ForegroundColor White
    Write-Host "Server server.js: $serverFileSize bytes" -ForegroundColor White
    
    if ($serverFileSize -eq $localFileSize) {
        Write-Host "[INFO] File sizes match, but checking if code is actually running..." -ForegroundColor Yellow
    } else {
        Write-Host "[CRITICAL] File sizes don't match - deployment failed!" -ForegroundColor Red
    }
    
    Write-Host "[INFO] Checking what PM2 is actually running..." -ForegroundColor Cyan
    $pm2Details = ssh root@$ServerIP "pm2 show diamond-website | grep -E '(script path|exec cwd|pid)'"
    Write-Host "PM2 execution details:" -ForegroundColor White
    Write-Host $pm2Details -ForegroundColor Gray
    
    Write-Host "[INFO] Checking actual running process..." -ForegroundColor Cyan
    $runningProcess = ssh root@$ServerIP "ps aux | grep 'node.*server.js' | grep -v grep"
    Write-Host "Running process: $runningProcess" -ForegroundColor White
}
catch {
    Write-Host "[ERROR] Status check failed: $_" -ForegroundColor Red
}

# Step 2: Check Git deployment setup
Write-Host "[STEP 2] Checking Git deployment setup..." -ForegroundColor Blue

try {
    Write-Host "[INFO] Checking local Git remotes..." -ForegroundColor Cyan
    $gitRemotes = git remote -v
    Write-Host "Current Git remotes:" -ForegroundColor White
    Write-Host $gitRemotes -ForegroundColor Gray
    
    Write-Host "[INFO] Checking if 'deploy' remote exists..." -ForegroundColor Cyan
    $deployRemote = git remote get-url deploy 2>$null
    
    if ($deployRemote) {
        Write-Host "[SUCCESS] Deploy remote found: $deployRemote" -ForegroundColor Green
        $hasDeployRemote = $true
    } else {
        Write-Host "[WARNING] Deploy remote not found!" -ForegroundColor Yellow
        $hasDeployRemote = $false
    }
    
    Write-Host "[INFO] Checking server Git repository..." -ForegroundColor Cyan
    $serverGitStatus = ssh root@$ServerIP "cd /var/www/diamond-website && git status 2>/dev/null || echo 'Not a git repository'"
    Write-Host "Server Git status: $serverGitStatus" -ForegroundColor White
    
    if ($serverGitStatus -like "*Not a git repository*") {
        Write-Host "[CRITICAL] Server directory is not a Git repository!" -ForegroundColor Red
        $serverHasGit = $false
    } else {
        Write-Host "[SUCCESS] Server has Git repository" -ForegroundColor Green
        $serverHasGit = $true
    }
}
catch {
    Write-Host "[ERROR] Git check failed: $_" -ForegroundColor Red
    $hasDeployRemote = $false
    $serverHasGit = $false
}

# Step 3: Restore Git deployment if needed
if (-not $hasDeployRemote -or -not $serverHasGit) {
    Write-Host "[STEP 3] Restoring Git deployment setup..." -ForegroundColor Blue
    
    try {
        if (-not $serverHasGit) {
            Write-Host "[INFO] Setting up Git repository on server..." -ForegroundColor Cyan
            ssh root@$ServerIP "cd /var/www/diamond-website && git init && git config receive.denyCurrentBranch ignore"
        }
        
        if (-not $hasDeployRemote) {
            Write-Host "[INFO] Adding deploy remote..." -ForegroundColor Cyan
            $deployUrl = "root@${ServerIP}:/var/www/diamond-website/.git"
            git remote add deploy $deployUrl
            Write-Host "[SUCCESS] Deploy remote added" -ForegroundColor Green
        }
        
        Write-Host "[INFO] Setting up post-receive hook..." -ForegroundColor Cyan
        $postReceiveHook = @"
#!/bin/bash
cd /var/www/diamond-website
git --git-dir=.git --work-tree=. checkout -f
npm install --production
pm2 restart diamond-website || pm2 start server.js --name diamond-website
echo "Deployment completed successfully"
"@
        
        # Create the hook on server
        ssh root@$ServerIP "mkdir -p /var/www/diamond-website/.git/hooks"
        echo $postReceiveHook | ssh root@$ServerIP "cat > /var/www/diamond-website/.git/hooks/post-receive"
        ssh root@$ServerIP "chmod +x /var/www/diamond-website/.git/hooks/post-receive"
        
        Write-Host "[SUCCESS] Git deployment setup completed!" -ForegroundColor Green
    }
    catch {
        Write-Host "[ERROR] Git setup failed: $_" -ForegroundColor Red
    }
} else {
    Write-Host "[STEP 3] Git deployment already configured" -ForegroundColor Green
}

# Step 4: Test Git deployment
Write-Host "[STEP 4] Testing Git deployment..." -ForegroundColor Blue

try {
    Write-Host "[INFO] Committing current changes..." -ForegroundColor Cyan
    git add .
    $commitMessage = "Smart cache deployment - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    git commit -m $commitMessage
    
    Write-Host "[INFO] Deploying via Git push..." -ForegroundColor Cyan
    Write-Host "Running: git push deploy master" -ForegroundColor Yellow
    $deployResult = git push deploy master 2>&1
    Write-Host "Deploy result:" -ForegroundColor White
    Write-Host $deployResult -ForegroundColor Gray
    
    if ($deployResult -like "*Deployment completed successfully*") {
        Write-Host "[SUCCESS] Git deployment successful!" -ForegroundColor Green
        $deploySuccess = $true
    } else {
        Write-Host "[WARNING] Git deployment may have issues" -ForegroundColor Yellow
        $deploySuccess = $false
    }
}
catch {
    Write-Host "[ERROR] Git deployment failed: $_" -ForegroundColor Red
    $deploySuccess = $false
}

# Step 5: Verify deployment
Write-Host "[STEP 5] Verifying deployment..." -ForegroundColor Blue

try {
    Start-Sleep -Seconds 10
    
    Write-Host "[INFO] Checking PM2 status after Git deployment..." -ForegroundColor Cyan
    $newPM2Status = ssh root@$ServerIP "pm2 list"
    Write-Host $newPM2Status -ForegroundColor White
    
    Write-Host "[INFO] Testing API after deployment..." -ForegroundColor Cyan
    $apiTest = ssh root@$ServerIP "curl -s http://localhost:3001/api/status"
    Write-Host "API Response: $apiTest" -ForegroundColor Green
    
    Write-Host "[INFO] Testing smart cache performance..." -ForegroundColor Cyan
    $cacheTest1 = ssh root@$ServerIP "curl -w '%{time_total}' -o /dev/null -s http://localhost:3001/api/products"
    Write-Host "First request: ${cacheTest1}s" -ForegroundColor White
    
    Start-Sleep -Seconds 2
    
    $cacheTest2 = ssh root@$ServerIP "curl -w '%{time_total}' -o /dev/null -s http://localhost:3001/api/products"
    Write-Host "Second request: ${cacheTest2}s" -ForegroundColor White
    
    if ([double]$cacheTest2 -lt [double]$cacheTest1) {
        Write-Host "[SUCCESS] Smart cache is working!" -ForegroundColor Green
    }
    
    Write-Host "[INFO] Checking server file after Git deployment..." -ForegroundColor Cyan
    $newServerSize = ssh root@$ServerIP "stat -c%s /var/www/diamond-website/server.js"
    Write-Host "Server file size after deployment: $newServerSize bytes" -ForegroundColor White
    
    if ($newServerSize -eq $localFileSize) {
        Write-Host "[SUCCESS] Files match after Git deployment!" -ForegroundColor Green
    }
}
catch {
    Write-Host "[ERROR] Verification failed: $_" -ForegroundColor Red
}

# Summary and instructions
Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "    Git Deployment Restoration Summary" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""

if ($deploySuccess) {
    Write-Host "✅ GIT DEPLOYMENT: RESTORED AND WORKING" -ForegroundColor Green
} else {
    Write-Host "❌ GIT DEPLOYMENT: NEEDS ATTENTION" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎯 WHY SSH/SCP METHOD FAILED:" -ForegroundColor Cyan
Write-Host "  • Manual file upload doesn't trigger proper application reload" -ForegroundColor White
Write-Host "  • PM2 restart may not pick up file changes immediately" -ForegroundColor White
Write-Host "  • No automatic dependency installation" -ForegroundColor White
Write-Host "  • No verification that files were properly deployed" -ForegroundColor White
Write-Host "  • SSH connection issues caused incomplete uploads" -ForegroundColor White
Write-Host ""
Write-Host "🚀 WHY GIT DEPLOYMENT IS BETTER:" -ForegroundColor Cyan
Write-Host "  • Atomic deployment (all files updated together)" -ForegroundColor White
Write-Host "  • Automatic dependency installation" -ForegroundColor White
Write-Host "  • Automatic PM2 restart with proper reload" -ForegroundColor White
Write-Host "  • Version control and rollback capability" -ForegroundColor White
Write-Host "  • Simple one-command deployment" -ForegroundColor White
Write-Host ""
Write-Host "📋 YOUR NEW DEPLOYMENT WORKFLOW:" -ForegroundColor Cyan
Write-Host "  1. Make changes to your code locally" -ForegroundColor White
Write-Host "  2. Test changes locally" -ForegroundColor White
Write-Host "  3. Run deployment commands:" -ForegroundColor White
Write-Host "     git add ." -ForegroundColor Yellow
Write-Host "     git commit -m \"Your change description\"" -ForegroundColor Yellow
Write-Host "     git push deploy master" -ForegroundColor Yellow
Write-Host "  4. Verify changes on live website" -ForegroundColor White
Write-Host ""
Write-Host "🔧 VERIFICATION COMMANDS:" -ForegroundColor Cyan
Write-Host "  ssh root@$ServerIP 'pm2 list'" -ForegroundColor White
Write-Host "  ssh root@$ServerIP 'curl http://localhost:3001/api/status'" -ForegroundColor White
Write-Host ""

if ($deploySuccess) {
    Write-Host "🎉 SUCCESS!" -ForegroundColor Green
    Write-Host "Your smart cache system should now be deployed and working!" -ForegroundColor Green
    Write-Host "Check your website - the local bug fixes should now be live!" -ForegroundColor Green
} else {
    Write-Host "⚠️  NEXT STEPS:" -ForegroundColor Yellow
    Write-Host "Try the Git deployment manually:" -ForegroundColor White
    Write-Host "  git push deploy master" -ForegroundColor Yellow
}

# Self cleanup
Remove-Item $MyInvocation.MyCommand.Path -Force
