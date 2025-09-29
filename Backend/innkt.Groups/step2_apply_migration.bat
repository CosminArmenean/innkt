@echo off
echo Step 2: Applying new migration...
echo.

cd "C:\Users\cosmi\source\repos\innkt\Backend\innkt.Groups"

echo Running: dotnet ef database update
dotnet ef database update

echo.
echo ✅ Migration should now work!
echo ✅ The Groups service should start without errors!
pause
