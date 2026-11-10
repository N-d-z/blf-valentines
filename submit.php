<?php
/*
 * Waitlist handler for cPanel / any PHP host.
 * Saves each sign-up as a row in data/waitlist.csv (that folder is blocked from public access).
 * To use it, set  formEndpoint: "submit.php"  in assets/js/config.js.
 * Does NOT run on Vercel (no PHP there) — use Formspree or Google Sheets instead.
 */
header('Content-Type: application/json');
date_default_timezone_set('Africa/Lagos');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'POST only']);
    exit;
}

// Spam trap
if (!empty($_POST['company'])) { echo json_encode(['ok' => true]); exit; }

function field($k, $max = 500) {
    $v = isset($_POST[$k]) ? trim((string) $_POST[$k]) : '';
    $v = preg_replace('/[\r\n\t]+/', ' ', $v);
    if (preg_match('/^[=+\-@]/', $v)) $v = "'" . $v; // stop spreadsheet formula injection
    return mb_substr($v, 0, $max);
}

$row = [
    date('c'),
    field('name', 120),
    field('email', 160),
    field('phone', 40),
    field('type', 30),
    field('partner', 120),
    field('notes', 1000),
];

$allowedTypes = ['Single', 'Married Couple', 'Engaged'];
if (strlen($row[1]) < 2 || !filter_var($row[2], FILTER_VALIDATE_EMAIL) || strlen(preg_replace('/\D/', '', $row[3])) < 7 || !in_array($row[4], $allowedTypes, true)) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Missing or invalid fields']);
    exit;
}

$dir = __DIR__ . '/data';
if (!is_dir($dir)) mkdir($dir, 0750, true);
$file = $dir . '/waitlist.csv';
$isNew = !file_exists($file);

$fh = fopen($file, 'a');
if (!$fh) { http_response_code(500); echo json_encode(['ok' => false, 'error' => 'Could not save']); exit; }
flock($fh, LOCK_EX);
if ($isNew) fputcsv($fh, ['Submitted', 'Name', 'Email', 'Phone/WhatsApp', 'Attending as', 'Partner', 'Notes']);
fputcsv($fh, $row);
flock($fh, LOCK_UN);
fclose($fh);

echo json_encode(['ok' => true]);
