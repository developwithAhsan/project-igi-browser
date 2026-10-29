<?php
// Crash reports from the page (loader.js crashCheck: a start that finds the previous run's heartbeat, i.e. the
// browser killed the page and reloaded it). One JSON line per report, appended to igi_crash.log in the folder
// ABOVE the web root (not served). No addresses or names are stored. ?view=KEY prints the last 300 lines; the
// key is the content of igi_crash.key next to the log (no key file: no viewing).
header('Cache-Control: no-store');
$log = dirname(__DIR__) . '/igi_crash.log';
$keyFile = dirname(__DIR__) . '/igi_crash.key';

if (isset($_GET['view'])) {
    header('Content-Type: text/plain; charset=utf-8');
    $key = trim((string) @file_get_contents($keyFile));
    if ($key === '' || !hash_equals($key, (string) $_GET['view'])) { http_response_code(403); echo "no\n"; exit; }
    $lines = @file($log);
    if (!$lines) { echo "no reports yet\n"; exit; }
    echo count($lines) . " reports, last 300:\n";
    echo implode('', array_slice($lines, -300));
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); exit; }
$body = file_get_contents('php://input', false, null, 0, 4096);
$d = json_decode((string) $body, true);
if (!is_array($d)) { http_response_code(400); exit; }
if (@filesize($log) > 4000000) { http_response_code(204); exit; }   // never grow without bound
$row = array('at' => gmdate('Y-m-d H:i:s'));
foreach (array('v', 'ua', 'mem', 'cores', 'played', 'gap', 'mission', 'touch', 'bg', 'nav', 'screen') as $k) {
    if (!isset($d[$k])) continue;
    $row[$k] = is_string($d[$k]) ? substr($d[$k], 0, 300) : (is_numeric($d[$k]) ? $d[$k] + 0 : null);
}
@file_put_contents($log, json_encode($row) . "\n", FILE_APPEND | LOCK_EX);
http_response_code(204);
