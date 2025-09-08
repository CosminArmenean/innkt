# PowerShell script to run tests for innkt.react frontend
param(
    [string]$TestPattern = "",
    [string]$TestPath = "",
    [switch]$Coverage = $false,
    [switch]$Watch = $false,
    [switch]$Verbose = $false,
    [switch]$UpdateSnapshots = $false,
    [switch]$ClearCache = $false
)

Write-Host "🧪 Running innkt.react Frontend Tests" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# Set test parameters
$testParams = @("test")

if ($TestPattern) {
    $testParams += "--testNamePattern", $TestPattern
}

if ($TestPath) {
    $testParams += "--testPathPattern", $TestPath
}

if ($Coverage) {
    $testParams += "--coverage"
}

if ($Watch) {
    $testParams += "--watch"
}

if ($Verbose) {
    $testParams += "--verbose"
}

if ($UpdateSnapshots) {
    $testParams += "--updateSnapshot"
}

if ($ClearCache) {
    $testParams += "--clearCache"
}

# Run the tests
Write-Host "📋 Test Parameters:" -ForegroundColor Yellow
Write-Host "  Pattern: $TestPattern" -ForegroundColor White
Write-Host "  Path: $TestPath" -ForegroundColor White
Write-Host "  Coverage: $Coverage" -ForegroundColor White
Write-Host "  Watch: $Watch" -ForegroundColor White
Write-Host "  Verbose: $Verbose" -ForegroundColor White
Write-Host "  Update Snapshots: $UpdateSnapshots" -ForegroundColor White
Write-Host "  Clear Cache: $ClearCache" -ForegroundColor White
Write-Host ""

try {
    Write-Host "🚀 Starting test execution..." -ForegroundColor Cyan
    
    if ($ClearCache) {
        Write-Host "🧹 Clearing Jest cache..." -ForegroundColor Yellow
        & npm test -- --clearCache
    }
    
    & npm test $testParams
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ All tests passed!" -ForegroundColor Green
        
        if ($Coverage) {
            Write-Host "📊 Coverage report generated in coverage/ directory" -ForegroundColor Yellow
            Write-Host "   Open coverage/lcov-report/index.html to view detailed coverage" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Some tests failed!" -ForegroundColor Red
        exit $LASTEXITCODE
    }
} catch {
    Write-Host "💥 Error running tests: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Test execution completed!" -ForegroundColor Green
