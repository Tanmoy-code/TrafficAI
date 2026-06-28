@echo off
echo ==================================================
echo   Starting Traffic Detection Java Backend (Port 5000)
echo ==================================================

if not exist "bin" mkdir bin

set JAVAC_CMD=javac
set JAVA_CMD=java

if exist "C:\Program Files\Java\jdk-17\bin\javac.exe" (
    set JAVAC_CMD="C:\Program Files\Java\jdk-17\bin\javac.exe"
    set JAVA_CMD="C:\Program Files\Java\jdk-17\bin\java.exe"
)

echo Compiling Java Server...
%JAVAC_CMD% -d bin src\main\java\com\traffic\backend\TrafficDetectionServer.java

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Compilation failed.
    pause
    exit /b %ERRORLEVEL%
)

echo Starting Server on Port 5000...
%JAVA_CMD% -cp bin com.traffic.backend.TrafficDetectionServer
