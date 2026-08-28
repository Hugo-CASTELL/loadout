$ErrorActionPreference = "Stop"

$OUTPUT = "loadouts_shared_generated.ts"
$BACKEND_DIR = "..\backend\src\utils"
$FRONTEND_DIR = "..\frontend\src\lib"

# Generate the file
$content = @"
// Generated the $(Get-Date -Format 'dd/MM/yy')

"@

Get-ChildItem -Filter *.ts | Where-Object { $_.Name -ne $OUTPUT } | ForEach-Object {
    $content += "// ===== $($_.Name) =====`n"
    $content += (Get-Content $_.FullName -Raw) + "`n`n"
}

$content | Out-File -FilePath $OUTPUT -Encoding utf8

# Create destination directories if necessary
if (-not (Test-Path $BACKEND_DIR)) { New-Item -ItemType Directory -Path $BACKEND_DIR | Out-Null }
if (-not (Test-Path $FRONTEND_DIR)) { New-Item -ItemType Directory -Path $FRONTEND_DIR | Out-Null }

# Copy the generated file
Copy-Item -Path $OUTPUT -Destination "$BACKEND_DIR\$OUTPUT"
Copy-Item -Path $OUTPUT -Destination "$FRONTEND_DIR\$OUTPUT"

# Remove the generated file from the current directory
Remove-Item -Path $OUTPUT

Write-Host "Generated and copied $OUTPUT successfully."