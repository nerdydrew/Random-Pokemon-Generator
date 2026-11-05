$ErrorActionPreference = 'Stop'

$workspace = 'd:/Pokemon'
$toolsDir = Join-Path $workspace '.tools'
$zipPath = Join-Path $toolsDir 'php83.zip'
$extractDir = Join-Path $toolsDir 'php83'
$fileName = 'php-8.3.30-nts-Win32-vs16-x64.zip'
$baseUrl = 'https://downloads.php.net/~windows/releases'
$downloadUrl = "$baseUrl/$fileName"
$shaUrl = "$baseUrl/sha256sum.txt"
$phpExe = Join-Path $extractDir 'php.exe'
$phpIniDev = Join-Path $extractDir 'php.ini-development'
$phpIni = Join-Path $extractDir 'php.ini'

function Get-ExpectedHash {
    param([string]$ChecksumText, [string]$TargetFileName)

    foreach ($line in ($ChecksumText -split '\r?\n')) {

        if ($line -match ('^([a-fA-F0-9]{64})\s+\*?' + [regex]::Escape($TargetFileName) + '$')) {

            return $matches[1].ToLowerInvariant()
        }
    }

    throw "Could not find SHA256 for $TargetFileName"
}

function Test-ArchiveComplete {
    param([string]$ArchivePath, [string]$ExpectedHash)

    if (-not (Test-Path $ArchivePath)) {
        return $false
    }

    $actualHash = (Get-FileHash -Algorithm SHA256 -Path $ArchivePath).Hash.ToLowerInvariant()
    if ($actualHash -ne $ExpectedHash) {
        Write-Host "SHA256 mismatch. Expected $ExpectedHash but got $actualHash"
        return $false
    }

    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $archive = $null
    try {
        $archive = [System.IO.Compression.ZipFile]::OpenRead($ArchivePath)
        if ($archive.Entries.Count -le 0) {
            throw 'Zip archive has no entries'
        }
        return $true
    }
    catch {
        Write-Host ("Zip verification failed: {0}" -f $_.Exception.Message)
        return $false
    }
    finally {
        if ($archive -ne $null) {
            $archive.Dispose()
        }
    }
}

New-Item -ItemType Directory -Force $toolsDir | Out-Null

Write-Host 'Fetching remote checksums...'
$shaText = ((& curl.exe -fsSL $shaUrl) -join "`n")
if (-not $shaText) {

    throw 'Failed to download sha256sum.txt'
}
$expectedHash = Get-ExpectedHash -ChecksumText $shaText -TargetFileName $fileName
Write-Host ("Expected SHA256: {0}" -f $expectedHash)

$lastSize = -1
$stalledCount = 0
$completed = $false

for ($attempt = 1; $attempt -le 20; $attempt++) {
    $currentBytes = 0
    if (Test-Path $zipPath) {
        $currentBytes = (Get-Item $zipPath).Length
    }

    Write-Host ("Attempt {0}: current zip size = {1} bytes" -f $attempt, $currentBytes)

    if (Test-ArchiveComplete -ArchivePath $zipPath -ExpectedHash $expectedHash) {
        $completed = $true
        break
    }

    & curl.exe -L -C - --retry 3 --retry-delay 2 --connect-timeout 30 $downloadUrl -o $zipPath
    $curlExit = $LASTEXITCODE

    if (-not (Test-Path $zipPath)) {
        Write-Host ("curl exit {0}, zip not found yet" -f $curlExit)
        Start-Sleep -Seconds 2
        continue
    }

    $newSize = (Get-Item $zipPath).Length
    Write-Host ("After attempt {0}: {1} bytes (curl exit {2})" -f $attempt, $newSize, $curlExit)

    if (Test-ArchiveComplete -ArchivePath $zipPath -ExpectedHash $expectedHash) {
        $completed = $true
        break
    }

    if ($newSize -le $lastSize) {
        $stalledCount++
    }
    else {
        $stalledCount = 0
        $lastSize = $newSize
    }

    if ($stalledCount -ge 3) {
        Write-Host 'Download stalled with an invalid partial file. Removing and restarting...'
        Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
        $lastSize = -1
        $stalledCount = 0
    }

    Start-Sleep -Seconds 2
}

if (-not $completed) {
    throw 'Failed to download a complete and valid PHP archive after multiple attempts'
}

if (Test-Path $extractDir) {
    Remove-Item $extractDir -Recurse -Force
}

Write-Host 'Extracting archive...'
Expand-Archive -Path $zipPath -DestinationPath $extractDir -Force

if (-not (Test-Path $phpExe)) {
    throw 'php.exe not found after extraction'
}

if ((Test-Path $phpIniDev) -and -not (Test-Path $phpIni)) {
    Copy-Item $phpIniDev $phpIni -Force
}

Write-Host 'Verifying PHP executable...'
& $phpExe -v
$phpExit = $LASTEXITCODE
if ($phpExit -ne 0) {
    throw ("php.exe returned non-zero exit code: {0}" -f $phpExit)
}

Write-Host 'Installed PHP modules:'
& $phpExe -m

Write-Host 'PHP_INSTALL_OK'
