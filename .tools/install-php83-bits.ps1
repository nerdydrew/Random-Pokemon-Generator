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
$jobName = 'PHP83Download'

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

function Finalize-Install {
    param([string]$ArchivePath, [string]$ExpectedHash)

    if (-not (Test-ArchiveComplete -ArchivePath $ArchivePath -ExpectedHash $ExpectedHash)) {
        throw 'Downloaded archive failed final integrity verification'
    }

    if (Test-Path $extractDir) {
        Remove-Item $extractDir -Recurse -Force
    }

    Expand-Archive -Path $ArchivePath -DestinationPath $extractDir -Force

    if (-not (Test-Path $phpExe)) {
        throw 'php.exe not found after extraction'
    }

    if ((Test-Path $phpIniDev) -and -not (Test-Path $phpIni)) {
        Copy-Item $phpIniDev $phpIni -Force
    }

    & $phpExe -v
    if ($LASTEXITCODE -ne 0) {
        throw 'php.exe failed after extraction'
    }

    Write-Host 'PHP_INSTALL_OK'
}

New-Item -ItemType Directory -Force $toolsDir | Out-Null

$shaText = ((& curl.exe -fsSL $shaUrl) -join "`n")
$expectedHash = Get-ExpectedHash -ChecksumText $shaText -TargetFileName $fileName

if (Test-ArchiveComplete -ArchivePath $zipPath -ExpectedHash $expectedHash) {
    Finalize-Install -ArchivePath $zipPath -ExpectedHash $expectedHash
    exit 0
}

Import-Module BitsTransfer
$job = Get-BitsTransfer -Name $jobName -ErrorAction SilentlyContinue

if ($null -eq $job) {
    if (Test-Path $zipPath) {
        Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
    }
    Start-BitsTransfer -Source $downloadUrl -Destination $zipPath -DisplayName $jobName -Asynchronous | Out-Null
    Write-Host 'BITS_JOB_STARTED'
    exit 0
}

Write-Host ("BITS_STATE={0}" -f $job.JobState)
Write-Host ("BITS_PROGRESS={0}/{1}" -f $job.BytesTransferred, $job.BytesTotal)

switch ($job.JobState.ToString()) {
    'Transferred' {
        Complete-BitsTransfer -BitsJob $job
        Finalize-Install -ArchivePath $zipPath -ExpectedHash $expectedHash
        exit 0
    }
    'Error' {
        $errorText = $job | Format-List * | Out-String -Width 4096
        Remove-BitsTransfer -BitsJob $job -Confirm:$false
        throw ("BITS download failed:`n{0}" -f $errorText)
    }
    'TransientError' {
        Resume-BitsTransfer -BitsJob $job
        Write-Host 'BITS_RESUMED'
        exit 0
    }
    default {
        Write-Host 'BITS_IN_PROGRESS'
        exit 0
    }
}
