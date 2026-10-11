/**
 * ==============================================================================
 * ShiVe Tours and Travels - Automated WhatsApp Web Service with Pending Queue
 * Powered by Baileys WhatsApp Web Protocol & Express
 * ==============================================================================
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const pino = require('pino');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// State variables
let sock = null;
let currentQR = null;
let connectionStatus = 'initializing'; // 'initializing', 'qr_ready', 'connected', 'disconnected'
let connectedUser = null;
let isProcessingQueue = false;

const SESSION_DIR = path.join(__dirname, 'auth_info_baileys');
const QUEUE_FILE = path.join(__dirname, 'pending-messages.json');

// Utility sleep
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Queue Management (Persistent JSON storage)
 */
function loadQueue() {
  try {
    if (fs.existsSync(QUEUE_FILE)) {
      const data = fs.readFileSync(QUEUE_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading queue file:', err);
  }
  return [];
}

function saveQueue(queue) {
  try {
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving queue file:', err);
  }
}

function enqueueMessage(bookingData) {
  const queue = loadQueue();
  const existingIdx = queue.findIndex(item => item.bookingId === bookingData.bookingId);
  
  if (existingIdx >= 0) {
    if (queue[existingIdx].status !== 'sent') {
      queue[existingIdx] = { ...queue[existingIdx], ...bookingData, status: 'pending' };
    }
  } else {
    queue.push({
      ...bookingData,
      status: 'pending',
      queuedAt: new Date().toISOString(),
      attempts: 0
    });
  }
  saveQueue(queue);
  return queue;
}

/**
 * Format Phone Number to WhatsApp JID
 */
function formatWhatsAppJid(phoneStr) {
  if (!phoneStr) return null;
  let cleaned = String(phoneStr).replace(/\D/g, '');
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    cleaned = '91' + cleaned.substring(1);
  }
  return `${cleaned}@s.whatsapp.net`;
}

/**
 * Generate Confirmation Message Template
 */
function buildMessageText(data) {
  return (
`🌸 *|| जय श्री श्याम ||* 🌸

सादर प्रणाम *${data.fullName || 'श्रद्धालु'}* जी 🙏
*ShiVe Tours and Travels* में आपकी खाटू श्याम जी दर्शन यात्रा (31-10-2026) की सीट सफलतापूर्वक बुक हो गई है!

━━━━━━━━━━━━━━━━━━━━━━━
📋 *आपकी यात्रा बुकिंग रसीद (Booking Details)*
━━━━━━━━━━━━━━━━━━━━━━━
🎫 *बुकिंग संदर्भ ID:* ${data.bookingId}
👤 *यात्री का नाम:* ${data.fullName || 'यात्री'}
📞 *मोबाइल नंबर:* ${data.phone}
📅 *यात्रा दिनांक:* 31 अक्टूबर 2026 (शनिवार)
⏰ *पिकअप समय:* प्रातः 09:00 AM
📍 *पिकअप पॉइंट:* ${data.pickupPoint || 'Amity University Jaipur'}
👥 *सीटों की संख्या:* ${data.seats || 1} सीट
💰 *कुल शुल्क:* ₹${Number(data.totalAmount || 900).toLocaleString('en-IN')} (सफर + भोजन + डीजे शामिल)
🚌 *सुविधाएं:* AC Luxury Coach + ऑन-बोर्ड डीजे 🎵
🍱 *भोजन:* सुबह का नाश्ता एवं दोपहर का सात्विक लंच शामिल
━━━━━━━━━━━━━━━━━━━━━━━

⚠️ *महत्वपूर्ण निर्देश:*
1. यात्रा सभी दिशा-निर्देशों एवं व्यक्तिगत सुरक्षा (At Own Risk) के तहत मान्य है।
2. निर्धारित समय सुबह 09:00 बजे से 15 मिनट पूर्व पिकअप स्थल पर उपस्थित रहें।
3. ₹900 शुल्क में यात्रा, भोजन एवं डीजे शामिल है। निजी व वीआईपी खर्च यात्री का स्वयं होगा।

किसी भी जानकारी या सहायता हेतु आप सीधे इसी नंबर पर रिप्लाई कर सकते हैं।
*हारे का सहारा, बाबा श्याम हमारा!* ✨

— *ShiVe Tours and Travels, Jaipur*
📞 हेल्पलाइन: +91 9243714402`
  );
}

/**
 * Process All Pending Messages in the Queue
 */
async function processPendingQueue() {
  if (connectionStatus !== 'connected' || !sock) {
    return;
  }
  if (isProcessingQueue) {
    return;
  }

  isProcessingQueue = true;
  try {
    const queue = loadQueue();
    const pendingItems = queue.filter(item => item.status === 'pending');

    if (pendingItems.length === 0) {
      isProcessingQueue = false;
      return;
    }

    console.log(`\n⏳ [Queue Runner] Found ${pendingItems.length} pending message(s). Starting auto-dispatch...`);

    for (let item of pendingItems) {
      if (connectionStatus !== 'connected' || !sock) break;

      const jid = formatWhatsAppJid(item.phone);
      if (!jid) {
        item.status = 'failed';
        item.error = 'Invalid phone number';
        saveQueue(queue);
        continue;
      }

      try {
        console.log(`🚀 Sending pending message to ${item.fullName} (${item.phone})...`);
        const text = buildMessageText(item);
        await sock.sendMessage(jid, { text });

        item.status = 'sent';
        item.sentAt = new Date().toISOString();
        saveQueue(queue);

        console.log(`✅ [Sent Successfully] Message delivered to ${item.fullName} for ID: ${item.bookingId}`);
        // Delay 2.5s between messages to prevent spam detection
        await sleep(2500);

      } catch (sendErr) {
        console.error(`❌ Failed to send to ${item.phone}:`, sendErr.message);
        item.attempts = (item.attempts || 0) + 1;
        item.lastError = sendErr.message;
        if (item.attempts >= 5) {
          item.status = 'failed';
        }
        saveQueue(queue);
      }
    }

  } catch (err) {
    console.error('Error processing queue:', err);
  } finally {
    isProcessingQueue = false;
  }
}

let reconnectTimeout = null;

/**
 * Initialize WhatsApp Connection
 */
async function connectToWhatsApp() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  if (sock) {
    try {
      sock.ev.removeAllListeners();
      sock.end(undefined);
    } catch (e) {}
    sock = null;
  }

  connectionStatus = 'connecting';
  currentQR = null;

  try {
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      logger: pino({ level: 'silent' }),
      auth: state,
      browser: ['ShiVe Tours Automation', 'Chrome', '1.0.0'],
      syncFullHistory: false, // Optimized: do not download gigabytes of old chat history
      markOnlineOnConnect: true,
      generateHighQualityLinkPreview: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        currentQR = await QRCode.toDataURL(qr);
        connectionStatus = 'qr_ready';
        console.log('📌 New WhatsApp Web QR Code generated. Scan from browser dashboard or terminal.');
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        console.log(`Connection closed (code: ${statusCode}), reconnecting: ${shouldReconnect}`);
        
        connectionStatus = 'disconnected';
        connectedUser = null;

        if (shouldReconnect) {
          const delay = (statusCode === 440 || statusCode === DisconnectReason.connectionReplaced) ? 10000 : 3000;
          reconnectTimeout = setTimeout(connectToWhatsApp, delay);
        } else {
          console.log('User logged out. Please restart and scan QR code again.');
        }
      } else if (connection === 'open') {
        connectionStatus = 'connected';
        currentQR = null;
        const userJid = sock.user?.id || '';
        const phone = userJid.split(':')[0] || userJid.split('@')[0];
        connectedUser = {
          id: userJid,
          phone: phone,
          name: sock.user?.name || 'ShiVe Tours Admin'
        };
        console.log(`\n======================================================`);
        console.log(`✅ WhatsApp Web Connected Successfully!`);
        console.log(`📱 Linked Phone: +${phone}`);
        console.log(`======================================================\n`);

        // Automatically process any pending messages!
        setTimeout(processPendingQueue, 2000);
      }
    });

  } catch (error) {
    console.error('Error in connectToWhatsApp:', error);
    connectionStatus = 'disconnected';
    reconnectTimeout = setTimeout(connectToWhatsApp, 5000);
  }
}

// Periodic queue check every 25 seconds
setInterval(() => {
  if (connectionStatus === 'connected') {
    processPendingQueue();
  }
}, 25000);

/**
 * API: Get Status & Queue Summary
 */
app.get('/api/status', (req, res) => {
  const queue = loadQueue();
  const pendingCount = queue.filter(item => item.status === 'pending').length;
  const sentCount = queue.filter(item => item.status === 'sent').length;

  res.json({
    status: connectionStatus,
    qr: currentQR,
    user: connectedUser,
    pendingCount,
    sentCount,
    queue: queue.slice(-20).reverse()
  });
});

/**
 * API: Send Confirmation Message
 * If connected -> sends immediately
 * If disconnected -> saves to pending queue for automatic dispatch on connect!
 */
app.post('/api/send-confirmation', async (req, res) => {
  const {
    fullName,
    phone,
    altPhone,
    email,
    pickupPoint,
    seats = 1,
    totalAmount = 900,
    bookingId,
    specialNote = ''
  } = req.body;

  if (!phone) {
    return res.status(400).json({ success: false, message: 'Phone number is required' });
  }

  // Ensure genuine Booking ID (Never XXXX)
  const finalBookingId = (bookingId && String(bookingId).trim() !== '' && !String(bookingId).includes('XXXX'))
    ? String(bookingId).trim()
    : ('SHIVE-KSJ-' + Math.floor(1000 + Math.random() * 9000));

  const bookingData = {
    bookingId: finalBookingId,
    fullName,
    phone,
    altPhone,
    email,
    pickupPoint,
    seats,
    totalAmount,
    specialNote
  };

  // If WhatsApp is NOT currently connected, enqueue for automatic sending later!
  if (connectionStatus !== 'connected' || !sock) {
    enqueueMessage(bookingData);
    console.log(`📥 [Queued] WhatsApp not connected yet. Saved Booking ${bookingId} to pending queue.`);
    return res.json({
      success: true,
      queued: true,
      message: 'WhatsApp Web अभी कनेक्ट नहीं है। बुकिंग पेंडिंग कतार (Queue) में सुरक्षित रख ली गई है। जैसे ही सर्वर कनेक्ट होगा, यह मैसेज अपने आप चला जाएगा!'
    });
  }

  // If WhatsApp is connected, try sending immediately
  const recipientJid = formatWhatsAppJid(phone);
  if (!recipientJid) {
    return res.status(400).json({ success: false, message: 'Invalid phone format' });
  }

  try {
    const text = buildMessageText(bookingData);
    await sock.sendMessage(recipientJid, { text });

    // Mark as sent in queue
    const queue = loadQueue();
    const existingIdx = queue.findIndex(item => item.bookingId === bookingId);
    if (existingIdx >= 0) {
      queue[existingIdx].status = 'sent';
      queue[existingIdx].sentAt = new Date().toISOString();
    } else {
      queue.push({
        ...bookingData,
        status: 'sent',
        sentAt: new Date().toISOString()
      });
    }
    saveQueue(queue);

    console.log(`[WhatsApp Sent] Immediate confirmation dispatched to ${fullName} (${recipientJid})`);

    return res.json({
      success: true,
      queued: false,
      message: 'Automatic WhatsApp confirmation sent successfully!',
      bookingId
    });

  } catch (err) {
    console.error('Failed immediate send, queuing message:', err);
    // Enqueue for retry
    enqueueMessage(bookingData);
    return res.json({
      success: true,
      queued: true,
      message: 'अस्थायी समस्या के कारण मैसेज पेंडिंग कतार में रखा गया है। पुनः प्रयास स्वतः किया जाएगा।'
    });
  }
});

/**
 * API: Sync/Enqueue Offline Bookings from Frontend
 */
app.post('/api/enqueue-pending', (req, res) => {
  const { bookings } = req.body;
  if (!bookings || !Array.isArray(bookings)) {
    return res.status(400).json({ success: false, message: 'Invalid bookings array' });
  }

  let addedCount = 0;
  for (let b of bookings) {
    if (b && b.phone) {
      enqueueMessage(b);
      addedCount++;
    }
  }

  console.log(`📥 Synced ${addedCount} offline booking(s) into queue.`);
  if (connectionStatus === 'connected') {
    setTimeout(processPendingQueue, 1000);
  }

  return res.json({
    success: true,
    addedCount,
    message: `${addedCount} बुकिंग्स पेंडिंग कतार में जोड़ी गईं।`
  });
});

/**
 * API: Manual Trigger to Process Pending Queue
 */
app.post('/api/process-queue', async (req, res) => {
  if (connectionStatus !== 'connected') {
    return res.status(503).json({
      success: false,
      message: 'WhatsApp Web कनेक्ट नहीं है। कृपया पहले QR कोड स्कैन करें।'
    });
  }

  processPendingQueue();
  return res.json({ success: true, message: 'पेंडिंग मैसेज भेजने की प्रक्रिया प्रारंभ कर दी गई है।' });
});

/**
 * API: Send Test WhatsApp Message
 */
app.post('/api/send-test', async (req, res) => {
  if (connectionStatus !== 'connected' || !sock) {
    return res.status(503).json({ success: false, message: 'WhatsApp Web is not connected' });
  }

  const { phone, message } = req.body;
  if (!phone) {
    return res.status(400).json({ success: false, message: 'Phone number is required' });
  }

  const recipientJid = formatWhatsAppJid(phone);
  const testText = message || 
`🌸 *जय श्री श्याम!* 
यह *ShiVe Tours and Travels* के ऑटोमैटिक व्हाट्सएप सिस्टम की टेस्ट सूचना है। आपका व्हाट्सएप वेब पूरी तरह सक्रिय और कनेक्टेड है! ✅`;

  try {
    await sock.sendMessage(recipientJid, { text: testText });
    return res.json({ success: true, message: `Test message sent to ${recipientJid}` });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.toString() });
  }
});

/**
 * Start Server & WhatsApp Connection
 */
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 ShiVe Tours - WhatsApp Web Server is running!`);
  console.log(`🌐 Dashboard URL: http://localhost:${PORT}`);
  console.log(`📁 Queue File: ${QUEUE_FILE}`);
  console.log(`======================================================\n`);
  connectToWhatsApp();
});
