@echo off
cd /d "C:\Users\cosmi\source\repos\innkt\Frontend\innkt.react\build"
echo Starting server on http://localhost:3001
echo Press Ctrl+C to stop
python -m http.server 3001
