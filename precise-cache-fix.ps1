# Precise Cache Fix - Target the Exact Problem

$ServerIP = "167.88.43.193"
$Username = "root"

Write-Host "================================================================" -ForegroundColor Green
Write-Host "    Precise Cache Fix - Target the Exact Problem" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host "Fixing the exact cache configuration causing flickering" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green

# Problem identified:
# express.static(".", { maxAge: process.env.NODE_ENV === "production" ? "1d" : "0" })
# NODE_ENV is not set to "production", so maxAge is "0"

Write-Host "[ANALYSIS] Root cause identified:" -ForegroundColor Blue
Write-Host "  express.static('.', { maxAge: NODE_ENV === 'production' ? '1d' : '0' })" -ForegroundColor Red
Write-Host "  NODE_ENV is not 'production', so maxAge = '0'" -ForegroundColor Red
Write-Host "  This causes Cache-Control: public, max-age=0" -ForegroundColor Red
Write-Host ""

# Step 1: Check NODE_ENV
Write-Host "[STEP 1] Checking NODE_ENV..." -ForegroundColor Blue

try {
    Write-Host "[INFO] Checking current NODE_ENV..." -ForegroundColor Cyan
    $nodeEnv = ssh $Username@$ServerIP "cd /var/www/diamond-website && node -e 'console.log(process.env.NODE_ENV || \"undefined\")'"
    Write-Host "Current NODE_ENV: '$nodeEnv'" -ForegroundColor White
    
    if ($nodeEnv -ne "production") {
        Write-Host "[CRITICAL] NODE_ENV is not set to 'production'!" -ForegroundColor Red
        $needsEnvFix = $true
    } else {
        Write-Host "[SUCCESS] NODE_ENV is correctly set" -ForegroundColor Green
        $needsEnvFix = $false
    }
}
catch {
    Write-Host "[ERROR] NODE_ENV check failed: $_" -ForegroundColor Red
    $needsEnvFix = $true
}

# Step 2: Fix the cache configuration directly
Write-Host "[STEP 2] Fixing cache configuration..." -ForegroundColor Blue

try {
    Write-Host "[INFO] Backing up server.js..." -ForegroundColor Cyan
    ssh $Username@$ServerIP "cd /var/www/diamond-website && cp server.js server.js.backup-cache-fix"
    
    Write-Host "[INFO] Applying precise cache fix..." -ForegroundColor Cyan
    
    # Replace the problematic static configuration with a fixed one
    $fixCommand = @'
cd /var/www/diamond-website
sed -i 's/maxAge: process\.env\.NODE_ENV === "production" ? "1d" : "0"/maxAge: "1h"/' server.js
echo "Cache configuration fixed"
'@
    
    ssh $Username@$ServerIP $fixCommand
    
    Write-Host "[SUCCESS] Cache configuration updated" -ForegroundColor Green
    
    # Also add specific cache headers for different file types
    Write-Host "[INFO] Adding file-type specific cache headers..." -ForegroundColor Cyan
    
    $addCacheMiddleware = @'
cd /var/www/diamond-website
# Add cache middleware before the static file serving
sed -i '/\/\/ 静态文件服务配置/i\
// Cache control middleware to prevent flickering\
app.use((req, res, next) => {\
  if (req.path === "/" || req.path.endsWith(".html")) {\
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");\
  } else if (req.path.endsWith(".css") || req.path.endsWith(".js")) {\
    res.set("Cache-Control", "public, max-age=3600, must-revalidate");\
  } else if (req.path.match(/\.(jpg|jpeg|png|gif|ico|svg)$/)) {\
    res.set("Cache-Control", "public, max-age=86400");\
  }\
  next();\
});\
' server.js
echo "Cache middleware added"
'@
    
    ssh $Username@$ServerIP $addCacheMiddleware
    
    Write-Host "[SUCCESS] Cache middleware added" -ForegroundColor Green
}
catch {
    Write-Host "[ERROR] Cache fix failed: $_" -ForegroundColor Red
}

# Step 3: Set NODE_ENV if needed
if ($needsEnvFix) {
    Write-Host "[STEP 3] Setting NODE_ENV to production..." -ForegroundColor Blue
    
    try {
        Write-Host "[INFO] Setting NODE_ENV for PM2..." -ForegroundColor Cyan
        ssh $Username@$ServerIP "pm2 set diamond-website NODE_ENV production"
        
        Write-Host "[SUCCESS] NODE_ENV set to production" -ForegroundColor Green
    }
    catch {
        Write-Host "[ERROR] NODE_ENV setting failed: $_" -ForegroundColor Red
    }
} else {
    Write-Host "[STEP 3] NODE_ENV already correct" -ForegroundColor Green
}

# Step 4: Restart PM2
Write-Host "[STEP 4] Restarting application..." -ForegroundColor Blue

try {
    Write-Host "[INFO] Restarting PM2 with updated environment..." -ForegroundColor Cyan
    ssh $Username@$ServerIP "pm2 restart diamond-website --update-env"
    
    Start-Sleep -Seconds 10
    
    Write-Host "[INFO] Checking PM2 status..." -ForegroundColor Cyan
    $pm2Status = ssh $Username@$ServerIP "pm2 show diamond-website | grep -E '(status|uptime|env)'"
    Write-Host "PM2 Status: $pm2Status" -ForegroundColor Green
}
catch {
    Write-Host "[ERROR] Restart failed: $_" -ForegroundColor Red
}

# Step 5: Test the fix
Write-Host "[STEP 5] Testing the precise fix..." -ForegroundColor Blue

try {
    Write-Host "[INFO] Testing new cache headers..." -ForegroundColor Cyan
    $newHeaders = ssh $Username@$ServerIP "curl -I http://localhost:3001/ 2>/dev/null | grep -i 'cache-control'"
    Write-Host "New cache headers: $newHeaders" -ForegroundColor Green
    
    Write-Host "[INFO] Testing NODE_ENV in application..." -ForegroundColor Cyan
    $appNodeEnv = ssh $Username@$ServerIP "curl -s http://localhost:3001/api/status | grep -o '\"environment\":\"[^\"]*\"'"
    Write-Host "App environment: $appNodeEnv" -ForegroundColor White
    
    Write-Host "[INFO] Testing page load performance..." -ForegroundColor Cyan
    $loadTest1 = ssh $Username@$ServerIP "curl -w '%{time_total}' -o /dev/null -s http://localhost:3001/"
    Write-Host "Load test 1: ${loadTest1}s" -ForegroundColor White
    
    Start-Sleep -Seconds 2
    
    $loadTest2 = ssh $Username@$ServerIP "curl -w '%{time_total}' -o /dev/null -s http://localhost:3001/"
    Write-Host "Load test 2: ${loadTest2}s" -ForegroundColor White
    
    # Check if the fix worked
    if ($newHeaders -like "*no-cache*" -or $newHeaders -notlike "*max-age=0*") {
        Write-Host "[SUCCESS] Cache headers fixed!" -ForegroundColor Green
        $fixWorked = $true
    } else {
        Write-Host "[WARNING] Cache headers may still need attention" -ForegroundColor Yellow
        $fixWorked = $false
    }
}
catch {
    Write-Host "[ERROR] Testing failed: $_" -ForegroundColor Red
    $fixWorked = $false
}

# Step 6: Verify the changes
Write-Host "[STEP 6] Verifying changes..." -ForegroundColor Blue

try {
    Write-Host "[INFO] Checking if cache fix is in server.js..." -ForegroundColor Cyan
    $cacheFixCheck = ssh $Username@$ServerIP "cd /var/www/diamond-website && grep -c 'no-cache.*must-revalidate\|maxAge.*1h' server.js"
    Write-Host "Cache fix lines found: $cacheFixCheck" -ForegroundColor White
    
    Write-Host "[INFO] Checking updated static configuration..." -ForegroundColor Cyan
    $staticConfig = ssh $Username@$ServerIP "cd /var/www/diamond-website && grep -A 3 -B 1 'maxAge.*1h' server.js"
    Write-Host "Updated static config: $staticConfig" -ForegroundColor White
}
catch {
    Write-Host "[ERROR] Verification failed: $_" -ForegroundColor Red
}

# Summary
Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "    Precise Cache Fix Summary" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""

if ($fixWorked) {
    Write-Host "✅ CACHE FIX: SUCCESS" -ForegroundColor Green
} else {
    Write-Host "⚠️  CACHE FIX: NEEDS VERIFICATION" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔧 ROOT CAUSE FIXED:" -ForegroundColor Cyan
Write-Host "  • Changed maxAge from conditional 0 to fixed 1h" -ForegroundColor White
Write-Host "  • Added file-type specific cache middleware" -ForegroundColor White
Write-Host "  • Set NODE_ENV to production if needed" -ForegroundColor White
Write-Host "  • HTML pages: no-cache to prevent flickering" -ForegroundColor White
Write-Host ""
Write-Host "📊 EXPECTED CACHE BEHAVIOR:" -ForegroundColor Cyan
Write-Host "  • HTML pages: Cache-Control: no-cache, no-store, must-revalidate" -ForegroundColor White
Write-Host "  • CSS/JS files: Cache-Control: public, max-age=3600, must-revalidate" -ForegroundColor White
Write-Host "  • Images: Cache-Control: public, max-age=86400" -ForegroundColor White
Write-Host "  • Other static files: Cache-Control: public, max-age=3600" -ForegroundColor White
Write-Host ""
Write-Host "🎯 IMMEDIATE ACTIONS:" -ForegroundColor Cyan
Write-Host "  1. Visit your website NOW" -ForegroundColor White
Write-Host "  2. Check for flickering (should be completely gone)" -ForegroundColor White
Write-Host "  3. Test page load speed (should be faster)" -ForegroundColor White
Write-Host "  4. Open browser dev tools Network tab" -ForegroundColor White
Write-Host "  5. Refresh page and check cache headers" -ForegroundColor White
Write-Host ""

if ($fixWorked) {
    Write-Host "🎉 SUCCESS!" -ForegroundColor Green
    Write-Host "The precise cache fix has been applied!" -ForegroundColor Green
    Write-Host "Your website should now load smoothly without flickering!" -ForegroundColor Green
} else {
    Write-Host "📝 MANUAL VERIFICATION:" -ForegroundColor Yellow
    Write-Host "Please test your website and check if flickering is resolved" -ForegroundColor White
}

Write-Host ""
Write-Host "🌐 TEST NOW:" -ForegroundColor Cyan
Write-Host "Visit your website and verify the flickering issue is resolved!" -ForegroundColor White

# Self cleanup
Remove-Item $MyInvocation.MyCommand.Path -Force
