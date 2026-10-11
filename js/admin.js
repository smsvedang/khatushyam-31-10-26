/**
 * ==============================================================================
 * ShiVe Tours and Travels - Admin Panel Engine
 * Live Google Sheets Connection + WhatsApp Dispatcher Management
 * ==============================================================================
 */

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwEwzrbFi8Uyg1Lu3LrNtuGG1tErjPApHbNWTB6wt2AgcznWbA_Clh_fWpf1XC0dKXIDQ/exec";
const WHATSAPP_SERVICE_URL = "http://localhost:5000/api/send-confirmation";
const WHATSAPP_STATUS_URL = "http://localhost:5000/api/status";
const RATE_PER_SEAT = 900;

let allBookings = [];
let filteredBookings = [];

document.addEventListener("DOMContentLoaded", () => {
  initAdminDashboard();
});

async function initAdminDashboard() {
  await fetchAllBookings();
  checkWhatsAppServerStatus();
  setInterval(checkWhatsAppServerStatus, 10000);

  // Search and filter listeners
  document.getElementById("searchInput").addEventListener("input", filterAndRender);
  document.getElementById("filterPickup").addEventListener("change", filterAndRender);
  document.getElementById("filterStatus").addEventListener("change", filterAndRender);

  // Sync button
  document.getElementById("btnSyncSheets").addEventListener("click", async () => {
    const icon = document.getElementById("syncIcon");
    icon.classList.add("fa-spin");
    await fetchAllBookings();
    setTimeout(() => icon.classList.remove("fa-spin"), 800);
  });

  // Manual booking form listener
  initManualBookingForm();

  // Broadcast form listener
  initBroadcastForm();
}

/**
 * Switch Navigation Tabs
 */
function switchTab(tabId) {
  document.querySelectorAll(".tab-pane").forEach(pane => pane.classList.add("hidden"));
  document.getElementById(tabId).classList.remove("hidden");

  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.className = "tab-btn px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 text-slate-600 hover:bg-slate-100 transition";
  });

  const activeBtnMap = {
    tabBookings: "navTabBookings",
    tabManualBooking: "navTabManualBooking",
    tabBroadcast: "navTabBroadcast",
    tabSettings: "navTabSettings"
  };
  const activeBtn = document.getElementById(activeBtnMap[tabId]);
  if (activeBtn) {
    activeBtn.className = "tab-btn px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 bg-saffron text-white shadow-sm transition";
  }
}

/**
 * Fetch All Bookings from Google Sheets
 */
async function fetchAllBookings() {
  const tableBody = document.getElementById("bookingsTableBody");
  
  try {
    let sheetBookings = [];
    if (GOOGLE_SCRIPT_URL && GOOGLE_SCRIPT_URL.trim() !== "") {
      try {
        const res = await fetch(GOOGLE_SCRIPT_URL);
        const data = await res.json();
        if (data.status === "success" && Array.isArray(data.bookings)) {
          sheetBookings = data.bookings;
        }
      } catch (sheetErr) {
        console.warn("Could not fetch directly from Google Sheets via GET (CORS or permissions):", sheetErr);
      }
    }

    // Merge with any offline / recent bookings in localStorage
    const localLast = JSON.parse(localStorage.getItem("last_shive_booking") || "null");
    const localUnsent = JSON.parse(localStorage.getItem("shive_unsent_bookings") || "[]");
    
    // Also merge with WhatsApp queue if server is reachable
    let waQueueItems = [];
    try {
      const waRes = await fetch("http://localhost:5000/api/status");
      const waData = await waRes.json();
      if (waData.queue && Array.isArray(waData.queue)) {
        waQueueItems = waData.queue;
      }
    } catch (e) {}

    const mergedMap = new Map();

    // 1. Add Sheet bookings
    sheetBookings.forEach(b => {
      if (b.bookingId) mergedMap.set(b.bookingId, b);
    });

    // 2. Add WhatsApp Queue bookings
    waQueueItems.forEach(b => {
      if (b.bookingId && !mergedMap.has(b.bookingId)) {
        mergedMap.set(b.bookingId, {
          ...b,
          status: b.status === "sent" ? "Confirmed" : "Pending"
        });
      }
    });

    // 3. Add Local Storage bookings
    localUnsent.forEach(b => {
      if (b.bookingId && !mergedMap.has(b.bookingId)) mergedMap.set(b.bookingId, b);
    });
    if (localLast && localLast.bookingId && !mergedMap.has(localLast.bookingId)) {
      mergedMap.set(localLast.bookingId, localLast);
    }

    allBookings = Array.from(mergedMap.values());

    // Fallback sample record if sheet is completely fresh
    if (allBookings.length === 0) {
      allBookings = [
        {
          bookingId: "SHIVE-KSJ-1001",
          registrationDate: "11/10/2026 10:00:00",
          fullName: "राहुल शर्मा",
          phone: "9243714402",
          email: "rahul@example.com",
          pickupPoint: "Amity University Jaipur",
          seats: 2,
          totalAmount: 1800,
          transactionId: "UPI Ref: 48921849",
          status: "Confirmed",
          specialNote: "सीनियर सिटीजन सीट"
        }
      ];
    }

    updateKPIs();
    filterAndRender();

  } catch (err) {
    console.error("Error loading bookings:", err);
    tableBody.innerHTML = `
      <tr>
        <td colspan="9" class="text-center py-8 text-rose-500 font-semibold">
          डेटा लोड करने में समस्या आई। कृपया इंटरनेट और Google Script लिंक जांचें।
        </td>
      </tr>
    `;
  }
}

/**
 * Calculate & Update KPI Cards
 */
function updateKPIs() {
  const totalBookings = allBookings.length;
  let totalSeats = 0;
  let totalRevenue = 0;
  let amitySeats = 0;
  let amerSeats = 0;

  allBookings.forEach(b => {
    const seats = parseInt(b.seats || 1, 10);
    totalSeats += seats;
    totalRevenue += (b.totalAmount ? Number(b.totalAmount) : (seats * RATE_PER_SEAT));

    const pickup = String(b.pickupPoint || "");
    if (pickup.includes("Amity")) {
      amitySeats += seats;
    } else if (pickup.includes("Amer")) {
      amerSeats += seats;
    }
  });

  document.getElementById("kpiTotalBookings").textContent = totalBookings;
  document.getElementById("kpiTotalSeats").textContent = `${totalSeats} सीटें`;
  document.getElementById("kpiTotalRevenue").textContent = "₹" + totalRevenue.toLocaleString("en-IN");
  document.getElementById("kpiAmitySeats").textContent = `${amitySeats} सीट`;
  document.getElementById("kpiAmerSeats").textContent = `${amerSeats} सीट`;
}

/**
 * Filter and Render Bookings Table
 */
function filterAndRender() {
  const search = document.getElementById("searchInput").value.trim().toLowerCase();
  const pickupFilter = document.getElementById("filterPickup").value;
  const statusFilter = document.getElementById("filterStatus").value;

  filteredBookings = allBookings.filter(b => {
    // Search
    const matchSearch = 
      (b.fullName && b.fullName.toLowerCase().includes(search)) ||
      (b.phone && String(b.phone).includes(search)) ||
      (b.bookingId && b.bookingId.toLowerCase().includes(search));

    // Pickup filter
    const matchPickup = (pickupFilter === "ALL") || (b.pickupPoint && b.pickupPoint.includes(pickupFilter));

    // Status filter
    const matchStatus = (statusFilter === "ALL") || (b.status && b.status.toLowerCase().includes(statusFilter.toLowerCase()));

    return matchSearch && matchPickup && matchStatus;
  });

  renderTable();
}

/**
 * Render Table Rows
 */
function renderTable() {
  const tbody = document.getElementById("bookingsTableBody");
  const countText = document.getElementById("tableCountText");

  if (filteredBookings.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="text-center py-10 text-slate-400 font-medium">
          कोई बुकिंग नहीं मिली।
        </td>
      </tr>
    `;
    countText.textContent = "0 बुकिंग्स प्रदर्शित";
    return;
  }

  tbody.innerHTML = filteredBookings.map((b, idx) => {
    const isConfirmed = (b.status || "").toLowerCase().includes("confirm");
    const isPaid = (b.status || "").toLowerCase().includes("paid");
    const isCancelled = (b.status || "").toLowerCase().includes("cancel");

    let statusBadge = `<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">Pending</span>`;
    if (isConfirmed) statusBadge = `<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Confirmed</span>`;
    if (isPaid) statusBadge = `<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">Paid</span>`;
    if (isCancelled) statusBadge = `<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">Cancelled</span>`;

    return `
      <tr class="hover:bg-slate-50 transition border-b border-slate-100">
        <td class="py-3.5 px-4 text-xs font-bold text-slate-400">${idx + 1}</td>
        <td class="py-3.5 px-4">
          <span class="font-mono text-xs font-extrabold text-saffron bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
            ${b.bookingId}
          </span>
          <div class="text-[11px] text-slate-400 mt-0.5">${b.registrationDate || ""}</div>
        </td>
        <td class="py-3.5 px-4">
          <div class="font-bold text-slate-900">${b.fullName || "यात्री"}</div>
          <div class="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
            <a href="tel:${b.phone}" class="hover:text-saffron"><i class="fas fa-phone-alt text-[10px]"></i> ${b.phone}</a>
            <a href="https://wa.me/${formatPhoneForWA(b.phone)}" target="_blank" class="text-emerald-600 hover:text-emerald-700 font-bold" title="WhatsApp पर चैट करें">
              <i class="fab fa-whatsapp"></i>
            </a>
          </div>
        </td>
        <td class="py-3.5 px-4 text-xs text-slate-700">
          <i class="fas fa-map-marker-alt text-saffron mr-1"></i>
          <span>${b.pickupPoint || "Amity Jaipur"}</span>
        </td>
        <td class="py-3.5 px-4 text-center">
          <span class="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">${b.seats || 1}</span>
        </td>
        <td class="py-3.5 px-4 font-extrabold text-emerald-700">
          ₹${Number(b.totalAmount || (b.seats * RATE_PER_SEAT)).toLocaleString("en-IN")}
        </td>
        <td class="py-3.5 px-4 text-xs text-slate-500 font-mono">
          ${b.transactionId || "Pending"}
        </td>
        <td class="py-3.5 px-4 text-center">
          ${statusBadge}
        </td>
        <td class="py-3.5 px-4 text-right">
          <div class="inline-flex items-center gap-1.5 justify-end">
            <!-- Send WhatsApp Button -->
            <button type="button" onclick="sendWhatsAppConfirmation('${b.bookingId}')" class="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-waGreen hover:text-emerald-700 text-xs font-bold transition" title="WhatsApp पर रसीद भेजें">
              <i class="fab fa-whatsapp text-sm"></i>
            </button>
            <!-- View Details -->
            <button type="button" onclick="viewBookingDetails('${b.bookingId}')" class="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition" title="पूरा विवरण देखें">
              <i class="fas fa-eye"></i>
            </button>
            <!-- Update Status -->
            <button type="button" onclick="toggleStatusPrompt('${b.bookingId}')" class="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-indigo-600 text-xs font-bold transition" title="स्थिति बदलें">
              <i class="fas fa-pen"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  countText.textContent = `${filteredBookings.length} बुकिंग्स प्रदर्शित (कुल ${allBookings.length})`;
}

/**
 * Format Phone Number for WhatsApp Link
 */
function formatPhoneForWA(phone) {
  let cleaned = String(phone).replace(/\D/g, "");
  if (cleaned.length === 10) cleaned = "91" + cleaned;
  return cleaned;
}

/**
 * Send Individual WhatsApp Confirmation to Traveler
 */
async function sendWhatsAppConfirmation(bookingId) {
  const booking = allBookings.find(b => b.bookingId === bookingId);
  if (!booking) return;

  if (!confirm(`${booking.fullName} (+${booking.phone}) को WhatsApp पर आधिकारिक बुकिंग रसीद भेजें?`)) {
    return;
  }

  try {
    const res = await fetch(WHATSAPP_SERVICE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(booking)
    });
    const result = await res.json();
    if (result.success) {
      alert(`✅ ${booking.fullName} को WhatsApp रसीद सफलतापूर्वक भेज दी गई!`);
    } else {
      alert(`❌ सूचना: ${result.message}`);
    }
  } catch (err) {
    alert("व्हाट्सएप सर्विस से संपर्क नहीं हो सका। कृपया 'start-whatsapp-service.bat' चलाएं।");
  }
}

/**
 * View Detailed Booking Card in Modal
 */
function viewBookingDetails(bookingId) {
  const b = allBookings.find(item => item.bookingId === bookingId);
  if (!b) return;

  const content = document.getElementById("bookingDetailContent");
  content.innerHTML = `
    <div class="p-3 bg-orange-50 border border-orange-200 rounded-xl flex justify-between items-center">
      <div>
        <span class="text-xs text-slate-500 font-bold uppercase">बुकिंग संदर्भ:</span>
        <h4 class="text-base font-extrabold text-saffron font-mono">${b.bookingId}</h4>
      </div>
      <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">${b.status || "Confirmed"}</span>
    </div>

    <div class="grid grid-cols-2 gap-3 text-xs">
      <div><strong>यात्री का नाम:</strong> <span class="text-slate-700">${b.fullName}</span></div>
      <div><strong>मोबाइल:</strong> <span class="text-slate-700">${b.phone}</span></div>
      <div><strong>ईमेल:</strong> <span class="text-slate-700">${b.email || "N/A"}</span></div>
      <div><strong>पिकअप पॉइंट:</strong> <span class="text-slate-700">${b.pickupPoint}</span></div>
      <div><strong>सीट संख्या:</strong> <span class="text-slate-700 font-bold">${b.seats || 1} सीट</span></div>
      <div><strong>कुल शुल्क:</strong> <span class="text-emerald-700 font-bold">₹${b.totalAmount || 900}</span></div>
      <div><strong>पेमेंट UTR / विधि:</strong> <span class="text-slate-700 font-mono">${b.transactionId || "Pending"}</span></div>
      <div><strong>रजिस्ट्रेशन समय:</strong> <span class="text-slate-700">${b.registrationDate || "N/A"}</span></div>
    </div>

    ${b.coTravelers ? `
      <div class="mt-2 p-2.5 bg-slate-50 rounded-xl text-xs border border-slate-200">
        <strong>साथी यात्री:</strong> <p class="text-slate-600 mt-1">${b.coTravelers}</p>
      </div>
    ` : ""}

    ${b.specialNote ? `
      <div class="p-2.5 bg-slate-50 rounded-xl text-xs border border-slate-200">
        <strong>विशेष टिप्पणी:</strong> <p class="text-slate-600 mt-1">${b.specialNote}</p>
      </div>
    ` : ""}

    <div class="p-2 bg-emerald-50 rounded-lg text-[11px] text-emerald-800 flex items-center gap-1.5">
      <i class="fas fa-check-circle"></i> <span>यात्री ने यात्रा नियम व जोखिम अस्वीकरण (Terms & Risk) स्वीकार किया है।</span>
    </div>
  `;

  document.getElementById("bookingDetailModal").classList.remove("hidden");
}

function closeDetailModal() {
  document.getElementById("bookingDetailModal").classList.add("hidden");
}

/**
 * Toggle Status Prompt (Confirmed, Paid, Cancelled)
 */
async function toggleStatusPrompt(bookingId) {
  const current = allBookings.find(b => b.bookingId === bookingId);
  if (!current) return;

  const newStatus = prompt("नई स्थिति चुनें (Confirmed / Paid / Cancelled):", current.status || "Confirmed");
  if (!newStatus) return;

  current.status = newStatus;
  renderTable();

  // Update in Google Sheets via POST
  if (GOOGLE_SCRIPT_URL) {
    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateStatus",
          bookingId: bookingId,
          newStatus: newStatus
        })
      });
    } catch (e) {
      console.warn("Status update sent to sheet:", e);
    }
  }
}

/**
 * Check Local WhatsApp Bot Server Status
 */
async function checkWhatsAppServerStatus() {
  const statusPill = document.getElementById("adminWaStatusPill");
  const statusDot = document.getElementById("adminWaDot");
  const statusText = document.getElementById("adminWaStatusText");

  try {
    const res = await fetch(WHATSAPP_STATUS_URL);
    const data = await res.json();

    if (data.status === "connected" && data.user) {
      statusDot.className = "w-2.5 h-2.5 rounded-full bg-emerald-400";
      statusText.innerHTML = `WhatsApp 🟢 +${data.user.phone}`;
      statusPill.className = "inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-500/40";
    } else if (data.status === "qr_ready") {
      statusDot.className = "w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse";
      statusText.textContent = "WhatsApp 🟡 QR स्कैन करें";
      statusPill.className = "inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-950/60 text-amber-400 border border-amber-500/40";
    } else {
      statusDot.className = "w-2.5 h-2.5 rounded-full bg-rose-400";
      statusText.textContent = "WhatsApp 🔴 डिस्कनेक्टेड";
      statusPill.className = "inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700";
    }
  } catch (err) {
    statusDot.className = "w-2.5 h-2.5 rounded-full bg-slate-500";
    statusText.textContent = "WhatsApp बॉट ऑफ़लाइन";
    statusPill.className = "inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700";
  }
}

/**
 * Handle Manual Booking Form
 */
function initManualBookingForm() {
  const form = document.getElementById("manualBookingForm");
  const seatsInput = document.getElementById("mSeats");
  const totalDisplay = document.getElementById("mTotalAmount");

  if (seatsInput && totalDisplay) {
    seatsInput.addEventListener("input", () => {
      let count = parseInt(seatsInput.value, 10) || 1;
      totalDisplay.textContent = "₹" + (count * RATE_PER_SEAT).toLocaleString("en-IN");
    });
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById("btnSubmitManual");
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> बुकिंग दर्ज हो रही है...';

      const bookingId = "SHIVE-KSJ-" + Math.floor(1000 + Math.random() * 9000);
      const seats = parseInt(document.getElementById("mSeats").value || 1, 10);
      const totalAmount = seats * RATE_PER_SEAT;

      const payload = {
        bookingId,
        fullName: document.getElementById("mFullName").value.trim(),
        phone: document.getElementById("mPhone").value.trim(),
        email: document.getElementById("mEmail").value.trim(),
        pickupPoint: document.getElementById("mPickup").value,
        seats,
        totalAmount,
        transactionId: document.getElementById("mPaymentRef").value.trim() || "Cash / Offline",
        status: document.getElementById("mStatus").value,
        coTravelers: document.getElementById("mCoTravelers").value.trim(),
        agreedTerms: "Agreed (Yes)",
        submittedAt: new Date().toISOString()
      };

      try {
        // 1. Submit to Google Sheets
        if (GOOGLE_SCRIPT_URL) {
          await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
        }

        // 2. Submit to WhatsApp bot
        try {
          await fetch(WHATSAPP_SERVICE_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
        } catch (waErr) {}

        // Add to local array
        allBookings.unshift(payload);
        updateKPIs();
        filterAndRender();

        alert(`✅ नई बुकिंग (${bookingId}) सफलतापूर्वक दर्ज हो गई!`);
        form.reset();
        document.getElementById("mSeats").value = "1";
        totalDisplay.textContent = "₹900";
        switchTab("tabBookings");

      } catch (err) {
        alert("एरर: बुकिंग सेव नहीं हो सकी। " + err.message);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-check-circle mr-1"></i> बुकिंग दर्ज करें और WhatsApp भेजें';
      }
    });
  }
}

/**
 * Handle WhatsApp Broadcast Message Form
 */
function initBroadcastForm() {
  const form = document.getElementById("broadcastForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const target = document.getElementById("bcTarget").value;
    const message = document.getElementById("bcMessage").value.trim();

    let recipients = allBookings;
    if (target !== "ALL") {
      recipients = allBookings.filter(b => b.pickupPoint && b.pickupPoint.includes(target));
    }

    if (recipients.length === 0) {
      alert("इस श्रेणी में कोई यात्री नहीं मिला।");
      return;
    }

    if (!confirm(`${recipients.length} यात्रियों को यह संदेश उनके WhatsApp पर भेजें?`)) {
      return;
    }

    const sendBtn = document.getElementById("btnSendBroadcast");
    sendBtn.disabled = true;
    sendBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ब्रॉडकास्ट भेजा जा रहा है (0/${recipients.length})...`;

    let successCount = 0;
    for (let i = 0; i < recipients.length; i++) {
      const r = recipients[i];
      sendBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> भेजा जा रहा है (${i + 1}/${recipients.length}): ${r.fullName}...`;

      try {
        await fetch("http://localhost:5000/api/send-test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: r.phone,
            message: `🌸 *जय श्री श्याम! (ShiVe Tours सूचना)*\n\nप्रिय *${r.fullName}* जी,\n\n${message}\n\n— *ShiVe Tours and Travels*`
          })
        });
        successCount++;
        // Safe 2.5s delay between messages
        await new Promise(res => setTimeout(res, 2500));
      } catch (err) {}
    }

    sendBtn.disabled = false;
    sendBtn.innerHTML = '<i class="fab fa-whatsapp text-lg"></i> <span>सभी चयनित यात्रियों को संदेश भेजें</span>';
    alert(`✅ ब्रॉडकास्ट पूरा हुआ! ${successCount}/${recipients.length} यात्रियों को संदेश भेजा गया।`);
  });
}

function setBroadcastTemplate(type) {
  const textarea = document.getElementById("bcMessage");
  if (type === 1) {
    textarea.value = 
`कल 31 अक्टूबर 2026 को हमारी पावन खाटू श्याम जी यात्रा प्रस्थान करेगी!
⏰ कृपया निर्धारित पिकअप समय से 15 मिनट पूर्व (सुबह 08:45 AM) अपने पिकअप स्थल पर उपस्थित रहें।
गाड़ी में ऑन-बोर्ड डीजे एवं भोजन की सुंदर व्यवस्था है।
हारे का सहारा, बाबा श्याम हमारा! 🌸`;
  } else if (type === 2) {
    textarea.value = 
`यात्री सुरक्षा एवं सुविधा हेतु आवश्यक दिशा-निर्देश:
1. अपने जरूरी पहचान पत्र एवं निजी सामान का ध्यान रखें।
2. नशा व मद्यपान पूर्णतः वर्जित है।
3. किसी भी सहायता हेतु हमारे हेल्पलाइन नंबर 9243714402 पर संपर्क करें।`;
  }
}

/**
 * Print Bus Passenger Manifest
 */
function printPassengerManifest() {
  const printTable = document.getElementById("printTableBody");
  const totalSeats = document.getElementById("printTotalSeats");

  let seatsSum = 0;
  printTable.innerHTML = filteredBookings.map((b, idx) => {
    const seats = parseInt(b.seats || 1, 10);
    seatsSum += seats;
    return `
      <tr>
        <td class="border border-black p-1 text-center font-bold">${idx + 1}</td>
        <td class="border border-black p-1 font-mono">${b.bookingId}</td>
        <td class="border border-black p-1 font-bold">${b.fullName}</td>
        <td class="border border-black p-1">${b.phone}</td>
        <td class="border border-black p-1">${b.pickupPoint}</td>
        <td class="border border-black p-1 text-center font-bold">${seats}</td>
        <td class="border border-black p-1">₹${b.totalAmount || (seats * RATE_PER_SEAT)}</td>
        <td class="border border-black p-1 font-bold">${b.status || "Confirmed"}</td>
        <td class="border border-black p-1 text-center" style="width: 80px;">&nbsp;</td>
      </tr>
    `;
  }).join("");

  totalSeats.textContent = `${seatsSum} (यात्री समूह: ${filteredBookings.length})`;
  window.print();
}

/**
 * Export Bookings to CSV
 */
function exportToCSV() {
  if (allBookings.length === 0) {
    alert("डाउनलोड करने के लिए कोई बुकिंग उपलब्ध नहीं है।");
    return;
  }

  const headers = ["Booking ID", "Date", "Full Name", "Phone", "Email", "Pickup Point", "Seats", "Total Fare", "Transaction ID", "Status", "Special Note"];
  const rows = allBookings.map(b => [
    `"${b.bookingId || ""}"`,
    `"${b.registrationDate || ""}"`,
    `"${b.fullName || ""}"`,
    `"${b.phone || ""}"`,
    `"${b.email || ""}"`,
    `"${b.pickupPoint || ""}"`,
    `"${b.seats || 1}"`,
    `"${b.totalAmount || 900}"`,
    `"${b.transactionId || ""}"`,
    `"${b.status || "Confirmed"}"`,
    `"${b.specialNote || ""}"`
  ]);

  let csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `ShiVe_Tours_Khatushyamji_Bookings_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
