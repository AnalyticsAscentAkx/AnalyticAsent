/**
 * Contact endpoint — Google Apps Script web app.
 *
 * Receives a submission from /api/contact on analyticascent.com, emails it to
 * the inbox and appends it to a sheet so nothing is lost if an email is missed.
 * One deployment serves both kinds of submission:
 *   - a normal enquiry (no "kind")        -> sheet "Enquiries", email as written
 *   - kind "afterlabel_waitlist"          -> sheet "Afterlabel waitlist" (received, email,
 *                                            store, parcels, plan, offer, stats JSON),
 *                                            plus a short notification email
 *   - kind "afterlabel_count"            -> sheet "Afterlabel counts" (UTC date, event, plan,
 *                                            carrier), NO email. Sent by /api/count, the
 *                                            cookie-free counter: no IP, user agent or id
 *                                            arrives here, and none is written.
 * All live in the same spreadsheet. The waitlist and counts sheets are created on first use.
 * Counts can arrive many times a day; they never send mail, so they do not touch the
 * MailApp daily quota.
 * If you already deployed this script, paste this version over it and redeploy
 * (Deploy -> Manage deployments -> edit -> New version); the /exec URL stays the same.
 * Free, no API key, no spend, and it sends from the Google account that owns
 * the script — which is the account that will be replying anyway.
 *
 * Setup, once:
 *   1. script.google.com -> New project, paste this in, name it "Contact".
 *   2. Project Settings -> Script Properties -> add TOKEN with a long random
 *      string. Nothing else goes in here.
 *   3. Deploy -> New deployment -> type "Web app".
 *        Execute as:    Me
 *        Who has access: Anyone
 *      Authorise when prompted. Copy the /exec URL.
 *   4. In Cloudflare Pages -> Settings -> Variables, set
 *        CONTACT_WEBHOOK_URL   = that /exec URL
 *        CONTACT_WEBHOOK_TOKEN = the same random string
 *      for Production, then redeploy.
 *
 * "Anyone" is required because Cloudflare's edge is not signed into Google.
 * The TOKEN is what makes the endpoint useless to anyone who finds the URL.
 */

var SHEET_NAME = 'Enquiries'
var WAITLIST_SHEET_NAME = 'Afterlabel waitlist'
var COUNT_SHEET_NAME = 'Afterlabel counts'

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents)

    var expected = PropertiesService.getScriptProperties().getProperty('TOKEN')
    if (expected && body.token !== expected) {
      return json({ ok: false, error: 'bad token' })
    }

    var to = body.to || Session.getEffectiveUser().getEmail()

    if (body.kind === 'afterlabel_count') {
      // The row is the whole record. No email: the go/no-go numbers are read off the sheet.
      recordCount(body)
      return json({ ok: true })
    }

    if (body.kind === 'afterlabel_waitlist') {
      // Sheet first: the row is the record, the email is only a nudge.
      recordWaitlist(body)
      MailApp.sendEmail({
        to: to,
        subject: body.subject || 'Afterlabel waitlist',
        body: body.text || '',
        replyTo: body.email || undefined,
        name: 'analyticascent.com',
      })
      return json({ ok: true })
    }

    MailApp.sendEmail({
      to: to,
      subject: body.subject || 'Enquiry from analyticascent.com',
      body: body.text || '',
      replyTo: body.email || undefined,
      name: 'analyticascent.com',
    })

    record(body)
    return json({ ok: true })
  } catch (err) {
    // Still try to get the message to a human even if the sheet misbehaves.
    try {
      MailApp.sendEmail(
        Session.getEffectiveUser().getEmail(),
        'Contact form error on analyticascent.com',
        String(err) + '\n\n' + (e && e.postData ? e.postData.contents : '(no body)')
      )
    } catch (ignored) {}
    return json({ ok: false, error: String(err) })
  }
}

/** A GET is how you check the deployment is alive without sending anything. */
function doGet() {
  return json({ ok: true, service: 'analyticascent contact endpoint' })
}

/** The spreadsheet, created once and remembered. Shared by both sheets. */
function spreadsheet() {
  var props = PropertiesService.getScriptProperties()
  var id = props.getProperty('SHEET_ID')
  if (id) return SpreadsheetApp.openById(id)
  var ss = SpreadsheetApp.create('Analytics Ascent enquiries')
  props.setProperty('SHEET_ID', ss.getId())
  return ss
}

/** A cell that starts with = + - or @ would run as a formula. Visitors type these values. */
function plain(v) {
  var t = String(v || '')
  return /^[=+\-@]/.test(t) ? "'" + t : t
}

/** One row per count: the UTC date, the event, the plan and the carrier. Nothing else is written. */
function recordCount(body) {
  var ss = spreadsheet()
  var sheet = ss.getSheetByName(COUNT_SHEET_NAME)
  if (!sheet) {
    sheet = ss.insertSheet(COUNT_SHEET_NAME)
    sheet.appendRow(['Date (UTC)', 'Event', 'Plan', 'Carrier'])
    sheet.setFrozenRows(1)
  }
  sheet.appendRow([
    Utilities.formatDate(new Date(), 'UTC', 'yyyy-MM-dd'),
    plain(body.e),
    plain(body.p),
    plain(body.c),
  ])
}

function recordWaitlist(body) {
  var ss = spreadsheet()
  var sheet = ss.getSheetByName(WAITLIST_SHEET_NAME)
  if (!sheet) {
    sheet = ss.insertSheet(WAITLIST_SHEET_NAME)
    sheet.appendRow(['Received', 'Email', 'Store', 'Parcels per month', 'Plan', 'Offer', 'Stats'])
    sheet.setFrozenRows(1)
  }
  sheet.appendRow([
    body.receivedAt || new Date().toISOString(),
    plain(body.email),
    plain(body.store),
    plain(body.parcels),
    plain(body.plan),
    plain(body.offer),
    body.stats ? JSON.stringify(body.stats) : '',
  ])
}

function record(body) {
  // A standalone script has no active spreadsheet, so the sheet is created
  // once and its id remembered. Creating it per submission would scatter a new
  // spreadsheet across Drive for every enquiry.
  var props = PropertiesService.getScriptProperties()
  var id = props.getProperty('SHEET_ID')
  var ss
  if (id) {
    ss = SpreadsheetApp.openById(id)
  } else {
    ss = SpreadsheetApp.create('Analytics Ascent enquiries')
    props.setProperty('SHEET_ID', ss.getId())
  }

  var sheet = ss.getSheetByName(SHEET_NAME)
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME)
    sheet.appendRow(['Received', 'Name', 'Email', 'Company', 'Topic', 'Message'])
    sheet.setFrozenRows(1)
  }
  sheet.appendRow([
    body.receivedAt || new Date().toISOString(),
    body.name || '',
    body.email || '',
    body.company || '',
    body.topic || '',
    body.message || '',
  ])
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  )
}
