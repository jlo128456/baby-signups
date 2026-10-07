/*
 * ===================== DEMO / PRODUCTION SWITCH =====================
 *
 *   mode: "demo"        Sample test data in the browser. No server needed.
 *                       Use for GitHub Pages and for showing people the app.
 *                       Demo team login: amanda@demo.com / demo1234
 *
 *   mode: "production"  Real sign-ups saved to your MySQL database through
 *                       the PHP files in /api, with emails to the team.
 *                       Use on your cPanel hosting.
 *
 * You can change this AFTER building: edit this file on the server
 * (e.g. public_html/config.js in cPanel File Manager) and refresh the page.
 * ====================================================================
 */
window.APP_CONFIG = {
  mode: "demo",

  // Production only: where the PHP API lives. "api/" means the api folder next to index.html.
  apiUrl: "api/",
};
