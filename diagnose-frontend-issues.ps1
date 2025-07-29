# Diagnose Frontend Flickering and Performance Issues

$ServerIP = "167.88.43.193"
$Username = "root"

Write-Host "================================================================" -ForegroundColor Red
Write-Host "    Frontend Flickering and Performance Diagnosis" -ForegroundColor Red
Write-Host "================================================================" -ForegroundColor Red
Write-Host "Diagnosing frontend issues after smart cache deployment" -ForegroundColor Red
Write-Host "================================================================" -ForegroundColor Red

# Step 1: Check deployment history and conflicts
Write-Host "[STEP 1] Checking deployment history and potential conflicts..." -ForegroundColor Blue

try {
    Write-Host "[INFO] Checking recent Git commits..." -ForegroundColor Cyan
    $recentCommits = git log --oneline -10
    Write-Host "Recent commits:" -ForegroundColor White
    Write-Host $recentCommits -ForegroundColor Gray
    
    Write-Host "[INFO] Checking if force push caused conflicts..." -ForegroundColor Cyan
    $gitStatus = git status --porcelain
    if ($gitStatus) {
        Write-Host "[WARNING] Uncommitted changes detected:" -ForegroundColor Yellow
        Write-Host $gitStatus -ForegroundColor Gray
    } else {
        Write-Host "[SUCCESS] Working directory clean" -ForegroundColor Green
    }
    
    Write-Host "[INFO] Checking server Git status..." -ForegroundColor Cyan
    $serverGitStatus = ssh $Username@$ServerIP "cd /var/www/diamond-website && git log --oneline -5"
    Write-Host "Server recent commits:" -ForegroundColor White
    Write-Host $serverGitStatus -ForegroundColor Gray
}
catch {
    Write-Host "[ERROR] Git history check failed: $_" -ForegroundColor Red
}

# Step 2: Analyze smart cache configuration
Write-Host "[STEP 2] Analyzing smart cache configuration..." -ForegroundColor Blue

try {
    Write-Host "[INFO] Checking cache-related code on server..." -ForegroundColor Cyan
    $cacheConfig = ssh $Username@$ServerIP "cd /var/www/diamond-website && grep -n -A 5 -B 5 'cache.*static\|static.*cache\|Cache-Control\|ETag' server.js | head -20"
    Write-Host "Cache configuration found:" -ForegroundColor Green
    Write-Host $cacheConfig -ForegroundColor White
    
    Write-Host "[INFO] Checking for frontend-specific cache settings..." -ForegroundColor Cyan
    $frontendCache = ssh $Username@$ServerIP "cd /var/www/diamond-website && grep -n -A 3 -B 3 'public\|assets\|css\|js\|html' server.js | head -15"
    Write-Host "Frontend cache settings:" -ForegroundColor Green
    Write-Host $frontendCache -ForegroundColor White
}
catch {
    Write-Host "[ERROR] Cache analysis failed: $_" -ForegroundColor Red
}

# Step 3: Test frontend performance and caching
Write-Host "[STEP 3] Testing frontend performance and caching..." -ForegroundColor Blue

try {
    Write-Host "[INFO] Testing main page load time..." -ForegroundColor Cyan
    $mainPageTime = ssh $Username@$ServerIP "curl -w 'Total:%{time_total}s|DNS:%{time_namelookup}s|Connect:%{time_connect}s|Transfer:%{time_starttransfer}s' -o /dev/null -s http://localhost:3001/"
    Write-Host "Main page timing: $mainPageTime" -ForegroundColor White
    
    Write-Host "[INFO] Testing static assets..." -ForegroundColor Cyan
    $staticAssets = @("/css/style.css", "/js/main.js", "/images/logo.png")
    foreach ($asset in $staticAssets) {
        $assetTime = ssh $Username@$ServerIP "curl -w 'Time:%{time_total}s|Size:%{size_download}bytes' -o /dev/null -s http://localhost:3001$asset 2>/dev/null || echo 'Asset not found'"
        Write-Host "  $asset - $assetTime" -ForegroundColor White
    }
    
    Write-Host "[INFO] Testing cache headers..." -ForegroundColor Cyan
    $cacheHeaders = ssh $Username@$ServerIP "curl -I http://localhost:3001/ 2>/dev/null | grep -i 'cache\|etag\|expires\|last-modified'"
    Write-Host "Cache headers:" -ForegroundColor Green
    Write-Host $cacheHeaders -ForegroundColor White
}
catch {
    Write-Host "[ERROR] Frontend testing failed: $_" -ForegroundColor Red
}

# Step 4: Check for JavaScript errors and console issues
Write-Host "[STEP 4] Checking for potential JavaScript/rendering issues..." -ForegroundColor Blue

try {
    Write-Host "[INFO] Checking server logs for frontend errors..." -ForegroundColor Cyan
    $serverLogs = ssh $Username@$ServerIP "pm2 logs diamond-website --lines 20 | grep -i 'error\|warn\|fail' || echo 'No errors found'"
    Write-Host "Server error logs:" -ForegroundColor White
    Write-Host $serverLogs -ForegroundColor Gray
    
    Write-Host "[INFO] Checking for MIME type issues..." -ForegroundColor Cyan
    $mimeTypes = ssh $Username@$ServerIP "cd /var/www/diamond-website && grep -n -A 3 -B 3 'mime\|content-type\|text/css\|text/javascript' server.js | head -10"
    Write-Host "MIME type configuration:" -ForegroundColor White
    Write-Host $mimeTypes -ForegroundColor Gray
}
catch {
    Write-Host "[ERROR] JavaScript/rendering check failed: $_" -ForegroundColor Red
}

# Step 5: Compare local vs production configurations
Write-Host "[STEP 5] Comparing local vs production configurations..." -ForegroundColor Blue

try {
    Write-Host "[INFO] Checking local server.js size and hash..." -ForegroundColor Cyan
    $localSize = (Get-Item "server.js").Length
    $localHash = (Get-FileHash "server.js" -Algorithm MD5).Hash
    Write-Host "Local: $localSize bytes, MD5: $localHash" -ForegroundColor White
    
    Write-Host "[INFO] Checking production server.js size and hash..." -ForegroundColor Cyan
    $prodSize = ssh $Username@$ServerIP "stat -c%s /var/www/diamond-website/server.js"
    $prodHash = ssh $Username@$ServerIP "md5sum /var/www/diamond-website/server.js | cut -d' ' -f1"
    Write-Host "Production: $prodSize bytes, MD5: $prodHash" -ForegroundColor White
    
    if ($localHash.ToLower() -eq $prodHash.ToLower()) {
        Write-Host "[SUCCESS] Files match perfectly" -ForegroundColor Green
    } else {
        Write-Host "[CRITICAL] Files don't match - deployment issue!" -ForegroundColor Red
    }
    
    Write-Host "[INFO] Checking environment differences..." -ForegroundColor Cyan
    $prodEnv = ssh $Username@$ServerIP "cd /var/www/diamond-website && node -e 'console.log(JSON.stringify({NODE_ENV: process.env.NODE_ENV, PORT: process.env.PORT}, null, 2))'"
    Write-Host "Production environment:" -ForegroundColor White
    Write-Host $prodEnv -ForegroundColor Gray
}
catch {
    Write-Host "[ERROR] Configuration comparison failed: $_" -ForegroundColor Red
}

# Step 6: Test smart cache impact on frontend
Write-Host "[STEP 6] Testing smart cache impact on frontend..." -ForegroundColor Blue

try {
    Write-Host "[INFO] Testing API endpoints that might affect frontend..." -ForegroundColor Cyan
    $apiEndpoints = @("/api/status", "/api/products", "/api/categories")
    foreach ($endpoint in $apiEndpoints) {
        $apiTime = ssh $Username@$ServerIP "curl -w 'Time:%{time_total}s' -o /dev/null -s http://localhost:3001$endpoint"
        Write-Host "  $endpoint - $apiTime" -ForegroundColor White
    }
    
    Write-Host "[INFO] Testing cache consistency..." -ForegroundColor Cyan
    for ($i = 1; $i -le 3; $i++) {
        $cacheTest = ssh $Username@$ServerIP "curl -w 'Time:%{time_total}s' -o /dev/null -s http://localhost:3001/api/products"
        Write-Host "  Cache test $i - $cacheTest" -ForegroundColor White
        Start-Sleep -Seconds 1
    }
}
catch {
    Write-Host "[ERROR] Cache impact testing failed: $_" -ForegroundColor Red
}

# Step 7: Generate fix recommendations
Write-Host "[STEP 7] Generating fix recommendations..." -ForegroundColor Blue

Write-Host ""
Write-Host "================================================================" -ForegroundColor Yellow
Write-Host "    Diagnosis Results and Recommendations" -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "🔍 POTENTIAL CAUSES OF FLICKERING:" -ForegroundColor Cyan
Write-Host "  1. Cache-Control headers causing resource re-fetching" -ForegroundColor White
Write-Host "  2. Smart cache interfering with static asset delivery" -ForegroundColor White
Write-Host "  3. Force push overwriting frontend-specific fixes" -ForegroundColor White
Write-Host "  4. MIME type configuration issues" -ForegroundColor White
Write-Host "  5. JavaScript loading order problems due to caching" -ForegroundColor White
Write-Host ""

Write-Host "🚀 IMMEDIATE FIXES TO TRY:" -ForegroundColor Cyan
Write-Host ""
Write-Host "FIX 1: Disable aggressive caching for frontend assets" -ForegroundColor Yellow
Write-Host "  Add to server.js:" -ForegroundColor White
Write-Host "  app.use('/css', express.static('public/css', { maxAge: 0 }));" -ForegroundColor Gray
Write-Host "  app.use('/js', express.static('public/js', { maxAge: 0 }));" -ForegroundColor Gray
Write-Host ""

Write-Host "FIX 2: Add proper cache headers for HTML pages" -ForegroundColor Yellow
Write-Host "  app.use((req, res, next) => {" -ForegroundColor Gray
Write-Host "    if (req.path.endsWith('.html') || req.path === '/') {" -ForegroundColor Gray
Write-Host "      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');" -ForegroundColor Gray
Write-Host "    }" -ForegroundColor Gray
Write-Host "    next();" -ForegroundColor Gray
Write-Host "  });" -ForegroundColor Gray
Write-Host ""

Write-Host "FIX 3: Optimize static file serving" -ForegroundColor Yellow
Write-Host "  app.use(express.static('public', {" -ForegroundColor Gray
Write-Host "    etag: false," -ForegroundColor Gray
Write-Host "    lastModified: false," -ForegroundColor Gray
Write-Host "    maxAge: 0" -ForegroundColor Gray
Write-Host "  }));" -ForegroundColor Gray
Write-Host ""

Write-Host "📋 VERIFICATION COMMANDS:" -ForegroundColor Cyan
Write-Host "  # Test page load time" -ForegroundColor White
Write-Host "  curl -w 'Time:%{time_total}s' -o /dev/null -s http://167.88.43.193:3001/" -ForegroundColor Gray
Write-Host ""
Write-Host "  # Check cache headers" -ForegroundColor White
Write-Host "  curl -I http://167.88.43.193:3001/" -ForegroundColor Gray
Write-Host ""
Write-Host "  # Test static assets" -ForegroundColor White
Write-Host "  curl -I http://167.88.43.193:3001/css/style.css" -ForegroundColor Gray
Write-Host ""

Write-Host "🎯 NEXT STEPS:" -ForegroundColor Cyan
Write-Host "  1. Review the diagnosis results above" -ForegroundColor White
Write-Host "  2. Apply the recommended fixes to server.js" -ForegroundColor White
Write-Host "  3. Test locally first" -ForegroundColor White
Write-Host "  4. Deploy with: git push deploy master" -ForegroundColor White
Write-Host "  5. Verify frontend performance improvement" -ForegroundColor White
Write-Host ""

Write-Host "⚠️  IMPORTANT:" -ForegroundColor Red
Write-Host "The smart cache system may be too aggressive for frontend assets." -ForegroundColor White
Write-Host "Consider separating API caching from static file serving." -ForegroundColor White

# Self cleanup
Remove-Item $MyInvocation.MyCommand.Path -Force
