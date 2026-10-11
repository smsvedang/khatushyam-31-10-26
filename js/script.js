/**
 * ==============================================================================
 * ShiVe Tours and Travels - Khatushyam Ji Trip 2026
 * Interactive Frontend Engine & Google Apps Script Sheet Connector
 * ==============================================================================
 */

// ⚙️ CONFIGURATION: Paste your Google Apps Script Web App URL below:
// Example: "https://script.google.com/macros/s/AKfycbx.../exec"
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwEwzrbFi8Uyg1Lu3LrNtuGG1tErjPApHbNWTB6wt2AgcznWbA_Clh_fWpf1XC0dKXIDQ/exec"; 

// 📲 WhatsApp Web Automation Service (Local Node.js Bot)
const WHATSAPP_SERVICE_URL = "http://localhost:5000/api/send-confirmation";
const WHATSAPP_STATUS_URL = "http://localhost:5000/api/status";

// Trip Constants
const RATE_PER_SEAT = 900;
const TRIP_DATE_STR = "2026-10-31T09:00:00+05:30";
const AGENCY_PHONE = "919243714402"; // Organizers WhatsApp/Call number
const AGENCY_NAME = "ShiVe Tours and Travels";

document.addEventListener("DOMContentLoaded", () => {
  initCountdown();
  initFormInteractions();
  initParticleEffects();
  initDevotionalAudio();
  initTermsModal();
  checkWhatsAppBotStatus();
});

/* ==============================================================================
   1. Live Countdown Timer (Target: 31 Oct 2026, 09:00 AM)
   ============================================================================== */
function initCountdown() {
  const targetDate = new Date(TRIP_DATE_STR).getTime();

  function updateTimer() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance <= 0) {
      document.getElementById("timerDays").textContent = "00";
      document.getElementById("timerHours").textContent = "00";
      document.getElementById("timerMinutes").textContent = "00";
      document.getElementById("timerSeconds").textContent = "00";
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const pad = (n) => String(n).padStart(2, "0");
    const dElem = document.getElementById("timerDays");
    const hElem = document.getElementById("timerHours");
    const mElem = document.getElementById("timerMinutes");
    const sElem = document.getElementById("timerSeconds");

    if (dElem) dElem.textContent = pad(days);
    if (hElem) hElem.textContent = pad(hours);
    if (mElem) mElem.textContent = pad(minutes);
    if (sElem) sElem.textContent = pad(seconds);
  }

  updateTimer();
  setInterval(updateTimer, 1000);
}

/* ==============================================================================
   2. Form Calculations & Submission to Google Sheets
   ============================================================================== */
function initFormInteractions() {
  const seatsInput = document.getElementById("seatCount");
  const totalAmountElem = document.getElementById("liveTotalAmount");
  const summarySeatsElem = document.getElementById("summarySeatCount");
  const coTravelersGroup = document.getElementById("coTravelersGroup");
  const bookingForm = document.getElementById("khatuBookingForm");
  const submitBtn = document.getElementById("submitBtn");
  const btnText = document.getElementById("btnText");
  const btnSpinner = document.getElementById("btnSpinner");

  // Dynamic price calculation
  if (seatsInput) {
    seatsInput.addEventListener("input", () => {
      let count = parseInt(seatsInput.value, 10);
      if (isNaN(count) || count < 1) count = 1;
      if (count > 20) count = 20;

      const total = count * RATE_PER_SEAT;
      if (totalAmountElem) totalAmountElem.textContent = "₹" + total.toLocaleString("en-IN");
      if (summarySeatsElem) summarySeatsElem.textContent = count;

      // Show co-travelers field if more than 1 seat
      if (coTravelersGroup) {
        if (count > 1) {
          coTravelersGroup.style.display = "block";
          document.getElementById("coTravelers").setAttribute("placeholder", `कृपया बाकी ${count - 1} यात्रियों के नाम दर्ज करें`);
        } else {
          coTravelersGroup.style.display = "none";
        }
      }
    });
  }

  // Copy UPI ID button
  const copyUpiBtn = document.getElementById("copyUpiBtn");
  if (copyUpiBtn) {
    copyUpiBtn.addEventListener("click", () => {
      const upiId = document.getElementById("upiIdText").innerText.trim();
      navigator.clipboard.writeText(upiId).then(() => {
        copyUpiBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => {
          copyUpiBtn.innerHTML = '<i class="far fa-copy"></i> Copy';
        }, 2000);
      }).catch(() => {
        alert("UPI ID: " + upiId);
      });
    });
  }

  // Handle Form Submit
  if (bookingForm) {
    bookingForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Check Terms & Liability Checkbox
      const agreedTerms = document.getElementById("termsAgreeCheckbox");
      if (!agreedTerms || !agreedTerms.checked) {
        showCustomAlert("कृपया यात्रा नियम, जोखिम व अस्वीकरण (Terms & Risk Disclaimer) चेकबॉक्स पर टिक करके सहमति प्रदान करें।", "warning");
        const termsCard = document.querySelector(".terms-liability-card");
        if (termsCard) {
          termsCard.scrollIntoView({ behavior: "smooth", block: "center" });
          termsCard.style.outline = "3px solid #DC2626";
          setTimeout(() => { termsCard.style.outline = "none"; }, 3000);
        }
        return;
      }

      // Collect form values
      const fullName = document.getElementById("fullName").value.trim();
      const phone = document.getElementById("phoneNumber").value.trim();
      const altPhone = document.getElementById("altPhoneNumber").value.trim();
      const email = document.getElementById("emailAddress").value.trim();
      const pickupPoint = document.querySelector('input[name="pickupLocation"]:checked')?.value || "Amity University Jaipur";
      const seats = parseInt(document.getElementById("seatCount").value || "1", 10);
      const coTravelers = document.getElementById("coTravelers")?.value.trim() || "";
      const transactionId = document.getElementById("transactionId")?.value.trim() || "Pay on Board / Pending";
      const specialNote = document.getElementById("specialNote")?.value.trim() || "";
      const totalAmount = seats * RATE_PER_SEAT;

      // Phone validation
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(phone)) {
        showCustomAlert("कृपया 10 अंकों का वैध भारतीय मोबाइल नंबर दर्ज करें।", "error");
        document.getElementById("phoneNumber").focus();
        return;
      }

      // Prepare Submission Payload
      const payload = {
        fullName,
        phone,
        altPhone,
        email,
        pickupPoint,
        seats,
        totalAmount,
        coTravelers,
        transactionId,
        specialNote,
        agreedTerms: "Agreed (Yes)",
        submittedAt: new Date().toISOString()
      };

      // Set Loading State
      submitBtn.disabled = true;
      btnText.textContent = "बुकिंग दर्ज हो रही है... (Saving to Sheets)";
      btnSpinner.style.display = "inline-block";

      try {
        let bookingId = "SHIVE-KSJ-" + Math.floor(1000 + Math.random() * 9000);

        // 1. Submit to Google Sheets (code.gs)
        if (GOOGLE_SCRIPT_URL && GOOGLE_SCRIPT_URL.trim() !== "" && !GOOGLE_SCRIPT_URL.includes("PASTE_YOUR")) {
          try {
            await fetch(GOOGLE_SCRIPT_URL, {
              method: "POST",
              mode: "no-cors",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify(payload)
            });
            console.log("Data saved to Google Sheets successfully!");
          } catch (scriptErr) {
            console.warn("Fetch to Google Script encountered network warning:", scriptErr);
          }
        }

        // 2. Automatically Send WhatsApp Message from Linked WhatsApp Web
        let waStatusResult = "offline"; // "sent", "queued", "offline"
        try {
          btnText.textContent = "व्हाट्सएप संदेश भेजा जा रहा है... (Sending WhatsApp)";
          const waResponse = await fetch(WHATSAPP_SERVICE_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          const waResult = await waResponse.json();
          if (waResult.success) {
            if (waResult.queued) {
              waStatusResult = "queued";
            } else {
              waStatusResult = "sent";
            }
            console.log("WhatsApp dispatch result:", waResult);
          }
        } catch (waErr) {
          console.log("Local WhatsApp Web bot service is not running or offline:", waErr.message);
          saveOfflineBooking(payload);
          waStatusResult = "offline";
        }

        payload.waStatusResult = waStatusResult;

        // Store recent booking in localStorage
        payload.bookingId = bookingId;
        localStorage.setItem("last_shive_booking", JSON.stringify(payload));

        // Celebrate with confetti
        triggerConfetti();

        // Show Success Receipt Modal
        showReceiptModal(payload);

        // Reset form
        bookingForm.reset();
        document.getElementById("seatCount").value = "1";
        if (totalAmountElem) totalAmountElem.textContent = "₹900";
        if (summarySeatsElem) summarySeatsElem.textContent = "1";
        if (coTravelersGroup) coTravelersGroup.style.display = "none";

      } catch (err) {
        console.error("Booking error:", err);
        showCustomAlert("बुकिंग दर्ज करने में समस्या आई। कृपया इंटरनेट कनेक्शन जांचें या सीधे व्हाट्सएप पर संपर्क करें।", "error");
      } finally {
        submitBtn.disabled = false;
        btnText.textContent = "🙏 सीट कन्फर्म करें (Confirm Booking)";
        btnSpinner.style.display = "none";
      }
    });
  }
}

/* ==============================================================================
   Offline Bookings Synchronization Helpers
   ============================================================================== */
function saveOfflineBooking(booking) {
  try {
    const list = JSON.parse(localStorage.getItem("shive_unsent_bookings") || "[]");
    list.push(booking);
    localStorage.setItem("shive_unsent_bookings", JSON.stringify(list));
    console.log("Booking saved to browser offline queue. Will sync when server starts.");
  } catch (e) {}
}

async function syncOfflineBookings() {
  try {
    const list = JSON.parse(localStorage.getItem("shive_unsent_bookings") || "[]");
    if (!list || list.length === 0) return;

    const res = await fetch("http://localhost:5000/api/enqueue-pending", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookings: list })
    });
    const result = await res.json();
    if (result.success) {
      console.log(`Synced ${list.length} offline booking(s) to WhatsApp server queue!`);
      localStorage.removeItem("shive_unsent_bookings");
    }
  } catch (e) {
    // Server still offline
  }
}

/* ==============================================================================
   3. Receipt Modal & WhatsApp Share
   ============================================================================== */
function showReceiptModal(data) {
  const receiptModal = document.getElementById("bookingReceiptModal");
  if (!receiptModal) return;

  document.getElementById("receiptBookingId").textContent = data.bookingId;
  document.getElementById("receiptName").textContent = data.fullName;
  document.getElementById("receiptPhone").textContent = data.phone;
  document.getElementById("receiptEmail").textContent = data.email;
  document.getElementById("receiptPickup").textContent = data.pickupPoint;
  document.getElementById("receiptSeats").textContent = data.seats + " Seat(s)";
  document.getElementById("receiptAmount").textContent = "₹" + data.totalAmount.toLocaleString("en-IN");
  document.getElementById("receiptDate").textContent = "31 अक्टूबर 2026 (प्रातः 09:00 AM)";

  // Dynamic WhatsApp Status Notice
  const statusNotice = document.getElementById("receiptWhatsAppStatusNotice");
  const statusText = document.getElementById("receiptWhatsAppStatusText");
  if (statusNotice && statusText) {
    if (data.waStatusResult === "sent") {
      statusNotice.style.background = "#F0FDF4";
      statusNotice.style.borderColor = "#86EFAC";
      statusNotice.style.color = "#166534";
      statusText.innerHTML = `<strong>✅ बधाई हो!</strong> आपके व्हाट्सएप नंबर <strong>(${data.phone})</strong> पर बुकिंग कन्फर्मेशन संदेश स्वतः भेज दिया गया है।`;
    } else if (data.waStatusResult === "queued") {
      statusNotice.style.background = "#FEF3C7";
      statusNotice.style.borderColor = "#FDE68A";
      statusNotice.style.color = "#B45309";
      statusText.innerHTML = `<strong>⏳ सुरक्षित कतार (Queue):</strong> व्हाट्सएप अभी कनेक्ट नहीं है, संदेश पेंडिंग लिस्ट में सुरक्षित कर लिया गया है। जैसे ही WhatsApp कनेक्ट होगा, संदेश स्वतः पहुँच जाएगा!`;
    } else {
      statusNotice.style.background = "#FFFBEB";
      statusNotice.style.borderColor = "#FDE68A";
      statusNotice.style.color = "#92400E";
      statusText.innerHTML = `<strong>ℹ️ ऑफ़लाइन सुरक्षित:</strong> व्हाट्सएप बॉट सर्वर अभी बंद है। जब भी सर्वर चालू होगा, पेंडिंग संदेश स्वतः चला जाएगा (या आप नीचे 'WhatsApp पर भेजें' बटन से अभी भेज सकते हैं)।`;
    }
  }

  // Dynamic WhatsApp button
  const waBtn = document.getElementById("btnWhatsAppReceipt");
  if (waBtn) {
    const waText = encodeURIComponent(
      `🙏 *जय श्री श्याम! नई सीट बुकिंग रसीद*\n\n` +
      `*एजेंसी:* ${AGENCY_NAME}\n` +
      `*बुकिंग आईडी:* ${data.bookingId}\n` +
      `*यात्री का नाम:* ${data.fullName}\n` +
      `*फोन नंबर:* ${data.phone}\n` +
      `*पिकअप पॉइंट:* ${data.pickupPoint}\n` +
      `*सीट संख्या:* ${data.seats}\n` +
      `*कुल शुल्क:* ₹${data.totalAmount}\n` +
      `*यात्रा दिनांक:* 31-10-2026 (09:00 AM)\n` +
      `*नियम व जोखिम सहमति:* स्वीकृत (Agreed at Own Risk)\n\n` +
      `कृपया मेरी सीट सुरक्षित रखें। धन्यवाद!`
    );
    waBtn.href = `https://wa.me/${AGENCY_PHONE}?text=${waText}`;
  }

  // Print button
  const printBtn = document.getElementById("btnPrintReceipt");
  if (printBtn) {
    printBtn.onclick = () => window.print();
  }

  receiptModal.classList.add("active");
}

/* ==============================================================================
   Check WhatsApp Bot Status (Live indicator in Navbar & Auto-Sync)
   ============================================================================== */
async function checkWhatsAppBotStatus() {
  const navStatus = document.getElementById("navWaStatus");

  try {
    const res = await fetch(WHATSAPP_STATUS_URL);
    const data = await res.json();
    if (navStatus) {
      if (data.status === "connected") {
        navStatus.innerHTML = `WhatsApp Bot 🟢 ${data.pendingCount > 0 ? `(${data.pendingCount} Pending)` : ''}`;
        navStatus.parentElement.style.borderColor = "#22C55E";
        navStatus.parentElement.style.color = "#15803D";
      } else if (data.status === "qr_ready") {
        navStatus.innerHTML = "WhatsApp Bot 🟡 (Scan QR)";
        navStatus.parentElement.style.borderColor = "#F59E0B";
        navStatus.parentElement.style.color = "#B45309";
      } else {
        navStatus.innerHTML = "WhatsApp Bot ⚪";
      }
    }

    // Auto-sync any offline saved bookings if server is online!
    syncOfflineBookings();

  } catch (e) {
    if (navStatus) navStatus.innerHTML = "WhatsApp Bot";
  }
}

// Background poll to keep status and queue sync fresh every 10 seconds
setInterval(checkWhatsAppBotStatus, 10000);

function closeReceiptModal() {
  const receiptModal = document.getElementById("bookingReceiptModal");
  if (receiptModal) receiptModal.classList.remove("active");
}

/* ==============================================================================
   4. Terms & Conditions Modal
   ============================================================================== */
function initTermsModal() {
  const modal = document.getElementById("termsModal");
  const openLink = document.getElementById("openTermsModalBtn");
  const closeBtn = document.getElementById("closeTermsModalBtn");
  const acceptBtn = document.getElementById("acceptTermsModalBtn");
  const checkbox = document.getElementById("termsAgreeCheckbox");

  if (openLink && modal) {
    openLink.addEventListener("click", (e) => {
      e.preventDefault();
      modal.classList.add("active");
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener("click", () => {
      modal.classList.remove("active");
    });
  }

  if (acceptBtn && modal) {
    acceptBtn.addEventListener("click", () => {
      if (checkbox) checkbox.checked = true;
      modal.classList.remove("active");
    });
  }

  // Close when clicking backdrop
  window.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("active");
    const receiptModal = document.getElementById("bookingReceiptModal");
    if (e.target === receiptModal) receiptModal.classList.remove("active");
  });
}

/* ==============================================================================
   5. Devotional Audio Synthesizer (Bells & Melodious Ambient Tone)
   ============================================================================== */
let audioCtx = null;
let isAudioPlaying = false;
let audioInterval = null;

function initDevotionalAudio() {
  const audioBtn = document.getElementById("toggleAudioBtn");
  const audioText = document.getElementById("audioBtnText");
  const eqBar = document.getElementById("eqBar");

  if (!audioBtn) return;

  audioBtn.addEventListener("click", () => {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    if (!isAudioPlaying) {
      isAudioPlaying = true;
      if (audioText) audioText.textContent = "संगीत बंद करें";
      if (eqBar) eqBar.style.display = "inline-flex";
      startDevotionalChimes();
    } else {
      isAudioPlaying = false;
      if (audioText) audioText.textContent = "भजन / धुन बजाएं";
      if (eqBar) eqBar.style.display = "none";
      if (audioInterval) clearInterval(audioInterval);
    }
  });
}

function playTempleBell(freq = 528, duration = 2.5) {
  if (!audioCtx || !isAudioPlaying) return;

  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    // Exponential sound decay simulating sacred brass bell/flute
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    console.warn("Audio playback note:", e);
  }
}

function startDevotionalChimes() {
  // Sacred pentatonic notes: Sa, Re, Ga, Pa, Dha (Raag Bhupali vibe)
  const notes = [440, 495, 554, 660, 740, 880];
  let idx = 0;

  playTempleBell(notes[0], 2.8);
  audioInterval = setInterval(() => {
    if (!isAudioPlaying) return;
    idx = (idx + 1) % notes.length;
    playTempleBell(notes[idx], 2.2);
  }, 1600);
}

/* ==============================================================================
   6. Ambient Particles Canvas (Floating Petals & Golden Glow)
   ============================================================================== */
function initParticleEffects() {
  const canvas = document.getElementById("particles-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener("resize", () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const petals = [];
  const petalCount = 24;

  for (let i = 0; i < petalCount; i++) {
    petals.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 8 + 5,
      speedX: Math.random() * 1 - 0.5,
      speedY: Math.random() * 1 + 0.8,
      rotation: Math.random() * 360,
      rotSpeed: Math.random() * 2 - 1,
      color: Math.random() > 0.5 ? "rgba(255, 152, 0, 0.45)" : "rgba(255, 215, 0, 0.5)"
    });
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    for (let p of petals) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;

      // Draw subtle petal shape
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();

      p.x += p.speedX;
      p.y += p.speedY;
      p.rotation += p.rotSpeed;

      if (p.y > height + 20) {
        p.y = -10;
        p.x = Math.random() * width;
      }
      if (p.x > width + 20) p.x = -10;
      if (p.x < -20) p.x = width + 10;
    }

    requestAnimationFrame(draw);
  }

  draw();
}

/* ==============================================================================
   7. Confetti Effect on Registration
   ============================================================================== */
function triggerConfetti() {
  if (typeof confetti === "function") {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#FF7700", "#FFD700", "#DC2626", "#16A34A"]
    });
  }
}

/* Custom Notification Toast */
function showCustomAlert(msg, type = "info") {
  const alertBox = document.createElement("div");
  alertBox.style.position = "fixed";
  alertBox.style.top = "20px";
  alertBox.style.right = "20px";
  alertBox.style.zIndex = "9999";
  alertBox.style.background = type === "error" ? "#DC2626" : (type === "warning" ? "#D97706" : "#16A34A");
  alertBox.style.color = "#FFFFFF";
  alertBox.style.padding = "14px 22px";
  alertBox.style.borderRadius = "12px";
  alertBox.style.boxShadow = "0 10px 25px rgba(0,0,0,0.25)";
  alertBox.style.fontWeight = "600";
  alertBox.style.fontSize = "0.95rem";
  alertBox.style.maxWidth = "380px";
  alertBox.style.animation = "modal-pop 0.3s ease";
  alertBox.innerHTML = `<i class="fas fa-info-circle"></i> ${msg}`;

  document.body.appendChild(alertBox);
  setTimeout(() => {
    alertBox.style.opacity = "0";
    alertBox.style.transition = "opacity 0.4s";
    setTimeout(() => alertBox.remove(), 400);
  }, 4000);
}
