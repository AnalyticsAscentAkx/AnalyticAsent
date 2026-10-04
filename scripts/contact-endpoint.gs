/**
 * Contact endpoint — Google Apps Script web app.
 *
 * Receives a submission from /api/contact on analyticascent.com, emails it to
 * the inbox and appends it to a sheet so nothing is lost if an email is missed.
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

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents)

    var expected = PropertiesService.getScriptProperties().getProperty('TOKEN')
    if (expected && body.token !== expected) {
      return json({ ok: false, error: 'bad token' })
    }

    var to = body.to || Session.getEffectiveUser().getEmail()

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
