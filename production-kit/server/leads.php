<?php
// Team desk data. Team only.
//   GET  /api/leads.php                 → {leads, upsells}
//   POST /api/leads.php?action=update   {id, status?, contacted?}
//   POST /api/leads.php?action=delete   {id}

declare(strict_types=1);
require __DIR__ . '/lib.php';
require_staff();

$action = $_GET['action'] ?? '';

if (method() === 'GET') {
    $leads = db()->query('SELECT * FROM leads ORDER BY baby_due ASC, created_at ASC')->fetchAll();
    $ups = db()->query('SELECT * FROM upsells ORDER BY created_at ASC, id ASC')->fetchAll();
    send_json([
        'leads' => array_map('lead_out', $leads),
        'upsells' => array_map(fn($u) => [
            'id' => (int) $u['id'],
            'lead_id' => $u['lead_id'],
            'product' => $u['product'],
            'post_by' => $u['post_by'],
            'status' => $u['status'],
            'posted_on' => $u['posted_on'],
            'created_at' => mysql_to_iso($u['created_at']),
        ], $ups),
    ]);
}

$in = body();
$id = $in['id'] ?? '';
if (!is_uuid($id)) fail('Missing enquiry id.');

if ($action === 'update') {
    $sets = [];
    $vals = [];
    if (array_key_exists('status', $in)) {
        if (!in_array($in['status'], STATUSES, true)) fail('Unknown status.');
        $sets[] = 'status = ?';
        $vals[] = $in['status'];
    }
    if (array_key_exists('contacted', $in)) {
        $c = [];
        foreach (TEAM_KEYS as $k) {
            $v = $in['contacted'][$k] ?? null;
            if (is_string($v) && strlen($v) <= 40) $c[$k] = $v;
        }
        $sets[] = 'contacted = ?';
        $vals[] = json_encode((object) $c);
    }
    if (!$sets) fail('Nothing to change.');
    $vals[] = $id;
    db()->prepare('UPDATE leads SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($vals);
    send_json(['ok' => true]);
}

if ($action === 'delete') {
    db()->prepare('DELETE FROM leads WHERE id = ?')->execute([$id]);
    send_json(['ok' => true]);
}

fail('Unknown action.', 404);
