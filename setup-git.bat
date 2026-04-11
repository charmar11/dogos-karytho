@echo off
chcp 65001 >nul
title Configurar Git - Dogos Karytho

echo ============================================
echo    CONFIGURAR REPOSITORIO GIT
echo ============================================
echo.
echo Este script configura el remote de Git
echo para poder subir cambios a GitHub
echo.

cd /d "%~dp0"

echo Ingresa la URL de tu repositorio GitHub
echo (ejemplo: https://github.com/usuario/dogos-karytho.git)
echo.
set /p REPO_URL="URL del repositorio: "

if "%REPO_URL%"=="" (
    echo ERROR: Debes ingresar una URL
    pause
    exit /b 1
)

echo.
echo Configurando remote...
git remote remove origin >nul 2>&1
git remote add origin "%REPO_URL%"

echo.
git remote -v
echo.

echo ============================================
echo    CONFIGURADO!
echo ============================================
echo.
echo Ahora puedes ejecutar deploy.bat para
echo subir cambios a GitHub
echo.
pause
