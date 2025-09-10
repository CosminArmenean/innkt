@echo off
echo 🚀 Starting INNKT Platform - Complete Infrastructure & Services
echo =================================================================

echo.
echo 🗄️  Starting Infrastructure Components...

echo Checking PostgreSQL...
netstat -an | findstr :5432 >nul
if %errorlevel% neq 0 (
    echo Starting PostgreSQL...
    net start postgresql-x64-14 2>nul
    timeout /t 5 /nobreak >nul
) else (
    echo ✅ PostgreSQL is already running
)

echo Checking MongoDB...
netstat -an | findstr :27017 >nul
if %errorlevel% neq 0 (
    echo Starting MongoDB...
    net start MongoDB 2>nul
    timeout /t 5 /nobreak >nul
) else (
    echo ✅ MongoDB is already running
)

echo Checking Redis...
netstat -an | findstr :6379 >nul
if %errorlevel% neq 0 (
    echo Starting Redis...
    start "Redis" cmd /k "redis-server"
    timeout /t 5 /nobreak >nul
) else (
    echo ✅ Redis is already running
)

echo.
echo 📦 Starting Backend Services...

echo Starting Officer Service (Identity) on port 8080...
start "Officer Service" cmd /k "cd Backend\innkt.Officer && dotnet run"
timeout /t 8 /nobreak >nul

echo Starting Social Service (Posts & Groups) on port 8081...
start "Social Service" cmd /k "cd Backend\innkt.Social && dotnet run"
timeout /t 8 /nobreak >nul

echo Starting NeuroSpark Service (AI & Search) on port 5003...
start "NeuroSpark Service" cmd /k "cd Backend\innkt.NeuroSpark\innkt.NeuroSpark && dotnet run"
timeout /t 8 /nobreak >nul

echo Starting Messaging Service (Chat) on port 3000...
start "Messaging Service" cmd /k "cd Backend\innkt.Messaging && npm start"
timeout /t 8 /nobreak >nul

echo Starting Seer Service (Video Calls) on port 5267...
start "Seer Service" cmd /k "cd Backend\innkt.Seer && dotnet run"
timeout /t 8 /nobreak >nul

echo Starting Frontier Service (API Gateway) on port 51303...
start "Frontier Service" cmd /k "cd Backend\innkt.Frontier && dotnet run"
timeout /t 8 /nobreak >nul

echo.
echo 🌐 Starting Frontend...

echo Starting React UI on port 3001...
start "React UI" cmd /k "cd Frontend\innkt.react && set PORT=3001 && npm start"

echo.
echo 🎉 Complete INNKT Platform Started!
echo =================================================================
echo Infrastructure:
echo • PostgreSQL Database:     localhost:5432
echo • MongoDB Database:        localhost:27017
echo • Redis Cache:             localhost:6379
echo.
echo Backend Services:
echo • Officer Service (Identity):     http://localhost:8080
echo • Social Service (Posts/Groups):  http://localhost:8081
echo • NeuroSpark Service (AI):        http://localhost:5003
echo • Messaging Service (Chat):       http://localhost:3000
echo • Seer Service (Video Calls):     http://localhost:5267
echo • Frontier Service (API Gateway): http://localhost:51303
echo.
echo Frontend:
echo • React UI:                       http://localhost:3001
echo.
echo 🔗 API Gateway Routes:
echo • All services accessible through: http://localhost:51303
echo.
echo 💡 Note: Services are running in separate command windows
echo 💡 Check individual windows for any error messages
echo 💡 Use the API Gateway for end-to-end testing
echo.
pause
