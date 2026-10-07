<?php
// Team sign-in.
//   GET  /api/auth.php                 → who is signed in ({staff: null} if nobody)
//   POST /api/auth.php?action=login    {email, password}
//   POST /api/auth.php?action=logout

declare(strict_types=1);
require __DIR__ . '/lib.php';

$action = $_GET['action'] ?? '';

if (method() === 'GET') {
    send_json(['staff' => current_staff()]);
}

if ($action === 'login') {
    $in = body();
    $email = str_field($in, 'email', 255, true);
    $password = isset($in['password']) && is_string($in['password']) ? $in['password'] : '';

    start_session();
    // Slow down password guessing: at most 10 tries per 15 minutes per browser session.
    $now = time();
    $tries = array_filter($_SESSION['login_tries'] ?? [], fn($t) => $t > $now - 900);
    if (count($tries) >= 10) fail('Too many attempts. Wait 15 minutes and try again.', 429);

    $st = db()->prepare('SELECT id, name, email, password_hash FROM staff WHERE email = ?');
    $st->execute([$email]);
    $row = $st->fetch();

    if (!$row || !password_verify($password, $row['password_hash'])) {
        $tries[] = $now;
        $_SESSION['login_tries'] = array_values($tries);
        usleep(400000);
        fail("That email and password don't match a team account.", 401);
    }

    session_regenerate_id(true);
    $_SESSION['staff_id'] = (int) $row['id'];
    unset($_SESSION['login_tries']);
    send_json(['staff' => ['id' => (int) $row['id'], 'name' => $row['name'], 'email' => $row['email']]]);
}

if ($action === 'logout') {
    body();
    start_session();
    $_SESSION = [];
    session_destroy();
    send_json(['ok' => true]);
}

fail('Unknown action.', 404);
