param([ValidateSet('start', 'stop', 'status')][string]$Action = 'status')

$root = Join-Path $env:LOCALAPPDATA 'unica-postgres'
$data = Join-Path $root 'data'
$bin = Join-Path $root 'pgsql\bin'
$log = Join-Path $root 'server.log'

if ($data -like '*Program Files*' -or $data -like '*Program Files (x86)*') {
  throw 'Refusing to touch a PostgreSQL install outside the UNICA local folder.'
}

$pgctl = Join-Path $bin 'pg_ctl.exe'
if (-not (Test-Path $pgctl)) {
  throw "PostgreSQL binaries not found at $pgctl"
}

if ($Action -eq 'start') {
  & $pgctl -D $data -l $log -w start
} else {
  & $pgctl -D $data $Action
}
exit $LASTEXITCODE
