# Fires the game's generated artwork with design/kiln-viewer.html in headless Edge
# and writes the PNGs into assets/. Run from the project folder:  pwsh design/fire-assets.ps1
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$viewer = 'file:///' + ((Join-Path $PSScriptRoot 'kiln-viewer.html') -replace '\\', '/' -replace ' ', '%20')
$jobs = @(
  @{ mode = 'oracle'; seed = 7;    out = 'assets/back-oracle.png' },
  @{ mode = 'agora';  seed = 403;  out = 'assets/back-agora.png' },
  @{ mode = 'table';  seed = 530;  out = 'assets/table.png' },
  @{ mode = 'clay';   seed = 12;   out = 'assets/clay.png' },
  @{ mode = 'glaze';  seed = 21;   out = 'assets/glaze.png' }
)
foreach ($j in $jobs) {
  $url = "$viewer`?export=$($j.mode)&seed=$($j.seed)"
  $dom = & $edge --headless --disable-gpu --allow-file-access-from-files --virtual-time-budget=20000 --dump-dom $url 2>$null | Out-String
  $m = [regex]::Match($dom, 'data:image/png;base64,([A-Za-z0-9+/=]+)')
  if (-not $m.Success) { throw "No image came back for $($j.mode)" }
  [IO.File]::WriteAllBytes((Join-Path $root $j.out), [Convert]::FromBase64String($m.Groups[1].Value))
  Write-Output "fired $($j.out)"
}
