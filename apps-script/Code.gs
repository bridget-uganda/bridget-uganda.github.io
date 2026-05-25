/**
 * Bridget Uganda — Guest Stories backend (Google Apps Script)
 *
 * SETUP (one-time, ~10 min):
 *   1. Go to https://sheets.google.com and create a new spreadsheet
 *      called "Bridget Testimonials" (any name works).
 *   2. In that sheet: Extensions → Apps Script. Delete the default code,
 *      paste this entire file. Save (disk icon).
 *   3. Click "Deploy" → "New deployment".
 *        Type:                   Web app
 *        Description:            v1
 *        Execute as:             Me
 *        Who has access:         Anyone
 *      → "Deploy". Authorise when prompted (this is your own Google account).
 *   4. Copy the Web app URL (ends with .../exec) and paste it into
 *      dist/public/testimonials.js as APPS_SCRIPT_URL.
 *   5. Done. New reviews land in this sheet AND appear on the site instantly.
 *
 * If you ever change this code: Deploy → Manage deployments → pencil →
 *   "New version" → Deploy. The URL stays the same.
 */

const SHEET_NAME = 'Testimonials';
const RATE_LIMIT_HOURS = 24;        // 1 review per email per 24h
const MAX_TEXT_LEN = 800;
const MIN_TEXT_LEN = 20;

// ---------------------------------------------------------------------------
// GET — return all published testimonials, newest first
// ---------------------------------------------------------------------------
function doGet(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet || sheet.getLastRow() < 2) return jsonOut([]);

    const values  = sheet.getDataRange().getValues();
    const headers = values[0].map(function (h) { return String(h).trim(); });
    function col(k) { return headers.indexOf(k); }

    const items = values.slice(1).map(function (r) {
      return {
        name:     str(r[col('name')]),
        country:  str(r[col('country')]),
        flag:     str(r[col('flag')]),
        photo:    str(r[col('photo')]),
        rating:   Math.max(0, Math.min(5, Number(r[col('rating')]) || 0)),
        tourType: str(r[col('tourType')]),
        tourDate: str(r[col('tourDate')]),
        text:     str(r[col('text')]),
        verified: !!r[col('verified')]
      };
    }).filter(function (t) { return t.text && t.name; }).reverse();

    return jsonOut(items);
  } catch (err) {
    return jsonOut({ error: 'read_failed' });
  }
}

// ---------------------------------------------------------------------------
// POST — accept a new testimonial submission
// ---------------------------------------------------------------------------
function doPost(e) {
  try {
    const p = (e && e.parameter) || {};

    // Honeypot — silently accept and drop
    if (p._gotcha && String(p._gotcha).length > 0) {
      return jsonOut({ ok: true });
    }

    const name     = sanitize(p.name, 80);
    const text     = sanitize(p.text, MAX_TEXT_LEN);
    const email    = sanitize(p.email, 120).toLowerCase();
    const country  = sanitize(p.country, 60);
    const tourType = sanitize(p.tour_type, 80);
    const tourDate = sanitize(p.tour_date, 40);
    const rating   = Math.max(1, Math.min(5, Number(p.rating) || 5));

    if (!name)  return jsonOut({ error: 'Please enter your name.' });
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return jsonOut({ error: 'Please enter a valid email.' });
    }
    if (!text || text.length < MIN_TEXT_LEN) {
      return jsonOut({ error: 'Please write at least ' + MIN_TEXT_LEN + ' characters.' });
    }
    if (p.consent !== 'on' && p.consent !== 'true' && p.consent !== '1') {
      return jsonOut({ error: 'Please confirm consent to publish.' });
    }

    // Rate-limit: one submission per email per RATE_LIMIT_HOURS
    const props = PropertiesService.getScriptProperties();
    const key = 'rl_' + sha(email);
    const last = Number(props.getProperty(key) || 0);
    const now = Date.now();
    if (now - last < RATE_LIMIT_HOURS * 3600 * 1000) {
      return jsonOut({ error: 'Thanks — we already received your review recently.' });
    }
    props.setProperty(key, String(now));

    const sheet = ensureSheet();
    sheet.appendRow([
      new Date(),     // timestamp
      name,
      country,
      '',             // flag — Bridget may fill manually
      '',             // photo — Bridget may fill manually
      rating,
      tourType,
      tourDate,
      text,
      email,
      false           // verified — toggle in sheet for the "Verified" badge
    ]);

    return jsonOut({ ok: true });
  } catch (err) {
    return jsonOut({ error: 'Something went wrong. Please try again.' });
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function ensureSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      'timestamp', 'name', 'country', 'flag', 'photo', 'rating',
      'tourType', 'tourDate', 'text', 'email', 'verified'
    ]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Trim, collapse whitespace, cap length. No control-char regex (those
// characters are invisible in editors and break when copy-pasted).
function sanitize(s, max) {
  return String(s == null ? '' : s)
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, max);
}

function str(v) { return v == null ? '' : String(v); }

function sha(s) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s);
  return bytes.map(function (b) {
    return ('0' + (b & 0xff).toString(16)).slice(-2);
  }).join('');
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
