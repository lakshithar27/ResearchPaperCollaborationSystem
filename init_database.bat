@echo off
echo ============================================================
echo   Initializing ResearchPaperDB in MySQL 8.0...
echo ============================================================
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root --password=Mithun@123 -e "source %~dp0researchhub_database.sql"
echo Database initialization completed!
pause
