<?php
// GET /api/packages.php — packages shown on the sign-up form.
// Customers see active packages; signed-in team also get removed ones (so old enquiries keep their package name).

declare(strict_types=1);
require __DIR__ . '/lib.php';

$staff = current_staff();
$sql = $staff
    ? 'SELECT * FROM packages ORDER BY sort ASC, created_at ASC'
    : 'SELECT * FROM packages WHERE active = 1 ORDER BY sort ASC, created_at ASC';
send_json(['packages' => array_map('package_out', db()->query($sql)->fetchAll())]);
