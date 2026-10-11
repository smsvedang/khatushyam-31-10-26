/**
 * ==============================================================================
 * ShiVe Tours and Travels - Khatushyam Ji Trip Registration Backend
 * Date of Journey: 31-10-2026 | Fee: ₹900/person | Pickup: Amity Jaipur & Amer Road
 * ==============================================================================
 * 
 * SETUP INSTRUCTIONS (सेटअप कैसे करें):
 * 1. Open Google Sheets (https://sheets.new)
 * 2. Name your sheet: "ShiVe Tours - Khatushyamji Registrations 2026"
 * 3. Go to "Extensions" (एक्सटेंशन) -> "Apps Script" (ऐप्स स्क्रिप्ट)
 * 4. Delete any code in Code.gs and PASTE THIS ENTIRE FILE.
 * 5. Click "Deploy" (तैनात करें) -> "New deployment" (नया डिप्लॉयमेंट)
 * 6. Select type: "Web app" (वेब ऐप)
 *    - Description: "ShiVe Tours Khatushyamji Form API"
 *    - Execute as: "Me" (your-email@gmail.com)
 *    - Who has access: "Anyone" (कोई भी)  <-- IMPORTANT! Do not choose 'Only myself'
 * 7. Click "Deploy", Authorize access with your Google account.
 * 8. Copy the "Web app URL" (looks like https://script.google.com/macros/s/AKfycb.../exec)
 * 9. Paste this URL into your website's 'js/script.js' file in the variable:
 *    const GOOGLE_SCRIPT_URL = "YOUR_DEPLOYED_WEB_APP_URL_HERE";
 * 10. Test by opening the deployed URL (doGet); do not run doPost from the editor,
 *     because the editor does not supply the HTTP event object.
 * ==============================================================================
 */

// Global Sheet Configuration
const SHEET_NAME = "Bookings";

/**
 * Handle HTTP POST Request from the Website Form
 */
function doPost(e) {
  if (!e) {
    Logger.log("doPost requires an HTTP POST event. Test through the deployed web app URL, not the Apps Script editor.");
    return ContentService.createTextOutput(JSON.stringify({
      result: "error",
      message: "doPost must be called through the deployed web app using an HTTP POST request. Open the web app URL to test connectivity."
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // CORS Lock / Header standard
  var lock = LockService.getScriptLock();
  // Wait up to 30 seconds for concurrent requests
  lock.tryLock(30000);

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);

    // If sheet doesn't exist, create it and format headers
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      initializeHeaders(sheet);
    } else if (sheet.getLastRow() === 0) {
      initializeHeaders(sheet);
    }

    // Parse incoming data (handles both form-encoded and JSON)
    var data = {};
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        // Fallback for url-encoded form data
        data = e.parameter;
      }
    } else if (e.parameter) {
      data = e.parameter;
    }

    // Generate unique Booking ID
    var timestamp = new Date();
    var formattedDate = Utilities.formatDate(timestamp, "Asia/Kolkata", "dd/MM/yyyy HH:mm:ss");
    var randomSuffix = Math.floor(1000 + Math.random() * 9000);
    var bookingId = "SHIVE-KSJ-" + randomSuffix;

    var fullName = data.fullName || data.name || "N/A";
    var phone = data.phone || data.mobile || "N/A";
    var altPhone = data.altPhone || "N/A";
    var email = data.email || "N/A";
    var pickupPoint = data.pickupPoint || "Amity Jaipur";
    var seats = parseInt(data.seats || 1, 10);
    var ratePerSeat = 900;
    var totalAmount = data.totalAmount || (seats * ratePerSeat);
    var coTravelers = data.coTravelers || "N/A";
    var transactionId = data.transactionId || "Pay on Board / Pending";
    var specialNote = data.specialNote || "None";
    var agreedTerms = (data.agreedTerms === true || data.agreedTerms === "true" || data.agreedTerms === "yes") ? "Agreed (Yes)" : "Agreed (Yes)";
    var bookingStatus = "Confirmed (Pending Payment Verification)";

    // Append new row
    sheet.appendRow([
      bookingId,
      formattedDate,
      fullName,
      "'" + phone,      // Prefix with apostrophe to keep leading zeros intact
      "'" + altPhone,
      email,
      pickupPoint,
      seats,
      totalAmount,
      coTravelers,
      transactionId,
      agreedTerms,
      specialNote,
      bookingStatus
    ]);

    // Format new row styling
    var newRow = sheet.getLastRow();
    sheet.getRange(newRow, 1, 1, 14).setVerticalAlignment("middle");
    sheet.getRange(newRow, 1).setFontWeight("bold"); // Booking ID bold
    sheet.getRange(newRow, 9).setNumberFormat("₹#,##0"); // Currency format

    // Optional: Send Email Notification to Admin
    try {
      sendAdminNotification({
        bookingId: bookingId,
        fullName: fullName,
        phone: phone,
        email: email,
        pickupPoint: pickupPoint,
        seats: seats,
        totalAmount: totalAmount,
        transactionId: transactionId
      });
    } catch (mailErr) {
      Logger.log("Admin email notification skipped: " + mailErr.toString());
    }

    // Return success response
    var response = {
      result: "success",
      bookingId: bookingId,
      message: "जय श्री श्याम! आपकी सीट बुकिंग सफलतापूर्वक दर्ज कर ली गई है।",
      data: {
        bookingId: bookingId,
        fullName: fullName,
        phone: phone,
        seats: seats,
        totalAmount: totalAmount,
        pickupPoint: pickupPoint,
        tripDate: "31-10-2026",
        pickupTime: "09:00 AM"
      }
    };

    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log("Error in doPost: " + error.toString());
    var errorResponse = {
      result: "error",
      message: "एरर: फॉर्म सबमिट नहीं हो सका। कृपया पुनः प्रयास करें।",
      error: error.toString()
    };
    return ContentService.createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}

/**
 * Handle HTTP GET Request (For connectivity testing & health check)
 */
function doGet(e) {
  var response = {
    status: "active",
    service: "ShiVe Tours and Travels - Khatushyamji Trip API",
    destination: "Khatushyam Ji (31-10-2026)",
    fare: "₹900 including Food & DJ in Vehicle",
    pickupPoints: ["Amity University Jaipur (9:00 AM)", "Amer Road, Jaipur"],
    instructions: "Please send POST request with registration details."
  };

  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Initialize Headers with Rich Formatting
 */
function initializeHeaders(sheet) {
  var headers = [
    "Booking ID (बुकिंग आईडी)",
    "Registration Date (दिनांक/समय)",
    "Full Name (यात्री का नाम)",
    "WhatsApp / Phone (मोबाइल नं)",
    "Alternate Phone (दूसरा नंबर)",
    "Email ID (ईमेल)",
    "Pickup Point (पिकअप पॉइंट)",
    "Seats Count (सीट संख्या)",
    "Total Fare ₹ (कुल शुल्क)",
    "Co-Travelers (साथी यात्रियों के नाम)",
    "Payment / UTR Ref (पेमेंट रेफ़रेंस)",
    "Terms Agreed (जोखिम व नियम सहमति)",
    "Special Request (विशेष टिप्पणी)",
    "Booking Status (स्थिति)"
  ];

  sheet.clear();
  sheet.appendRow(headers);

  // Apply rich styling to header row
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground("#FF8C00"); // Saffron / Kesariya
  headerRange.setFontColor("#FFFFFF");
  headerRange.setFontWeight("bold");
  headerRange.setHorizontalAlignment("center");
  headerRange.setVerticalAlignment("middle");
  headerRange.setWrap(true);
  sheet.setRowHeight(1, 40);

  // Freeze header row
  sheet.setFrozenRows(1);

  // Set default column widths
  sheet.setColumnWidth(1, 150); // Booking ID
  sheet.setColumnWidth(2, 160); // Date
  sheet.setColumnWidth(3, 180); // Name
  sheet.setColumnWidth(4, 140); // Phone
  sheet.setColumnWidth(5, 140); // Alt Phone
  sheet.setColumnWidth(6, 200); // Email
  sheet.setColumnWidth(7, 180); // Pickup
  sheet.setColumnWidth(8, 110); // Seats
  sheet.setColumnWidth(9, 120); // Amount
  sheet.setColumnWidth(10, 220); // Co-travelers
  sheet.setColumnWidth(11, 170); // UTR
  sheet.setColumnWidth(12, 160); // Terms
  sheet.setColumnWidth(13, 200); // Note
  sheet.setColumnWidth(14, 180); // Status
}

/**
 * Send Email Notification to Tour Organizer
 */
function sendAdminNotification(details) {
  var adminEmail = Session.getActiveUser().getEmail();
  if (!adminEmail) return;

  var subject = "🌸 New Khatushyamji Booking: " + details.fullName + " (" + details.seats + " Seats) - ShiVe Tours";
  var body = 
    "जय श्री श्याम!\n\n" +
    "ShiVe Tours and Travels पर नई खाटू श्याम जी यात्रा बुकिंग प्राप्त हुई है:\n\n" +
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
    "बुकिंग आईडी: " + details.bookingId + "\n" +
    "यात्री का नाम: " + details.fullName + "\n" +
    "फोन नंबर: " + details.phone + "\n" +
    "ईमेल: " + details.email + "\n" +
    "पिकअप पॉइंट: " + details.pickupPoint + "\n" +
    "सीट संख्या: " + details.seats + "\n" +
    "कुल राशि: ₹" + details.totalAmount + "\n" +
    "पेमेंट यूटीआर: " + details.transactionId + "\n" +
    "यात्रा दिनांक: 31 अक्टूबर 2026 (प्रातः 09:00 बजे)\n" +
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
    "कृपया Google Sheet खोलकर विवरण चेक करें।\n" +
    "- ShiVe Tours and Travels Automated System";

  MailApp.sendEmail(adminEmail, subject, body);
}
