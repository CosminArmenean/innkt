# 🚨 **CRITICAL POWERSHELL NAVIGATION RULE**

## **ALWAYS FOLLOW THESE STEPS:**

1. **Check current directory**: `Get-Location`
2. **Navigate to correct directory**: `cd Backend/innkt.Officer`
3. **Verify you're in the right place**: `Get-Location`
4. **Then run the command**: `dotnet run`

## **NEVER:**
- Use `&&` in PowerShell (it doesn't work)
- Run commands without checking directory first
- Assume you're in the right directory

## **ALWAYS:**
- Split commands into separate steps
- Check directory before running
- Verify the service is in the correct folder
