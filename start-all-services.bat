@echo off
echo 🚀 Starting INNKT Platform - All Services
echo ===============================================

echo.
echo 📦 Starting Backend Services...

echo Starting Officer Service (Identity) on port 8080...
start "Officer Service" cmd /k "cd Backend\innkt.Officer && dotnet run"
timeout /t 5 /nobreak >nul

echo Starting Social Service (Posts & Groups) on port 8081...
start "Social Service" cmd /k "cd Backend\innkt.Social && dotnet run"
timeout /t 5 /nobreak >nul

echo Starting NeuroSpark Service (AI & Search) on port 5003...
start "NeuroSpark Service" cmd /k "cd Backend\innkt.NeuroSpark\innkt.NeuroSpark && dotnet run"
timeout /t 5 /nobreak >nul

echo Starting Messaging Service (Chat) on port 3000...
start "Messaging Service" cmd /k "cd Backend\innkt.Messaging && npm start"
timeout /t 5 /nobreak >nul

echo Starting Seer Service (Video Calls) on port 5267...
start "Seer Service" cmd /k "cd Backend\innkt.Seer && dotnet run"
timeout /t 5 /nobreak >nul

echo Starting Frontier Service (API Gateway) on port 51303...
start "Frontier Service" cmd /k "cd Backend\innkt.Frontier && dotnet run"
timeout /t 5 /nobreak >nul

echo.
echo 🌐 Starting Frontend...

echo Starting React UI on port 3001...
start "React UI" cmd /k "cd Frontend\innkt.react && set PORT=3001 && npm start"

echo.
echo 🎉 All services started!
echo ===============================================
echo Service URLs:
echo • Officer Service (Identity):     http://localhost:8080
echo • Social Service (Posts/Groups):  http://localhost:8081
echo • NeuroSpark Service (AI):        http://localhost:5003
echo • Messaging Service (Chat):       http://localhost:3000
echo • Seer Service (Video Calls):     http://localhost:5267
echo • Frontier Service (API Gateway): http://localhost:51303
echo • React UI:                       http://localhost:3001
echo.
echo 💡 Note: Services are running in separate command windows
echo 💡 Check individual windows for any error messages
echo.
pause
