<?php
// Copy this file to config.php and fill in your details.
// config.php holds passwords: never share it or put it on GitHub.

return [
    // cPanel → MySQL Databases. On cPanel, names usually start with your account name, e.g. "myacct_signups".
    'db_host' => 'localhost',
    'db_name' => 'myacct_signups',
    'db_user' => 'myacct_signups',
    'db_pass' => 'change-me',

    // Team emails are sent from this address. Create it in cPanel → Email Accounts
    // (an address on your own domain is far less likely to land in spam).
    'mail_from' => 'signups@yourshop.com.au',
    'mail_from_name' => 'Due Date Sign-ups',

    // A long random phrase. Needed only while you use add-staff.php to create team logins.
    // Set it back to '' afterwards to switch add-staff.php off.
    'setup_key' => '',

    // Leave empty when the app and the API are on the same website (the normal set-up).
    // If you serve the app from a different address, put that address here, e.g. 'https://signup.yourshop.com.au'.
    'allowed_origin' => '',
];
