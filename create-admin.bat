@echo off
REM Create admin user script
REM Usage: create-admin.bat <email> <password> [firstName] [lastName]

REM Check if at least email and password are provided
if "%~1"=="" goto usage
if "%~2"=="" goto usage

REM Run the Node.js script with provided arguments
node ./scripts/create-admin.js %1 %2 %~3 %~4
goto end

:usage
echo Usage: create-admin.bat ^<email^> ^<password^> [firstName] [lastName]
exit /b 1

:end
