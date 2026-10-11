/**
 * ==============================================================================
 * ShiVe Tours and Travels - Admin Panel Engine
 * Live Google Sheets Connection + WhatsApp Dispatcher Management
 * ==============================================================================
 */

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwEwzrbFi8Uyg1Lu3LrNtuGG1tErjPApHbNWTB6wt2AgcznWbA_Clh_fWpf1XC0dKXIDQ/exec";
const WHATSAPP_SERVICE_URL = "http://localhost:5000/api/send-confirmation";
const WHATSAPP_STATUS_URL = "http://localhost:5000/api/status";

function getAdminRatePerSeat() {
  return (typeof getSiteConfig === "function" ? getSiteConfig().tripFare : 900) || 900;
}

let allBookings = [];
let filteredBookings = [];

document.addEventListener("DOMContentLoaded", () => {
  checkAdminAuth();
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

  if (tabId === "tabSettings") {
    loadConfigToForm();
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
    totalRevenue += (b.totalAmount ? Number(b.totalAmount) : (seats * getAdminRatePerSeat()));

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
      totalDisplay.textContent = "₹" + (count * getAdminRatePerSeat()).toLocaleString("en-IN");
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
      const totalAmount = seats * getAdminRatePerSeat();

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
        totalDisplay.textContent = "₹" + getAdminRatePerSeat();
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
        <td class="border border-black p-1">₹${b.totalAmount || (seats * getAdminRatePerSeat())}</td>
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

// ==============================================================================
// ADMIN AUTHENTICATION & SECURITY SYSTEM
// Password protected access: "khatushyam-31-10-2026"
// ==============================================================================

const ADMIN_PASSWORD_REQUIRED = "khatushyam-31-10-2026";
const ADMIN_AUTH_STORAGE_KEY = "shive_admin_auth";

function checkAdminAuth() {
  const overlay = document.getElementById("adminAuthOverlay");
  if (!overlay) return;
  const isAuth = sessionStorage.getItem(ADMIN_AUTH_STORAGE_KEY) === "authenticated" ||
                 localStorage.getItem(ADMIN_AUTH_STORAGE_KEY) === "authenticated";
  if (isAuth) {
    overlay.classList.add("hidden");
  } else {
    overlay.classList.remove("hidden");
    const pwdInput = document.getElementById("adminPasswordInput");
    if (pwdInput) {
      setTimeout(() => pwdInput.focus(), 150);
    }
  }
}

function handleAdminLogin(event) {
  if (event) event.preventDefault();
  const input = document.getElementById("adminPasswordInput");
  const errBox = document.getElementById("adminAuthError");
  if (!input) return;

  const entered = input.value.trim();
  if (entered === ADMIN_PASSWORD_REQUIRED) {
    sessionStorage.setItem(ADMIN_AUTH_STORAGE_KEY, "authenticated");
    localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, "authenticated");
    const overlay = document.getElementById("adminAuthOverlay");
    if (overlay) overlay.classList.add("hidden");
    if (errBox) errBox.classList.add("hidden");
    input.value = "";
    input.classList.remove("border-red-500");
    showToastAlert("व्यवस्थापक पोर्टल सफलतापूर्वक अनलॉक हो गया!", "success");
  } else {
    if (errBox) errBox.classList.remove("hidden");
    input.classList.add("border-red-500");
    input.select();
  }
}

function togglePasswordVisibility() {
  const input = document.getElementById("adminPasswordInput");
  const eye = document.getElementById("eyeIcon");
  if (!input || !eye) return;
  if (input.type === "password") {
    input.type = "text";
    eye.className = "far fa-eye-slash";
  } else {
    input.type = "password";
    eye.className = "far fa-eye";
  }
}

function logoutAdmin() {
  sessionStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
  localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
  const overlay = document.getElementById("adminAuthOverlay");
  if (overlay) overlay.classList.remove("hidden");
  const pwdInput = document.getElementById("adminPasswordInput");
  if (pwdInput) {
    pwdInput.value = "";
    pwdInput.classList.remove("border-red-500");
    setTimeout(() => pwdInput.focus(), 100);
  }
  const errBox = document.getElementById("adminAuthError");
  if (errBox) errBox.classList.add("hidden");
  showToastAlert("व्यवस्थापक पोर्टल लॉक कर दिया गया है।", "info");
}

// ==============================================================================
// CENTRAL CONTENT MANAGEMENT SYSTEM (CMS) LOGIC
// Controls all texts, pricing, dates, contact details and images
// ==============================================================================

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) {
    el.value = (val !== undefined && val !== null) ? val : "";
  }
}

function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

function updateLogoPreview(url) {
  const img = document.getElementById("adminLogoPreview");
  const ph = document.getElementById("adminLogoPlaceholder");
  if (!img) return;
  if (url && url.trim() !== "") {
    img.src = url;
    img.classList.remove("hidden");
    if (ph) ph.classList.add("hidden");
  } else {
    img.src = "";
    img.classList.add("hidden");
    if (ph) ph.classList.remove("hidden");
  }
}

function clearLogoImage() {
  setVal("adminCfgLogoImage", "");
  updateLogoPreview("");
}

function handleImageFileUpload(event, inputId, previewImgId, placeholderId) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const dataUri = e.target.result;
    setVal(inputId, dataUri);
    const preview = document.getElementById(previewImgId);
    if (preview) {
      preview.src = dataUri;
      preview.classList.remove("hidden");
    }
    if (placeholderId) {
      const ph = document.getElementById(placeholderId);
      if (ph) ph.classList.add("hidden");
    }
    showToastAlert("तस्वीर सफलतापूर्वक अपलोड हो गई!", "success");
  };
  reader.readAsDataURL(file);
}

function loadConfigToForm() {
  const cfg = typeof getSiteConfig === "function" ? getSiteConfig() : (window.DEFAULT_CONFIG || {});

  // 1. Branding & Contacts
  setVal("adminCfgAgencyName", cfg.agencyName);
  setVal("adminCfgLogoImage", cfg.logoImage);
  updateLogoPreview(cfg.logoImage);
  setVal("adminCfgAgencyTagline_hi", cfg.agencyTagline_hi);
  setVal("adminCfgAgencyTagline_en", cfg.agencyTagline_en);
  setVal("adminCfgPhone", cfg.phone);
  setVal("adminCfgWhatsapp", cfg.whatsapp);
  setVal("adminCfgEmail", cfg.email);
  setVal("adminCfgUpiId", cfg.upiId);
  setVal("adminCfgAddress_hi", cfg.address_hi);
  setVal("adminCfgAddress_en", cfg.address_en);

  // 2. Trip Details
  setVal("adminCfgDestination_hi", cfg.destination_hi);
  setVal("adminCfgDestination_en", cfg.destination_en);
  setVal("adminCfgTripDateDisplay_hi", cfg.tripDateDisplay_hi);
  setVal("adminCfgTripDateDisplay_en", cfg.tripDateDisplay_en);
  setVal("adminCfgTripTimeDisplay_hi", cfg.tripTimeDisplay_hi);
  setVal("adminCfgTripTimeDisplay_en", cfg.tripTimeDisplay_en);
  setVal("adminCfgTripDateStr", cfg.tripDateStr);
  setVal("adminCfgTripFare", cfg.tripFare);
  setVal("adminCfgTripFareNote_hi", cfg.tripFareNote_hi);
  setVal("adminCfgTripFareNote_en", cfg.tripFareNote_en);

  // 3. Ticker & Hero Texts
  setVal("adminCfgTicker_hi", cfg.ticker_hi);
  setVal("adminCfgTicker_en", cfg.ticker_en);
  setVal("adminCfgHeroBadge_hi", cfg.heroBadge_hi);
  setVal("adminCfgHeroBadge_en", cfg.heroBadge_en);
  setVal("adminCfgHeroTitle_hi", cfg.heroTitle_hi);
  setVal("adminCfgHeroTitle_en", cfg.heroTitle_en);
  setVal("adminCfgHeroTitleSub_hi", cfg.heroTitleSub_hi);
  setVal("adminCfgHeroTitleSub_en", cfg.heroTitleSub_en);
  setVal("adminCfgHeroSubtitle_hi", cfg.heroSubtitle_hi);
  setVal("adminCfgHeroSubtitle_en", cfg.heroSubtitle_en);
  setVal("adminCfgHeroBtnBook_hi", cfg.heroBtnBook_hi);
  setVal("adminCfgHeroBtnBook_en", cfg.heroBtnBook_en);
  setVal("adminCfgHeroBtnItin_hi", cfg.heroBtnItin_hi);
  setVal("adminCfgHeroBtnItin_en", cfg.heroBtnItin_en);

  // 4. Pickup Points
  setVal("adminCfgPickup1_name_hi", cfg.pickup1_name_hi);
  setVal("adminCfgPickup1_name_en", cfg.pickup1_name_en);
  setVal("adminCfgPickup1_time_hi", cfg.pickup1_time_hi);
  setVal("adminCfgPickup1_time_en", cfg.pickup1_time_en);
  setVal("adminCfgPickup2_name_hi", cfg.pickup2_name_hi);
  setVal("adminCfgPickup2_name_en", cfg.pickup2_name_en);
  setVal("adminCfgPickup2_time_hi", cfg.pickup2_time_hi);
  setVal("adminCfgPickup2_time_en", cfg.pickup2_time_en);

  // 5. Features
  setVal("adminCfgFeatFoodTitle_hi", cfg.featureFoodTitle_hi);
  setVal("adminCfgFeatFoodTitle_en", cfg.featureFoodTitle_en);
  setVal("adminCfgFeatFoodDesc_hi", cfg.featureFoodDesc_hi);
  setVal("adminCfgFeatFoodDesc_en", cfg.featureFoodDesc_en);

  setVal("adminCfgFeatDjTitle_hi", cfg.featureDjTitle_hi);
  setVal("adminCfgFeatDjTitle_en", cfg.featureDjTitle_en);
  setVal("adminCfgFeatDjDesc_hi", cfg.featureDjDesc_hi);
  setVal("adminCfgFeatDjDesc_en", cfg.featureDjDesc_en);

  setVal("adminCfgFeatBusTitle_hi", cfg.featureBusTitle_hi);
  setVal("adminCfgFeatBusTitle_en", cfg.featureBusTitle_en);
  setVal("adminCfgFeatBusDesc_hi", cfg.featureBusDesc_hi);
  setVal("adminCfgFeatBusDesc_en", cfg.featureBusDesc_en);

  setVal("adminCfgFeatPickupTitle_hi", cfg.featurePickupTitle_hi);
  setVal("adminCfgFeatPickupTitle_en", cfg.featurePickupTitle_en);
  setVal("adminCfgFeatPickupDesc_hi", cfg.featurePickupDesc_hi);
  setVal("adminCfgFeatPickupDesc_en", cfg.featurePickupDesc_en);

  // 6. Temple Darshan
  setVal("adminCfgTempleTitle_hi", cfg.templeTitle_hi);
  setVal("adminCfgTempleTitle_en", cfg.templeTitle_en);
  setVal("adminCfgTempleDesc_hi", cfg.templeDesc_hi);
  setVal("adminCfgTempleDesc_en", cfg.templeDesc_en);

  // 7. Images
  setVal("adminCfgHeroImage", cfg.heroImage);
  const heroPrev = document.getElementById("adminHeroPreview");
  if (heroPrev && cfg.heroImage) heroPrev.src = cfg.heroImage;

  setVal("adminCfgTempleImage", cfg.templeImage);
  const templePrev = document.getElementById("adminTemplePreview");
  if (templePrev && cfg.templeImage) templePrev.src = cfg.templeImage;
}

async function saveAllAdminSettings() {
  const current = typeof getSiteConfig === "function" ? getSiteConfig() : {};
  const phone = getVal("adminCfgPhone");
  const wa = getVal("adminCfgWhatsapp");

  const updated = {
    ...current,
    agencyName: getVal("adminCfgAgencyName") || "ShiVe Tours & Travels",
    logoImage: getVal("adminCfgLogoImage"),
    agencyTagline_hi: getVal("adminCfgAgencyTagline_hi"),
    agencyTagline_en: getVal("adminCfgAgencyTagline_en"),
    phone: phone,
    phoneRaw: phone.replace(/\D/g, ""),
    whatsapp: wa,
    whatsappRaw: wa.replace(/\D/g, ""),
    email: getVal("adminCfgEmail"),
    upiId: getVal("adminCfgUpiId"),
    address_hi: getVal("adminCfgAddress_hi"),
    address_en: getVal("adminCfgAddress_en"),

    destination_hi: getVal("adminCfgDestination_hi"),
    destination_en: getVal("adminCfgDestination_en"),
    tripDateDisplay_hi: getVal("adminCfgTripDateDisplay_hi"),
    tripDateDisplay_en: getVal("adminCfgTripDateDisplay_en"),
    tripTimeDisplay_hi: getVal("adminCfgTripTimeDisplay_hi"),
    tripTimeDisplay_en: getVal("adminCfgTripTimeDisplay_en"),
    tripDateStr: getVal("adminCfgTripDateStr"),
    tripFare: parseInt(getVal("adminCfgTripFare"), 10) || 900,
    tripFareNote_hi: getVal("adminCfgTripFareNote_hi"),
    tripFareNote_en: getVal("adminCfgTripFareNote_en"),

    ticker_hi: getVal("adminCfgTicker_hi"),
    ticker_en: getVal("adminCfgTicker_en"),
    heroBadge_hi: getVal("adminCfgHeroBadge_hi"),
    heroBadge_en: getVal("adminCfgHeroBadge_en"),
    heroTitle_hi: getVal("adminCfgHeroTitle_hi"),
    heroTitle_en: getVal("adminCfgHeroTitle_en"),
    heroTitleSub_hi: getVal("adminCfgHeroTitleSub_hi"),
    heroTitleSub_en: getVal("adminCfgHeroTitleSub_en"),
    heroSubtitle_hi: getVal("adminCfgHeroSubtitle_hi"),
    heroSubtitle_en: getVal("adminCfgHeroSubtitle_en"),
    heroBtnBook_hi: getVal("adminCfgHeroBtnBook_hi"),
    heroBtnBook_en: getVal("adminCfgHeroBtnBook_en"),
    heroBtnItin_hi: getVal("adminCfgHeroBtnItin_hi"),
    heroBtnItin_en: getVal("adminCfgHeroBtnItin_en"),

    pickup1_name_hi: getVal("adminCfgPickup1_name_hi"),
    pickup1_name_en: getVal("adminCfgPickup1_name_en"),
    pickup1_time_hi: getVal("adminCfgPickup1_time_hi"),
    pickup1_time_en: getVal("adminCfgPickup1_time_en"),
    pickup2_name_hi: getVal("adminCfgPickup2_name_hi"),
    pickup2_name_en: getVal("adminCfgPickup2_name_en"),
    pickup2_time_hi: getVal("adminCfgPickup2_time_hi"),
    pickup2_time_en: getVal("adminCfgPickup2_time_en"),

    featureFoodTitle_hi: getVal("adminCfgFeatFoodTitle_hi"),
    featureFoodTitle_en: getVal("adminCfgFeatFoodTitle_en"),
    featureFoodDesc_hi: getVal("adminCfgFeatFoodDesc_hi"),
    featureFoodDesc_en: getVal("adminCfgFeatFoodDesc_en"),

    featureDjTitle_hi: getVal("adminCfgFeatDjTitle_hi"),
    featureDjTitle_en: getVal("adminCfgFeatDjTitle_en"),
    featureDjDesc_hi: getVal("adminCfgFeatDjDesc_hi"),
    featureDjDesc_en: getVal("adminCfgFeatDjDesc_en"),

    featureBusTitle_hi: getVal("adminCfgFeatBusTitle_hi"),
    featureBusTitle_en: getVal("adminCfgFeatBusTitle_en"),
    featureBusDesc_hi: getVal("adminCfgFeatBusDesc_hi"),
    featureBusDesc_en: getVal("adminCfgFeatBusDesc_en"),

    featurePickupTitle_hi: getVal("adminCfgFeatPickupTitle_hi"),
    featurePickupTitle_en: getVal("adminCfgFeatPickupTitle_en"),
    featurePickupDesc_hi: getVal("adminCfgFeatPickupDesc_hi"),
    featurePickupDesc_en: getVal("adminCfgFeatPickupDesc_en"),

    templeTitle_hi: getVal("adminCfgTempleTitle_hi"),
    templeTitle_en: getVal("adminCfgTempleTitle_en"),
    templeDesc_hi: getVal("adminCfgTempleDesc_hi"),
    templeDesc_en: getVal("adminCfgTempleDesc_en"),

    heroImage: getVal("adminCfgHeroImage"),
    templeImage: getVal("adminCfgTempleImage")
  };

  if (typeof saveSiteConfig === "function") {
    await saveSiteConfig(updated);
  } else {
    localStorage.setItem("shive_site_config", JSON.stringify(updated));
  }

  showToastAlert("बधाई! सभी बदलाव वेबसाइट पर तुरंत लागू हो गए हैं।", "success");
}

async function resetAllAdminSettings() {
  if (confirm("क्या आप वाकई सभी वेबसाइट सेटिंग्स को मूल डिफ़ॉल्ट पर रीसेट करना चाहते हैं?")) {
    if (typeof resetSiteConfig === "function") {
      await resetSiteConfig();
    } else {
      localStorage.removeItem("shive_site_config");
    }
    loadConfigToForm();
    showToastAlert("सभी सेटिंग्स मूल डिफ़ॉल्ट पर रीसेट कर दी गईं।", "info");
  }
}

function exportConfigJson() {
  const cfg = typeof getSiteConfig === "function" ? getSiteConfig() : (window.DEFAULT_CONFIG || {});
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cfg, null, 2));
  const dlAnchorElem = document.createElement("a");
  dlAnchorElem.setAttribute("href", dataStr);
  dlAnchorElem.setAttribute("download", `shive_tours_config_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(dlAnchorElem);
  dlAnchorElem.click();
  document.body.removeChild(dlAnchorElem);
}

function handleImportFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const parsed = JSON.parse(e.target.result);
      if (typeof saveSiteConfig === "function") {
        await saveSiteConfig(parsed);
      } else {
        localStorage.setItem("shive_site_config", JSON.stringify(parsed));
      }
      loadConfigToForm();
      showToastAlert("बैकअप कॉन्फ़िगरेशन सफलतापूर्वक रीस्टोर कर लिया गया!", "success");
    } catch (err) {
      alert("अमान्य JSON फ़ाइल। कृपया सही कॉन्फ़िगरेशन फ़ाइल चुनें।");
    }
  };
  reader.readAsText(file);
}

function showToastAlert(message, type = "success") {
  let toastContainer = document.getElementById("adminToastContainer");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "adminToastContainer";
    toastContainer.className = "fixed bottom-5 right-5 z-[99999] flex flex-col gap-2 pointer-events-none";
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement("div");
  const bg = type === "success" ? "bg-emerald-600" : (type === "error" ? "bg-red-600" : "bg-indigo-600");
  const icon = type === "success" ? "fa-check-circle" : (type === "error" ? "fa-exclamation-circle" : "fa-info-circle");
  toast.className = `${bg} text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold pointer-events-auto transition-all duration-300 transform translate-y-3 opacity-0`;
  toast.innerHTML = `<i class="fas ${icon} text-base"></i> <span>${message}</span>`;
  toastContainer.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove("translate-y-3", "opacity-0");
  });

  setTimeout(() => {
    toast.classList.add("opacity-0", "translate-y-3");
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

// Live URL Input Listeners for Images
document.addEventListener("DOMContentLoaded", () => {
  const logoInp = document.getElementById("adminCfgLogoImage");
  if (logoInp) {
    logoInp.addEventListener("input", (e) => updateLogoPreview(e.target.value));
  }
  const heroInp = document.getElementById("adminCfgHeroImage");
  if (heroInp) {
    heroInp.addEventListener("input", (e) => {
      const prev = document.getElementById("adminHeroPreview");
      if (prev && e.target.value) prev.src = e.target.value;
    });
  }
  const templeInp = document.getElementById("adminCfgTempleImage");
  if (templeInp) {
    templeInp.addEventListener("input", (e) => {
      const prev = document.getElementById("adminTemplePreview");
      if (prev && e.target.value) prev.src = e.target.value;
    });
  }
});

