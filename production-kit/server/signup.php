<?php
// POST /api/signup.php — adds a sign-up from the form and emails the team.
// Anyone can call this. It can only ADD a sign-up, never read one.

declare(strict_types=1);
require __DIR__ . '/lib.php';

$in = body();

// Hidden "website" field: people never see or fill it; spam bots usually do.
if (!empty($in['website'])) send_json(['ok' => true]);

$id = $in['id'] ?? '';
if (!is_uuid($id)) fail('Missing sign-up id.');

$name = str_field($in, 'name', 200, true);
$email = str_field($in, 'email', 255, true);
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Please enter a valid email address.');
$phone = str_field($in, 'phone', 40);
$postcode = str_field($in, 'postcode', 12);
$baby_due = date_field($in, 'baby_due', true);
$delivery = date_field($in, 'delivery_date', true);
$notes = str_field($in, 'notes', 2000);
if (empty($in['consent'])) fail('Please tick that you are happy to be contacted.');
$package_id = is_uuid($in['package_id'] ?? null) ? $in['package_id'] : null;

// "team" is only accepted from a signed-in team member.
$source = (($in['source'] ?? '') === 'team' && current_staff()) ? 'team' : 'form';

$st = db()->prepare(
    'INSERT IGNORE INTO leads
       (id, created_at, name, email, phone, postcode, baby_due, delivery_date, package_id,
        subscribe, notes, consent, source, saved_offline, status, contacted)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,1,?,?,\'new\',\'{}\')'
);
$st->execute([
    $id, iso_to_mysql($in['created_at'] ?? null), $name, $email, $phone, $postcode, $baby_due, $delivery,
    $package_id, empty($in['subscribe']) ? 0 : 1, $notes, $source, empty($in['saved_offline']) ? 0 : 1,
]);

// Already received on an earlier attempt (e.g. an offline re-send): nothing more to do.
if ($st->rowCount() === 0) send_json(['ok' => true, 'duplicate' => true]);

// ---------- email the team ----------
$settings = settings_row();
$to = array_values(array_filter(
    array_map(fn($k) => $settings['team'][$k] ?? '', TEAM_KEYS),
    fn($e) => $e && filter_var($e, FILTER_VALIDATE_EMAIL)
));

if ($to) {
    $pkgName = 'Not chosen';
    if ($package_id) {
        $p = db()->prepare('SELECT name FROM packages WHERE id = ?');
        $p->execute([$package_id]);
        $pkgName = $p->fetchColumn() ?: $pkgName;
    }
    $fmt = fn(string $d) => (new DateTime($d))->format('j M Y');
    $rows = [
        'Name' => $name,
        'Email' => $email,
        'Phone' => $phone ?: '—',
        'Postcode' => $postcode ?: '—',
        'Baby due' => $fmt($baby_due),
        'Deliver products by' => $fmt($delivery),
        'Package' => $pkgName . (empty($in['subscribe']) ? '' : ' (wants a subscription)'),
        'Notes' => $notes ?: '—',
        'Came from' => $source === 'team' ? 'Entered by the team' : 'Sign-up form',
    ];
    $text = "A new sign-up has come in.\n\n";
    foreach ($rows as $k => $v) $text .= "$k: $v\n";
    $text .= "\nTick who has made contact on the team desk so nobody doubles up.\n";

    $from = $CONFIG['mail_from'];
    $fromName = $CONFIG['mail_from_name'] ?? 'Sign-ups';
    // Strip line breaks from anything that goes into an email header.
    $clean = fn(string $s) => trim(preg_replace('/[\r\n]+/', ' ', $s));
    $subject = '=?UTF-8?B?' . base64_encode($clean("New sign-up: $name (due {$fmt($baby_due)})")) . '?=';
    $headers = [
        'From' => '=?UTF-8?B?' . base64_encode($fromName) . "?= <$from>",
        'Reply-To' => $clean($email),
        'MIME-Version' => '1.0',
        'Content-Type' => 'text/plain; charset=UTF-8',
        'Content-Transfer-Encoding' => '8bit',
    ];
    $sent = @mail(implode(',', $to), $subject, $text, $headers, '-f' . $from);
    if ($sent) {
        db()->prepare('UPDATE leads SET team_emailed_at = UTC_TIMESTAMP() WHERE id = ?')->execute([$id]);
    } else {
        error_log("Team email failed for lead $id");
    }
}

send_json(['ok' => true]);
