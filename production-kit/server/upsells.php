<?php
// Products to post out (upsells). Team only.
//   POST /api/upsells.php?action=add      {lead_id, product, post_by}
//   POST /api/upsells.php?action=posted   {id, posted: true|false}
//   POST /api/upsells.php?action=delete   {id}

declare(strict_types=1);
require __DIR__ . '/lib.php';
require_staff();

$action = $_GET['action'] ?? '';
$in = body();

if ($action === 'add') {
    $lead = $in['lead_id'] ?? '';
    if (!is_uuid($lead)) fail('Missing enquiry id.');
    $product = str_field($in, 'product', 200, true);
    $postBy = date_field($in, 'post_by');
    db()->prepare('INSERT INTO upsells (lead_id, product, post_by) VALUES (?, ?, ?)')->execute([$lead, $product, $postBy]);
    send_json(['ok' => true, 'id' => (int) db()->lastInsertId()]);
}

$id = (int) ($in['id'] ?? 0);
if ($id <= 0) fail('Missing product id.');

if ($action === 'posted') {
    $posted = !empty($in['posted']);
    db()->prepare('UPDATE upsells SET status = ?, posted_on = ? WHERE id = ?')
        ->execute([$posted ? 'posted' : 'to_post', $posted ? gmdate('Y-m-d') : null, $id]);
    send_json(['ok' => true]);
}

if ($action === 'delete') {
    db()->prepare('DELETE FROM upsells WHERE id = ?')->execute([$id]);
    send_json(['ok' => true]);
}

fail('Unknown action.', 404);
