<?php
// Shared helpers for every API file: settings, database, sessions, JSON in and out.

declare(strict_types=1);

error_reporting(E_ALL);
ini_set('display_errors', '0'); // never show PHP errors to visitors

$CONFIG_FILE = __DIR__ . '/config.php';
if (!file_exists($CONFIG_FILE)) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'The API is not set up yet: copy config.sample.php to config.php.']);
    exit;
}
$CONFIG = require $CONFIG_FILE;

const TEAM_KEYS = ['amanda', 'laura', 'richard'];
const STATUSES = ['new', 'contacted', 'subscribed', 'closed'];

// ---------- responses ----------
function send_json($data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fail(string $message, int $status = 400): void
{
    send_json(['error' => $message], $status);
}

// ---------- requests ----------
function cors(): void
{
    global $CONFIG;
    $origin = $CONFIG['allowed_origin'] ?? '';
    if ($origin !== '' && ($_SERVER['HTTP_ORIGIN'] ?? '') === $origin) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Headers: Content-Type');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Vary: Origin');
    }
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

function method(): string
{
    return $_SERVER['REQUEST_METHOD'] ?? 'GET';
}

/**
 * Reads the JSON body of a POST. Requiring JSON also protects against
 * cross-site form tricks: other websites can't send JSON with the team's login cookie.
 */
function body(): array
{
    if (method() !== 'POST') fail('Use POST for this.', 405);
    $type = $_SERVER['CONTENT_TYPE'] ?? '';
    if (stripos($type, 'application/json') !== 0) fail('Send JSON.', 415);
    $raw = file_get_contents('php://input') ?: '';
    if (strlen($raw) > 200000) fail('That request is too large.', 413);
    $data = json_decode($raw, true);
    if (!is_array($data)) fail('That request could not be read.');
    return $data;
}

function str_field(array $a, string $k, int $max, bool $required = false): string
{
    $v = isset($a[$k]) && is_scalar($a[$k]) ? trim((string) $a[$k]) : '';
    if ($required && $v === '') fail("Missing $k.");
    if (mb_strlen($v) > $max) fail("$k is too long.");
    return $v;
}

function date_field(array $a, string $k, bool $required = false): ?string
{
    $v = isset($a[$k]) && is_string($a[$k]) ? substr(trim($a[$k]), 0, 10) : '';
    if ($v === '') {
        if ($required) fail("Missing $k.");
        return null;
    }
    $d = DateTime::createFromFormat('Y-m-d', $v);
    if (!$d || $d->format('Y-m-d') !== $v) fail("$k is not a valid date.");
    return $v;
}

function is_uuid($v): bool
{
    return is_string($v) && (bool) preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $v);
}

/** ISO time from the browser → MySQL DATETIME in UTC. */
function iso_to_mysql(?string $iso): string
{
    try {
        $d = new DateTime($iso ?: 'now');
    } catch (Exception $e) {
        $d = new DateTime('now');
    }
    $d->setTimezone(new DateTimeZone('UTC'));
    return $d->format('Y-m-d H:i:s');
}

/** MySQL DATETIME (UTC) → ISO for the browser. */
function mysql_to_iso(?string $v): ?string
{
    if (!$v) return null;
    return (new DateTime($v, new DateTimeZone('UTC')))->format('Y-m-d\TH:i:s\Z');
}

// ---------- database ----------
function db(): PDO
{
    static $pdo = null;
    global $CONFIG;
    if ($pdo) return $pdo;
    try {
        $pdo = new PDO(
            "mysql:host={$CONFIG['db_host']};dbname={$CONFIG['db_name']};charset=utf8mb4",
            $CONFIG['db_user'],
            $CONFIG['db_pass'],
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]
        );
        $pdo->exec("SET time_zone = '+00:00'");
    } catch (PDOException $e) {
        error_log('DB connect failed: ' . $e->getMessage());
        fail('The database is unavailable right now. Try again shortly.', 503);
    }
    return $pdo;
}

// ---------- sessions (team sign-in) ----------
function start_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) return;
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['SERVER_PORT'] ?? '') === '443');
    session_name('dds_team');
    session_set_cookie_params([
        'lifetime' => 60 * 60 * 24 * 30, // stay signed in on the iPad for 30 days
        'path' => '/',
        'secure' => $https,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    ini_set('session.gc_maxlifetime', (string) (60 * 60 * 24 * 30));
    session_start();
}

function current_staff(): ?array
{
    start_session();
    if (empty($_SESSION['staff_id'])) return null;
    $st = db()->prepare('SELECT id, name, email FROM staff WHERE id = ?');
    $st->execute([$_SESSION['staff_id']]);
    $row = $st->fetch();
    return $row ?: null;
}

function require_staff(): array
{
    $s = current_staff();
    if (!$s) fail('Please sign in as team.', 401);
    return $s;
}

// ---------- shaping rows for the app ----------
function lead_out(array $r): array
{
    $contacted = json_decode($r['contacted'] ?: '{}', true);
    return [
        'id' => $r['id'],
        'created_at' => mysql_to_iso($r['created_at']),
        'updated_at' => mysql_to_iso($r['updated_at']),
        'name' => $r['name'],
        'email' => $r['email'],
        'phone' => $r['phone'],
        'postcode' => $r['postcode'],
        'baby_due' => $r['baby_due'],
        'delivery_date' => $r['delivery_date'],
        'package_id' => $r['package_id'],
        'subscribe' => (bool) $r['subscribe'],
        'notes' => $r['notes'],
        'consent' => (bool) $r['consent'],
        'source' => $r['source'],
        'saved_offline' => (bool) $r['saved_offline'],
        'status' => $r['status'],
        'contacted' => is_array($contacted) ? $contacted : (object) [],
        'team_emailed_at' => mysql_to_iso($r['team_emailed_at']),
    ];
}

function package_out(array $r): array
{
    return [
        'id' => $r['id'],
        'name' => $r['name'],
        'price' => $r['price'],
        'cadence' => $r['cadence'],
        'description' => $r['description'],
        'shopify_url' => $r['shopify_url'],
        'shopify_variant' => $r['shopify_variant'],
        'checkout_url' => $r['checkout_url'],
        'active' => (bool) $r['active'],
        'sort' => (int) $r['sort'],
    ];
}

function settings_row(): array
{
    $r = db()->query('SELECT team, shop_domain FROM settings WHERE id = 1')->fetch();
    $team = $r ? json_decode($r['team'] ?: '{}', true) : [];
    return ['team' => is_array($team) ? $team : [], 'shop_domain' => $r['shop_domain'] ?? ''];
}

cors();
