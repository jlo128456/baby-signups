<?php
// One-off tool for creating team logins (or resetting a password).
//
// 1. In config.php set 'setup_key' to a long random phrase.
// 2. Visit https://yourdomain/api/add-staff.php in a browser and fill in the form.
// 3. When everyone is added, set 'setup_key' back to '' (this page then switches itself off).

declare(strict_types=1);
require __DIR__ . '/lib.php';

header('Content-Type: text/html; charset=utf-8');
header('X-Robots-Tag: noindex');
$key = (string) ($CONFIG['setup_key'] ?? '');
$h = fn($s) => htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');

if (strlen($key) < 12) {
    http_response_code(403);
    exit('<p>This page is switched off. To use it, set a setup_key of at least 12 characters in config.php.</p>');
}

$msg = '';
if (method() === 'POST') {
    if (!hash_equals($key, (string) ($_POST['setup_key'] ?? ''))) {
        $msg = 'The setup key is wrong.';
    } else {
        $name = trim((string) ($_POST['name'] ?? ''));
        $email = trim((string) ($_POST['email'] ?? ''));
        $pass = (string) ($_POST['password'] ?? '');
        if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) $msg = 'Enter a name and a valid email.';
        elseif (strlen($pass) < 10) $msg = 'Use a password of at least 10 characters.';
        else {
            db()->prepare(
                'INSERT INTO staff (name, email, password_hash) VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE name = VALUES(name), password_hash = VALUES(password_hash)'
            )->execute([$name, $email, password_hash($pass, PASSWORD_DEFAULT)]);
            $msg = "Saved. $name can now sign in as $email.";
        }
    }
}
$list = db()->query('SELECT name, email FROM staff ORDER BY name')->fetchAll();
?><!doctype html>
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Add team login</title>
<style>body{font:16px system-ui,sans-serif;max-width:420px;margin:40px auto;padding:0 16px}label{display:block;margin:12px 0 4px;font-weight:600}input{width:100%;padding:10px;font-size:16px;box-sizing:border-box}button{margin-top:16px;padding:10px 18px;font-size:16px}p.m{background:#E3EEE9;padding:10px}</style>
<h1>Add a team login</h1>
<?php if ($msg): ?><p class="m"><?= $h($msg) ?></p><?php endif; ?>
<form method="post" autocomplete="off">
  <label for="k">Setup key (from config.php)</label><input id="k" name="setup_key" type="password">
  <label for="n">Name</label><input id="n" name="name" placeholder="Amanda">
  <label for="e">Email</label><input id="e" name="email" type="email">
  <label for="p">Password (10+ characters)</label><input id="p" name="password" type="password">
  <button type="submit">Save login</button>
</form>
<h2>Current team</h2>
<ul><?php foreach ($list as $s): ?><li><?= $h($s['name']) ?> — <?= $h($s['email']) ?></li><?php endforeach; ?></ul>
<p>Finished? Set setup_key back to '' in config.php.</p>
