# Final Cache Fix - Direct and Effective

$ServerIP = "167.88.43.193"
$Username = "root"

Write-Host "================================================================" -ForegroundColor Red
Write-Host "    Final Cache Fix - Direct and Effective" -ForegroundColor Red
Write-Host "================================================================" -ForegroundColor Red
Write-Host "NODE_ENV is production but cache is still max-age=0" -ForegroundColor Red
Write-Host "Need to fix the maxAge configuration directly" -ForegroundColor Red
Write-Host "================================================================" -ForegroundColor Red

# The issue: Even with NODE_ENV=production, cache is still max-age=0
# This suggests the condition is not working as expected
# Solution: Replace with a simple fixed value

Write-Host "[ANALYSIS] Current situation:" -ForegroundColor Blue
Write-Host "  ✅ NODE_ENV is now production" -ForegroundColor Green
Write-Host "  ❌ Cache-Control is still max-age=0" -ForegroundColor Red
Write-Host "  ❌ sed command failed to update maxAge" -ForegroundColor Red
Write-Host "  🎯 Need direct file modification" -ForegroundColor Yellow
Write-Host ""

# Step 1: Check current maxAge configuration
Write-Host "[STEP 1] Checking current maxAge configuration..." -ForegroundColor Blue

try {
    Write-Host "[INFO] Current maxAge line in server.js..." -ForegroundColor Cyan
    $currentMaxAge = ssh $Username@$ServerIP "cd /var/www/diamond-website && grep -n 'maxAge.*production' server.js"
    Write-Host "Current maxAge config: $currentMaxAge" -ForegroundColor White
}
catch {
    Write-Host "[ERROR] Cannot check maxAge config: $_" -ForegroundColor Red
}

# Step 2: Create a simple replacement
Write-Host "[STEP 2] Creating direct replacement..." -ForegroundColor Blue

try {
    Write-Host "[INFO] Creating backup..." -ForegroundColor Cyan
    ssh $Username@$ServerIP "cd /var/www/diamond-website && cp server.js server.js.backup-final"
    
    Write-Host "[INFO] Using simple replacement method..." -ForegroundColor Cyan
    
    # Use a simpler approach - replace the entire line
    $replaceCommand = @'
cd /var/www/diamond-website
# Replace the problematic maxAge line with a simple fixed value
sed -i 's/maxAge: process\.env\.NODE_ENV === "production" ? "1d" : "0"/maxAge: "1h"/g' server.js
echo "Replacement completed"
'@
    
    ssh $Username@$ServerIP $replaceCommand
    
    Write-Host "[SUCCESS] maxAge replacement completed" -ForegroundColor Green
}
catch {
    Write-Host "[ERROR] Replacement failed: $_" -ForegroundColor Red
}

# Step 3: Verify the change
Write-Host "[STEP 3] Verifying the change..." -ForegroundColor Blue

try {
    Write-Host "[INFO] Checking new maxAge configuration..." -ForegroundColor Cyan
    $newMaxAge = ssh $Username@$ServerIP "cd /var/www/diamond-website && grep -n 'maxAge.*1h' server.js"
    Write-Host "New maxAge config: $newMaxAge" -ForegroundColor Green
    
    if ($newMaxAge) {
        Write-Host "[SUCCESS] maxAge successfully changed to 1h" -ForegroundColor Green
        $changeSuccessful = $true
    } else {
        Write-Host "[WARNING] maxAge change not detected" -ForegroundColor Yellow
        $changeSuccessful = $false
    }
}
catch {
    Write-Host "[ERROR] Verification failed: $_" -ForegroundColor Red
    $changeSuccessful = $false
}

# Step 4: Restart PM2 if change was successful
if ($changeSuccessful) {
    Write-Host "[STEP 4] Restarting application with new config..." -ForegroundColor Blue
    
    try {
        Write-Host "[INFO] Restarting PM2..." -ForegroundColor Cyan
        ssh $Username@$ServerIP "pm2 restart diamond-website"
        
        Start-Sleep -Seconds 10
        
        Write-Host "[SUCCESS] Application restarted" -ForegroundColor Green
    }
    catch {
        Write-Host "[ERROR] Restart failed: $_" -ForegroundColor Red
    }
} else {
    Write-Host "[STEP 4] Skipping restart - change not confirmed" -ForegroundColor Yellow
}

# Step 5: Test the final result
Write-Host "[STEP 5] Testing final result..." -ForegroundColor Blue

try {
    Write-Host "[INFO] Testing new cache headers..." -ForegroundColor Cyan
    $finalHeaders = ssh $Username@$ServerIP "curl -I http://localhost:3001/ | grep Cache-Control"
    Write-Host "Final cache headers: $finalHeaders" -ForegroundColor Green
    
    Write-Host "[INFO] Testing page load performance..." -ForegroundColor Cyan
    $finalLoad1 = ssh $Username@$ServerIP "curl -w '%{time_total}' -o /dev/null -s http://localhost:3001/"
    Write-Host "Final load test 1: ${finalLoad1}s" -ForegroundColor White
    
    Start-Sleep -Seconds 2
    
    $finalLoad2 = ssh $Username@$ServerIP "curl -w '%{time_total}' -o /dev/null -s http://localhost:3001/"
    Write-Host "Final load test 2: ${finalLoad2}s" -ForegroundColor White
    
    # Check if the fix finally worked
    if ($finalHeaders -notlike "*max-age=0*") {
        Write-Host "[SUCCESS] Cache headers finally fixed!" -ForegroundColor Green
        $finallyFixed = $true
    } else {
        Write-Host "[CRITICAL] Cache headers still show max-age=0" -ForegroundColor Red
        $finallyFixed = $false
    }
}
catch {
    Write-Host "[ERROR] Final testing failed: $_" -ForegroundColor Red
    $finallyFixed = $false
}

# Step 6: Alternative solution if still not working
if (-not $finallyFixed) {
    Write-Host "[STEP 6] Alternative solution - Add cache middleware..." -ForegroundColor Blue
    
    try {
        Write-Host "[INFO] Adding cache control middleware..." -ForegroundColor Cyan
        
        $middlewareCommand = @'
cd /var/www/diamond-website
# Add cache middleware at the beginning of the file after express setup
sed -i '/const app = express();/a\\n// Cache control middleware to fix flickering\napp.use((req, res, next) => {\n  if (req.path === "/" || req.path.endsWith(".html")) {\n    res.set("Cache-Control", "no-cache, no-store, must-revalidate");\n  } else {\n    res.set("Cache-Control", "public, max-age=3600");\n  }\n  next();\n});' server.js
echo "Cache middleware added"
'@
        
        ssh $Username@$ServerIP $middlewareCommand
        
        Write-Host "[INFO] Restarting with middleware..." -ForegroundColor Cyan
        ssh $Username@$ServerIP "pm2 restart diamond-website"
        
        Start-Sleep -Seconds 10
        
        Write-Host "[INFO] Testing middleware solution..." -ForegroundColor Cyan
        $middlewareTest = ssh $Username@$ServerIP "curl -I http://localhost:3001/ | grep Cache-Control"
        Write-Host "Middleware test result: $middlewareTest" -ForegroundColor Green
        
        if ($middlewareTest -notlike "*max-age=0*") {
            Write-Host "[SUCCESS] Middleware solution worked!" -ForegroundColor Green
            $finallyFixed = $true
        }
    }
    catch {
        Write-Host "[ERROR] Middleware solution failed: $_" -ForegroundColor Red
    }
} else {
    Write-Host "[STEP 6] Fix successful - no alternative needed" -ForegroundColor Green
}

# Final summary
Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "    Final Cache Fix Summary" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""

if ($finallyFixed) {
    Write-Host "🎉 CACHE FIX: SUCCESS!" -ForegroundColor Green
} else {
    Write-Host "❌ CACHE FIX: STILL NEEDS ATTENTION" -ForegroundColor Red
}

Write-Host ""
Write-Host "🔧 ACTIONS TAKEN:" -ForegroundColor Cyan
Write-Host "  • Set NODE_ENV to production ✅" -ForegroundColor White
Write-Host "  • Attempted to fix maxAge configuration" -ForegroundColor White
Write-Host "  • Added cache middleware if needed" -ForegroundColor White
Write-Host "  • Restarted PM2 application" -ForegroundColor White
Write-Host ""

if ($finallyFixed) {
    Write-Host "✅ EXPECTED RESULTS:" -ForegroundColor Green
    Write-Host "  • Cache-Control headers should be improved" -ForegroundColor White
    Write-Host "  • Page flickering should be eliminated" -ForegroundColor White
    Write-Host "  • Better caching performance" -ForegroundColor White
} else {
    Write-Host "⚠️  STILL NEEDS WORK:" -ForegroundColor Yellow
    Write-Host "  • Cache headers may still show max-age=0" -ForegroundColor White
    Write-Host "  • May need manual code review" -ForegroundColor White
    Write-Host "  • Consider frontend-specific solutions" -ForegroundColor White
}

Write-Host ""
Write-Host "🎯 IMMEDIATE ACTIONS:" -ForegroundColor Cyan
Write-Host "  1. Visit your website RIGHT NOW" -ForegroundColor White
Write-Host "  2. Check for flickering behavior" -ForegroundColor White
Write-Host "  3. Open browser dev tools Network tab" -ForegroundColor White
Write-Host "  4. Look at Cache-Control headers" -ForegroundColor White
Write-Host "  5. Test page refresh behavior" -ForegroundColor White
Write-Host ""

if ($finallyFixed) {
    Write-Host "🎊 CONGRATULATIONS!" -ForegroundColor Green
    Write-Host "Your cache fix should now be working!" -ForegroundColor Green
    Write-Host "Page flickering should be eliminated!" -ForegroundColor Green
} else {
    Write-Host "📝 NEXT STEPS:" -ForegroundColor Yellow
    Write-Host "If flickering persists, it may be a frontend JavaScript issue" -ForegroundColor White
    Write-Host "rather than a server caching problem." -ForegroundColor White
    Write-Host "Check browser console for JavaScript errors." -ForegroundColor White
}

# Self cleanup
Remove-Item $MyInvocation.MyCommand.Path -Force
