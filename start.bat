@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
if errorlevel 1 exit /b 1
title OZON x CDEK

:menu
echo.
echo ===== OZON x CDEK =====
echo 1. Запустить проект в браузере
echo 2. Собрать проект
echo 3. Открыть собранный сайт
echo 4. Установить / переустановить зависимости
echo 5. Собрать и опубликовать на VPS
echo 6. Собрать и опубликовать на GitHub Pages
echo 7. Отправить исходники в GitHub
echo 8. Собрать и обновить сайт на VPS без перезапуска сервиса
echo 0. Выход
echo.
choice /c 123456780 /n /m "Выберите действие: "
if errorlevel 9 exit /b 0
if errorlevel 8 goto deploy_static
if errorlevel 7 goto github
if errorlevel 6 goto pages
if errorlevel 5 goto deploy
if errorlevel 4 goto install
if errorlevel 3 goto preview
if errorlevel 2 goto build
if errorlevel 1 goto dev
exit /b 1

:dev
call :dependencies
if errorlevel 1 goto failed
echo Для остановки сервера нажмите Ctrl+C.
call npm run dev -- --open
goto result

:build
call :dependencies
if errorlevel 1 goto failed
call npm run build
goto result

:preview
call :dependencies
if errorlevel 1 goto failed
if exist "dist\index.html" goto preview_ready
call npm run build
if errorlevel 1 goto failed
:preview_ready
echo Для остановки сервера нажмите Ctrl+C.
call npm run preview -- --open
goto result

:install
call :node
if errorlevel 1 goto failed
call npm ci
goto result

:deploy
call :dependencies
if errorlevel 1 goto failed
call npm run build
if errorlevel 1 goto failed
call npm run deploy:vps
goto result

:pages
call :git
if errorlevel 1 goto failed
call :dependencies
if errorlevel 1 goto failed
call npm run deploy:pages
goto result

:github
call :git
if errorlevel 1 goto failed
git status --short
if errorlevel 1 goto failed
echo.
echo Будут добавлены все изменения, кроме файлов из .gitignore,
echo создан коммит и отправлена текущая ветка в origin на GitHub.
choice /c YN /n /m "Продолжить? [Y/N]: "
if errorlevel 2 goto menu
if errorlevel 1 goto github_confirmed
goto failed
:github_confirmed
git add --all
if errorlevel 1 goto failed
git diff --cached --quiet
if errorlevel 2 goto failed
if errorlevel 1 goto github_commit
echo Новых изменений для коммита нет. Отправляем существующие коммиты.
goto github_push
:github_commit
git commit -m "Update OZON CDEK project"
if errorlevel 1 goto failed
:github_push
git push -u origin HEAD
goto result

:deploy_static
call :dependencies
if errorlevel 1 goto failed
call npm run build
if errorlevel 1 goto failed
call npm run deploy:static
goto result

:result
if errorlevel 1 goto failed
echo.
echo Готово.
pause
goto menu

:failed
echo.
echo Действие остановлено из-за ошибки. Подробности указаны выше.
pause
goto menu

:dependencies
call :node
if errorlevel 1 exit /b 1
if exist "node_modules\.bin\vite.cmd" exit /b 0
echo Устанавливаем зависимости...
call npm ci
exit /b %errorlevel%

:node
where node >nul 2>&1
if errorlevel 1 (
    echo Установите Node.js 22.12+ и заново откройте start.bat.
    exit /b 1
)
node -e "const [major,minor]=process.versions.node.split('.').map(Number); process.exit(major>22 || major===22 && minor>=12 ? 0 : 1)"
if errorlevel 1 (
    echo Требуется Node.js 22.12 или новее.
    exit /b 1
)
where npm >nul 2>&1
if errorlevel 1 (
    echo npm не найден. Переустановите Node.js с npm.
    exit /b 1
)
exit /b 0

:git
where git >nul 2>&1
if errorlevel 1 (
    echo Установите Git for Windows и заново откройте start.bat.
    exit /b 1
)
git status --porcelain >nul
if errorlevel 1 (
    echo Git не может прочитать репозиторий. Публикация остановлена.
    exit /b 1
)
git remote get-url origin
if errorlevel 1 (
    echo В репозитории не настроен удалённый адрес origin.
    exit /b 1
)
exit /b 0
