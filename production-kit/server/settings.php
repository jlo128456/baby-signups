<?php
// Team emails, Shopify store and packages. Team only.
//   GET  /api/settings.php   → {team, shop_domain}
//   POST /api/settings.php   {team, shop_domain, packages: [...]}

declare(strict_types=1);
require __DIR__ . '/lib.php';
require_staff();

if (method() === 'GET') send_json(settings_row());

$in = body();

$team = [];
foreach (TEAM_KEYS as $k) {
    $e = trim((string) ($in['team'][$k] ?? ''));
    if ($e !== '' && !filter_var($e, FILTER_VALIDATE_EMAIL)) fail("The email address for " . ucfirst($k) . " doesn't look right.");
    $team[$k] = $e;
}
$shop = preg_replace('#^https?://#', '', rtrim(str_field($in, 'shop_domain', 255), '/'));

/** Where customers are sent: the product link if given, otherwise a cart link from the variant ID. */
function checkout_url(string $url, string $variant, string $shop): string
{
    if ($url !== '') return preg_match('#^https?://#', $url) ? $url : 'https://' . $url;
    if ($variant !== '' && $shop !== '') return 'https://' . $shop . '/cart/' . rawurlencode($variant) . ':1';
    return '';
}

$pdo = db();
$pdo->beginTransaction();
try {
    $pdo->prepare('UPDATE settings SET team = ?, shop_domain = ? WHERE id = 1')->execute([json_encode($team), $shop]);

    $keep = [];
    $up = $pdo->prepare(
        'INSERT INTO packages (id, name, price, cadence, description, shopify_url, shopify_variant, checkout_url, active, sort)
         VALUES (?,?,?,?,?,?,?,?,1,?)
         ON DUPLICATE KEY UPDATE name=VALUES(name), price=VALUES(price), cadence=VALUES(cadence),
           description=VALUES(description), shopify_url=VALUES(shopify_url), shopify_variant=VALUES(shopify_variant),
           checkout_url=VALUES(checkout_url), active=1, sort=VALUES(sort)'
    );
    $i = 0;
    foreach (($in['packages'] ?? []) as $p) {
        if (!is_array($p) || !is_uuid($p['id'] ?? null)) continue;
        $name = str_field($p, 'name', 150);
        if ($name === '') continue;
        $url = str_field($p, 'shopify_url', 500);
        $variant = str_field($p, 'shopify_variant', 50);
        $up->execute([
            $p['id'], $name, str_field($p, 'price', 50), str_field($p, 'cadence', 50) ?: 'One-off',
            str_field($p, 'description', 500), $url, $variant, checkout_url($url, $variant, $shop), $i++,
        ]);
        $keep[] = $p['id'];
    }
    // Removed packages are hidden, not deleted, so past enquiries keep the package name.
    if ($keep) {
        $marks = implode(',', array_fill(0, count($keep), '?'));
        $pdo->prepare("UPDATE packages SET active = 0 WHERE id NOT IN ($marks)")->execute($keep);
    } else {
        $pdo->exec('UPDATE packages SET active = 0');
    }
    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    error_log('Settings save failed: ' . $e->getMessage());
    fail("Settings didn't save. Try again.", 500);
}

send_json(['ok' => true]);
