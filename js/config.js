/**
 * ==============================================================================
 * ShiVe Tours and Travels - Central Configuration & Bilingual Engine
 * Synchronizes Admin Panel Edits directly with Website (index.html)
 * ==============================================================================
 */

const CONFIG_STORAGE_KEY = "shive_site_config";
const LANG_STORAGE_KEY = "shive_site_lang";

const DEFAULT_CONFIG = {
  // 1. Agency & Branding
  agencyName: "ShiVe Tours & Travels",
  agencyTagline_hi: "भरोसेमंद सफर • यादगार अनुभव",
  agencyTagline_en: "Trusted Journeys • Unforgettable Experiences",
  logoImage: "", // Optional Base64 data URI or image URL; if empty, uses divine Om icon
  phone: "+91 9243714402",
  phoneRaw: "9243714402",
  whatsapp: "+91 9243714402",
  whatsappRaw: "9243714402",
  email: "info@shivetours.com",
  address_hi: "जयपुर, राजस्थान",
  address_en: "Jaipur, Rajasthan",

  // 2. Trip Specifications
  destination_hi: "श्री खाटू श्याम जी",
  destination_en: "Shri Khatu Shyam Ji",
  tripDateStr: "2026-10-31T09:00:00+05:30",
  tripDateDisplay_hi: "31-10-2026 (शनिवार)",
  tripDateDisplay_en: "31-10-2026 (Saturday)",
  tripTimeDisplay_hi: "सुबह 09:00 AM प्रस्थान",
  tripTimeDisplay_en: "09:00 AM Departure",
  tripFare: 900,
  tripFareNote_hi: "*आने-जाने की यात्रा, भोजन एवं डीजे सहित",
  tripFareNote_en: "*Includes round-trip travel, meals & DJ on wheels",

  // 3. Pickup Points & Times
  pickup1_name_hi: "एमिटी यूनिवर्सिटी जयपुर (Amity Jaipur)",
  pickup1_name_en: "Amity University Jaipur",
  pickup1_time_hi: "प्रातः 09:00 AM (मेन गेट)",
  pickup1_time_en: "09:00 AM (Main Gate)",
  pickup2_name_hi: "आमेर रोड (Amer Road, Jaipur)",
  pickup2_name_en: "Amer Road, Jaipur",
  pickup2_time_hi: "प्रातः 09:45 AM (मुख्य मार्ग)",
  pickup2_time_en: "09:45 AM (Main Road)",

  // 4. Payment
  upiId: "shivetours@upi",

  // 5. Ticker & Hero Texts
  ticker_hi: "|| हारे का सहारा, बाबा श्याम हमारा || जय श्री श्याम ||",
  ticker_en: "|| Hare Ka Sahara, Baba Shyam Hamara || Jai Shri Shyam ||",
  heroBadge_hi: "पावन दर्शन यात्रा • 31 अक्टूबर 2026",
  heroBadge_en: "Divine Darshan Tour • 31st October 2026",
  heroTitle_hi: "श्री खाटू श्याम जी",
  heroTitle_en: "Shri Khatu Shyam Ji",
  heroTitleSub_hi: "भव्य दर्शन यात्रा 2026",
  heroTitleSub_en: "Grand Darshan Yatra 2026",
  heroSubtitle_hi: "चलो बुलावा आया है, बाबा श्याम ने बुलाया है! एमिटी जयपुर एवं आमेर रोड से खाटू धाम की संपूर्ण आनंदमयी यात्रा।",
  heroSubtitle_en: "Join the sacred journey to Khatu Shyam Ji Dham from Amity Jaipur & Amer Road with on-board DJ bhajan, delicious food, and comfortable coach travel.",
  heroBtnBook_hi: "सीट आरक्षित करें",
  heroBtnBook_en: "Reserve Seats",
  heroBtnItin_hi: "यात्रा विवरण देखें",
  heroBtnItin_en: "View Itinerary",

  // 6. Highlights & Features
  featureFoodTitle_hi: "स्वादिष्ट भोजन शामिल",
  featureFoodTitle_en: "Delicious Meals Included",
  featureFoodDesc_hi: "यात्रा के दौरान सुबह का नाश्ता एवं दोपहर में शुद्ध, सात्विक एवं भरपेट भोजन/प्रसादी की व्यवस्था हमारे द्वारा की जाएगी।",
  featureFoodDesc_en: "Enjoy fresh morning breakfast with tea and pure vegetarian hygienic lunch/prasad included in your ticket.",

  featureDjTitle_hi: "वाहन में डीजे (DJ on Wheels)",
  featureDjTitle_en: "On-Board DJ (DJ on Wheels)",
  featureDjDesc_hi: "गाड़ी में हाई-क्वालिटी साउंड सिस्टम एवं डीजे की व्यवस्था रहेगी। रास्ते भर बाबा श्याम के भजनों और भक्तिमय गानों पर झूमते हुए सफर तय होगा।",
  featureDjDesc_en: "High-bass devotional music and DJ sound system on-board throughout the journey for divine celebration.",

  featureBusTitle_hi: "आरामदायक लग्जरी वाहन",
  featureBusTitle_en: "Comfortable Luxury Coach",
  featureBusDesc_hi: "पुश-बैक आरामदायक सीटें, अनुभवी एवं अनुशासित ड्राइवर के साथ सुरक्षित और सुखद यात्रा का भरोसा।",
  featureBusDesc_en: "Comfortable push-back reclining seats, safe sanitized vehicle with experienced and disciplined drivers.",

  featurePickupTitle_hi: "पिकअप & ड्रॉप सुविधा",
  featurePickupTitle_en: "Convenient Pickup & Drop",
  featurePickupDesc_hi: "एमिटी यूनिवर्सिटी जयपुर गेट (प्रातः 09:00 बजे) और आमेर रोड से सुविधाजनक पिकअप। शाम को वापस सुरक्षित ड्रॉप।",
  featurePickupDesc_en: "Convenient pickup from Amity University Jaipur Gate (9:00 AM) and Amer Road. Safe return drop at the same points.",

  // 7. Temple Card
  templeTitle_hi: "तोरण द्वार एवं पावन मंदिर दर्शन",
  templeTitle_en: "Toran Dwar & Divine Temple Darshan",
  templeDesc_hi: "संसार भर से भक्त बाबा श्याम के दरबार में अपनी अर्जी लगाने आते हैं। कहा जाता है कि जो भी सच्चे मन से खाटू धाम आता है, बाबा उसकी हर मनोकामना पूर्ण करते हैं।",
  templeDesc_en: "Devotees from around the world gather at Baba Shyam's holy sanctum. Experience the divine blessings of Khatu Naresh with peace and devotion.",

  // 8. Itinerary (8 Stages)
  itinerary: [
    {
      time_hi: "08:45 AM - 09:00 AM",
      time_en: "08:45 AM - 09:00 AM",
      title_hi: "पहला पिकअप: एमिटी यूनिवर्सिटी जयपुर (Amity Jaipur)",
      title_en: "1st Pickup: Amity University Jaipur",
      desc_hi: "सभी यात्रियों का एमिटी जयपुर मेन गेट पर एकत्रीकरण, हाजिरी एवं ठीक 09:00 AM पर प्रस्थान।",
      desc_en: "Reporting at Amity Jaipur Main Gate, attendance check, and sharp departure at 09:00 AM."
    },
    {
      time_hi: "09:45 AM",
      time_en: "09:45 AM",
      title_hi: "दूसरा पिकअप: आमेर रोड (Amer Road, Jaipur)",
      title_en: "2nd Pickup: Amer Road, Jaipur",
      desc_hi: "आमेर रोड से यात्रियों का पिकअप एवं गाड़ी में ऑन-बोर्ड डीजे व श्याम भजनों का शुभारंभ।",
      desc_en: "Passenger boarding at Amer Road and kick-off of on-board DJ bhajans."
    },
    {
      time_hi: "10:30 AM",
      time_en: "10:30 AM",
      title_hi: "मार्ग में स्वादिष्ट जलपान (Breakfast on the way)",
      title_en: "En Route Fresh Breakfast & Tea",
      desc_hi: "हाईवे पर ताज़ा नाश्ता एवं चाय की व्यवस्था (भोजन पैकेज में शामिल)।",
      desc_en: "Fresh morning breakfast and piping-hot tea at a hygienic highway halt."
    },
    {
      time_hi: "12:30 PM - 02:30 PM",
      time_en: "12:30 PM - 02:30 PM",
      title_hi: "खाटू धाम आगमन एवं पावन दर्शन (Darshan)",
      title_en: "Arrival at Khatu Dham & Sacred Darshan",
      desc_hi: "तोरण द्वार से प्रवेश, श्याम बाबा के अलौकिक दर्शन, श्याम कुंड दर्शन एवं भोग अर्पण।",
      desc_en: "Grand entry through Toran Dwar, sacred darshan of Baba Shyam and holy Shyam Kund."
    },
    {
      time_hi: "02:30 PM - 03:30 PM",
      time_en: "02:30 PM - 03:30 PM",
      title_hi: "दोपहर का स्वादिष्ट भोजन (Lunch Included)",
      title_en: "Delicious Vegetarian Lunch (Included)",
      desc_hi: "शुद्ध, सात्विक एवं स्वादिष्ट प्रसादी/भोजन की व्यवस्था।",
      desc_en: "Pure, delicious, and fulfilling sattvic lunch prasad arrangement."
    },
    {
      time_hi: "03:30 PM - 05:00 PM",
      time_en: "03:30 PM - 05:00 PM",
      title_hi: "श्याम बगीची & स्थानीय बाजार भ्रमण (Market & Leisure)",
      title_en: "Shyam Bagichi & Local Market Exploration",
      desc_hi: "बाबा के प्रसाद (पेड़े), धार्मिक सामग्री एवं स्मृति चिन्हों की खरीदारी हेतु समय।",
      desc_en: "Time for purchasing famous Peda prasad, sacred flags, and souvenirs."
    },
    {
      time_hi: "05:30 PM",
      time_en: "05:30 PM",
      title_hi: "जयपुर के लिए वापसी प्रस्थान (DJ Dhamaal Return)",
      title_en: "Return Departure to Jaipur with Devotional DJ",
      desc_hi: "वाहन में डीजे एवं भजनों के साथ जयपुर के लिए प्रस्थान।",
      desc_en: "Boarding the coach for return journey with high-energy devotional celebration."
    },
    {
      time_hi: "08:30 PM - 09:30 PM",
      time_en: "08:30 PM - 09:30 PM",
      title_hi: "सुरक्षित ड्रॉप: आमेर रोड एवं एमिटी जयपुर",
      title_en: "Safe Drop at Amer Road & Amity Jaipur",
      desc_hi: "पहले आमेर रोड ड्रॉप तत्पश्चात एमिटी यूनिवर्सिटी जयपुर पर सभी यात्रियों की सुरक्षित वापसी।",
      desc_en: "Safe drop-off first at Amer Road followed by Amity University Jaipur main gate."
    }
  ],

  // 9. Media Images
  heroImage: "assets/images/shyam_baba.jpg",
  templeImage: "assets/images/khatu_dwar.jpg"
};

/**
 * Get Active Site Configuration (Merged with Defaults)
 */
function getSiteConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch (e) {
    console.warn("Error reading site config from localStorage:", e);
  }
  return { ...DEFAULT_CONFIG };
}

/**
 * Save Site Configuration (Syncs to localStorage & Server file)
 */
async function saveSiteConfig(updatedConfig) {
  const merged = { ...getSiteConfig(), ...updatedConfig };
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(merged));

  // Broadcast to other open tabs
  try {
    window.dispatchEvent(new CustomEvent("shive_config_updated", { detail: merged }));
  } catch (e) {}

  // Also push to local server API if running so it persists on disk
  try {
    await fetch("http://localhost:5000/api/save-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(merged)
    });
  } catch (e) {
    // Server might be offline, localStorage still retains it
  }

  return merged;
}

/**
 * Reset Configuration to Factory Defaults
 */
async function resetSiteConfig() {
  localStorage.removeItem(CONFIG_STORAGE_KEY);
  try {
    window.dispatchEvent(new CustomEvent("shive_config_updated", { detail: DEFAULT_CONFIG }));
  } catch (e) {}
  try {
    await fetch("http://localhost:5000/api/save-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(DEFAULT_CONFIG)
    });
  } catch (e) {}
  return { ...DEFAULT_CONFIG };
}

/**
 * Language Helpers
 */
function getCurrentLang() {
  return localStorage.getItem(LANG_STORAGE_KEY) || "hi";
}

function setLanguage(lang) {
  if (lang !== "hi" && lang !== "en") lang = "hi";
  localStorage.setItem(LANG_STORAGE_KEY, lang);
  applySiteConfig(lang);
  updateLangToggleButtons(lang);
}

/**
 * Update Language Switcher UI Active States
 */
function updateLangToggleButtons(lang) {
  const btnHi = document.getElementById("langBtnHi");
  const btnEn = document.getElementById("langBtnEn");
  if (btnHi && btnEn) {
    if (lang === "hi") {
      btnHi.classList.add("active");
      btnEn.classList.remove("active");
    } else {
      btnEn.classList.add("active");
      btnHi.classList.remove("active");
    }
  }
}

/**
 * Apply Configuration & Translations to Website (index.html)
 */
function applySiteConfig(lang = null) {
  if (!lang) lang = getCurrentLang();
  const cfg = getSiteConfig();
  const isHi = lang === "hi";

  // Document Title & Meta Description
  document.title = isHi
    ? `${cfg.destination_hi} दर्शन यात्रा 2026 | ${cfg.agencyName}`
    : `${cfg.destination_en} Tour 2026 | ${cfg.agencyName}`;

  // 1. Top Ticker Text
  const tickerText = document.getElementById("cfgTickerText");
  if (tickerText) tickerText.textContent = isHi ? cfg.ticker_hi : cfg.ticker_en;

  // 2. Audio button label
  const audioBtnText = document.getElementById("audioBtnText");
  if (audioBtnText) audioBtnText.textContent = isHi ? "भजन / धुन बजाएं" : "Play Bhajan Flute";

  // Date in Ticker
  const tickerDate = document.getElementById("cfgTickerDate");
  if (tickerDate) tickerDate.textContent = isHi ? cfg.tripDateDisplay_hi : cfg.tripDateDisplay_en;

  // 3. Navigation Bar
  const brandName = document.getElementById("cfgBrandName");
  if (brandName) {
    const parts = cfg.agencyName.split(" ");
    if (parts.length > 1) {
      const first = parts[0];
      const rest = parts.slice(1).join(" ");
      brandName.innerHTML = `${first} <span>${rest}</span>`;
    } else {
      brandName.textContent = cfg.agencyName;
    }
  }

  // Brand Logo (Image or Default Icon)
  const brandIconWrap = document.getElementById("cfgBrandIconWrap");
  if (brandIconWrap) {
    if (cfg.logoImage && cfg.logoImage.trim() !== "") {
      brandIconWrap.innerHTML = `<img src="${cfg.logoImage}" alt="Logo" style="width: 100%; height: 100%; object-fit: contain; border-radius: 12px;">`;
      brandIconWrap.style.background = "transparent";
      brandIconWrap.style.boxShadow = "none";
    } else {
      brandIconWrap.innerHTML = `<i class="fas fa-om"></i>`;
      brandIconWrap.style.background = "linear-gradient(135deg, #FF7700, #E65100)";
      brandIconWrap.style.boxShadow = "0 4px 12px rgba(230, 81, 0, 0.35)";
    }
  }

  const brandTagline = document.getElementById("cfgBrandTagline");
  if (brandTagline) brandTagline.textContent = isHi ? cfg.agencyTagline_hi : cfg.agencyTagline_en;

  const navPhone = document.getElementById("cfgNavPhone");
  if (navPhone) {
    navPhone.textContent = cfg.phone;
    if (navPhone.parentElement && navPhone.parentElement.tagName === "A") {
      navPhone.parentElement.href = `tel:${cfg.phone.replace(/[^0-9+]/g, "")}`;
    }
  }

  const navBookBtn = document.getElementById("cfgNavBookBtn");
  if (navBookBtn) navBookBtn.textContent = isHi ? "सीट बुक करें" : "Book Seats";

  // 4. Hero Section
  const heroBadge = document.getElementById("cfgHeroBadge");
  if (heroBadge) heroBadge.textContent = isHi ? cfg.heroBadge_hi : cfg.heroBadge_en;

  const heroTitleMain = document.getElementById("cfgHeroTitleMain");
  if (heroTitleMain) heroTitleMain.textContent = isHi ? cfg.heroTitle_hi : cfg.heroTitle_en;

  const heroTitleSub = document.getElementById("cfgHeroTitleSub");
  if (heroTitleSub) heroTitleSub.textContent = isHi ? cfg.heroTitleSub_hi : cfg.heroTitleSub_en;

  const heroSubtitle = document.getElementById("cfgHeroSubtitle");
  if (heroSubtitle) heroSubtitle.textContent = isHi ? cfg.heroSubtitle_hi : cfg.heroSubtitle_en;

  // Highlight Chips
  const chipDate = document.getElementById("cfgChipDate");
  if (chipDate) chipDate.textContent = isHi ? cfg.tripDateDisplay_hi : cfg.tripDateDisplay_en;

  const chipTime = document.getElementById("cfgChipTime");
  if (chipTime) chipTime.textContent = isHi ? cfg.tripTimeDisplay_hi : cfg.tripTimeDisplay_en;

  const chipPickups = document.getElementById("cfgChipPickups");
  if (chipPickups) chipPickups.textContent = isHi ? "एमिटी जयपुर & आमेर रोड" : "Amity Jaipur & Amer Road";

  const chipDj = document.getElementById("cfgChipDj");
  if (chipDj) chipDj.textContent = isHi ? "गाड़ी में डीजे (DJ on Wheels)" : "Devotional DJ on Wheels";

  const chipFood = document.getElementById("cfgChipFood");
  if (chipFood) chipFood.textContent = isHi ? "स्वादिष्ट भोजन शामिल" : "Delicious Meals Included";

  // Hero Fare
  const heroFareNumber = document.getElementById("cfgHeroFareNumber");
  if (heroFareNumber) heroFareNumber.textContent = cfg.tripFare;

  const heroFarePerPerson = document.getElementById("cfgHeroFarePerPerson");
  if (heroFarePerPerson) heroFarePerPerson.textContent = isHi ? "/ प्रति व्यक्ति" : "/ Per Person";

  const heroFareNote = document.getElementById("cfgHeroFareNote");
  if (heroFareNote) heroFareNote.textContent = isHi ? cfg.tripFareNote_hi : cfg.tripFareNote_en;

  const heroBtnBook = document.getElementById("cfgHeroBtnBook");
  if (heroBtnBook) heroBtnBook.textContent = isHi ? cfg.heroBtnBook_hi : cfg.heroBtnBook_en;

  const heroBtnItin = document.getElementById("cfgHeroBtnItin");
  if (heroBtnItin) heroBtnItin.textContent = isHi ? cfg.heroBtnItin_hi : cfg.heroBtnItin_en;

  // Hero Image & Temple Image
  const heroImgElement = document.getElementById("cfgHeroImg");
  if (heroImgElement && cfg.heroImage) heroImgElement.src = cfg.heroImage;

  const templeImgElement = document.getElementById("cfgTempleImg");
  if (templeImgElement && cfg.templeImage) templeImgElement.src = cfg.templeImage;

  // Countdown Section
  const cdTitle = document.getElementById("cfgCdTitle");
  if (cdTitle) cdTitle.textContent = isHi ? "यात्रा प्रारंभ होने में शेष समय" : "Countdown to Sacred Journey";

  const cdSub = document.getElementById("cfgCdSub");
  if (cdSub) cdSub.textContent = isHi ? "सीटें सीमित हैं! समय समाप्त होने से पहले अपना स्थान बुक करें।" : "Limited seats! Reserve your seat before time runs out.";

  const lblDays = document.getElementById("cfgLblDays");
  if (lblDays) lblDays.textContent = isHi ? "दिन (Days)" : "Days";
  const lblHours = document.getElementById("cfgLblHours");
  if (lblHours) lblHours.textContent = isHi ? "घंटे (Hours)" : "Hours";
  const lblMins = document.getElementById("cfgLblMins");
  if (lblMins) lblMins.textContent = isHi ? "मिनट (Mins)" : "Minutes";
  const lblSecs = document.getElementById("cfgLblSecs");
  if (lblSecs) lblSecs.textContent = isHi ? "सेकंड (Secs)" : "Seconds";

  // 5. Features Section
  const featSectionTag = document.getElementById("cfgFeatSectionTag");
  if (featSectionTag) featSectionTag.textContent = isHi ? "सुविधाएं एवं विशेषताएं" : "Features & Amenities";

  const featSectionHeading = document.getElementById("cfgFeatSectionHeading");
  if (featSectionHeading) featSectionHeading.textContent = isHi ? "इस यात्रा में आपको क्या-क्या मिलेगा?" : "What's Included in Your Journey?";

  const featSectionSub = document.getElementById("cfgFeatSectionSub");
  if (featSectionSub) featSectionSub.textContent = isHi ? `${cfg.agencyName} आपके लिए लाया है आरामदायक, सुरक्षित और भक्तिमय यात्रा का संपूर्ण पैकेज।` : `${cfg.agencyName} brings you a complete comfortable, safe, and devotional travel package.`;

  const featFoodTitle = document.getElementById("cfgFeatFoodTitle");
  if (featFoodTitle) featFoodTitle.textContent = isHi ? cfg.featureFoodTitle_hi : cfg.featureFoodTitle_en;
  const featFoodDesc = document.getElementById("cfgFeatFoodDesc");
  if (featFoodDesc) featFoodDesc.textContent = isHi ? cfg.featureFoodDesc_hi : cfg.featureFoodDesc_en;

  const featDjTitle = document.getElementById("cfgFeatDjTitle");
  if (featDjTitle) featDjTitle.textContent = isHi ? cfg.featureDjTitle_hi : cfg.featureDjTitle_en;
  const featDjDesc = document.getElementById("cfgFeatDjDesc");
  if (featDjDesc) featDjDesc.textContent = isHi ? cfg.featureDjDesc_hi : cfg.featureDjDesc_en;

  const featBusTitle = document.getElementById("cfgFeatBusTitle");
  if (featBusTitle) featBusTitle.textContent = isHi ? cfg.featureBusTitle_hi : cfg.featureBusTitle_en;
  const featBusDesc = document.getElementById("cfgFeatBusDesc");
  if (featBusDesc) featBusDesc.textContent = isHi ? cfg.featureBusDesc_hi : cfg.featureBusDesc_en;

  const featPickupTitle = document.getElementById("cfgFeatPickupTitle");
  if (featPickupTitle) featPickupTitle.textContent = isHi ? cfg.featurePickupTitle_hi : cfg.featurePickupTitle_en;
  const featPickupDesc = document.getElementById("cfgFeatPickupDesc");
  if (featPickupDesc) featPickupDesc.textContent = isHi ? cfg.featurePickupDesc_hi : cfg.featurePickupDesc_en;

  // 6. Temple / Darshan Card
  const templeTag = document.getElementById("cfgTempleTag");
  if (templeTag) templeTag.textContent = isHi ? "पवित्र खाटू धाम" : "Holy Khatu Dham";

  const templeTitle = document.getElementById("cfgTempleTitle");
  if (templeTitle) templeTitle.textContent = isHi ? cfg.templeTitle_hi : cfg.templeTitle_en;

  const templeDesc = document.getElementById("cfgTempleDesc");
  if (templeDesc) templeDesc.textContent = isHi ? cfg.templeDesc_hi : cfg.templeDesc_en;

  const templePoint1 = document.getElementById("cfgTemplePoint1");
  if (templePoint1) templePoint1.textContent = isHi ? "ऐतिहासिक तोरण द्वार से भव्य प्रवेश" : "Grand entrance via historic Toran Dwar";

  const templePoint2 = document.getElementById("cfgTemplePoint2");
  if (templePoint2) templePoint2.textContent = isHi ? "बाबा श्याम के मुख्य विग्रह के दर्शन" : "Sacred Darshan of Lord Shyam Baba";

  const templePoint3 = document.getElementById("cfgTemplePoint3");
  if (templePoint3) templePoint3.textContent = isHi ? "पावन श्याम कुण्ड एवं श्याम बगीची दर्शन" : "Holy Shyam Kund & Shyam Bagichi visit";

  // 7. Itinerary Timeline
  const itinTag = document.getElementById("cfgItinTag");
  if (itinTag) itinTag.textContent = isHi ? "यात्रा कार्यक्रम" : "Trip Itinerary";

  const itinHeading = document.getElementById("cfgItinHeading");
  if (itinHeading) itinHeading.textContent = isHi ? "एक दिवसीय यात्रा का पूरा शेड्यूल" : "One-Day Complete Schedule";

  const itinSub = document.getElementById("cfgItinSub");
  if (itinSub) itinSub.textContent = isHi ? `${cfg.tripDateDisplay_hi} के दिन का समयबद्ध यात्रा विवरण (Time Schedule)` : `Timed schedule for ${cfg.tripDateDisplay_en}`;

  const itinContainer = document.getElementById("cfgItineraryList");
  if (itinContainer && Array.isArray(cfg.itinerary)) {
    const icons = ["fa-clock", "fa-bus", "fa-coffee", "fa-gopuram", "fa-concierge-bell", "fa-shopping-bag", "fa-music", "fa-home"];
    itinContainer.innerHTML = cfg.itinerary.map((item, idx) => {
      const icon = icons[idx % icons.length];
      const time = isHi ? item.time_hi : item.time_en;
      const title = isHi ? item.title_hi : item.title_en;
      const desc = isHi ? item.desc_hi : item.desc_en;
      return `
        <div class="timeline-item">
          <div class="timeline-dot"><i class="fas ${icon}" style="font-size: 0.65rem; color: #FF7700;"></i></div>
          <div class="timeline-content">
            <span class="timeline-time"><i class="fas fa-bell"></i> ${time}</span>
            <h4 class="timeline-title">${title}</h4>
            <p class="timeline-desc">${desc}</p>
          </div>
        </div>
      `;
    }).join("");
  }

  // 8. Inclusions vs Exclusions
  const incTitle = document.getElementById("cfgIncTitle");
  if (incTitle) incTitle.textContent = isHi ? `₹${cfg.tripFare} शुल्क में शामिल है (Inclusions)` : `Included in ₹${cfg.tripFare} Fare (Inclusions)`;

  const incList = document.getElementById("cfgIncList");
  if (incList) {
    const items = isHi ? [
      `दोनों तरफ का आरामदायक बस/वाहन सफर (${cfg.pickup1_name_hi} / आमेर से खाटू धाम वापसी)`,
      "वाहन में डीजे साउंड सिस्टम (DJ on Wheels)",
      "सुबह का ताज़ा नाश्ता एवं चाय",
      "दोपहर का शुद्ध सात्विक भरपेट भोजन/प्रसादी",
      "सभी प्रकार के टोल टैक्स, पार्किंग एवं ड्राइवर शुल्क"
    ] : [
      `Round-trip comfortable bus travel (${cfg.pickup1_name_en} / Amer to Khatu & Back)`,
      "Devotional DJ Sound System on Wheels",
      "Fresh Morning Breakfast & Tea",
      "Pure Vegetarian Hygienic Lunch / Prasad",
      "All Toll Taxes, Parking, and Driver Allowances"
    ];
    incList.innerHTML = items.map(t => `<li><i class="fas fa-check"></i> ${t}</li>`).join("");
  }

  const excTitle = document.getElementById("cfgExcTitle");
  if (excTitle) excTitle.textContent = isHi ? "शामिल नहीं है (Exclusions - 'बाकी खर्चा हमारा नहीं होगा')" : "Not Included (Personal Expenses)";

  const excList = document.getElementById("cfgExcList");
  if (excList) {
    const items = isHi ? [
      "मंदिर में वीआईपी दर्शन या विशेष लाइन टिकट (सामान्य दर्शन लाइन में होंगे)",
      "बाबा श्याम के लिए व्यक्तिगत प्रसाद, माला, पेड़े या नारियल का खर्च",
      "बाजार में अपनी व्यक्तिगत खरीदारी या निजी स्नैक्स/कोल्ड ड्रिंक्स",
      "कोई भी व्यक्तिगत चिकित्सा खर्च अथवा आपातकालीन निजी व्यय",
      "<strong>स्पष्ट नोट:</strong> पैकेज में उल्लिखित भोजन व यात्रा के अलावा कोई भी अतिरिक्त खर्च यात्री का स्वयं होगा।"
    ] : [
      "VIP darshan passes (Standard darshan lines)",
      "Personal offerings, prasad, malas, or sweets",
      "Personal shopping, extra snacks, or cold drinks",
      "Personal medical or emergency expenses",
      "<strong>Clear Note:</strong> Any expense beyond specified travel & meals is traveler's responsibility."
    ];
    excList.innerHTML = items.map(t => `<li><i class="fas fa-times"></i> ${t}</li>`).join("");
  }

  // 9. Booking Form
  const formHeaderTitle = document.getElementById("cfgFormHeaderTitle");
  if (formHeaderTitle) formHeaderTitle.textContent = isHi ? `${cfg.destination_hi} दर्शन यात्रा 2026` : `${cfg.destination_en} Tour 2026`;

  const formHeaderSub = document.getElementById("cfgFormHeaderSub");
  if (formHeaderSub) formHeaderSub.textContent = isHi ? `सीट बुकिंग फॉर्म • ${cfg.agencyName}` : `Seat Booking Form • ${cfg.agencyName}`;

  const lblFullName = document.getElementById("cfgLblFullName");
  if (lblFullName) lblFullName.textContent = isHi ? "यात्री का पूरा नाम (Full Name)" : "Full Name of Traveler";

  const lblPhone = document.getElementById("cfgLblPhone");
  if (lblPhone) lblPhone.textContent = isHi ? "व्हाट्सएप / मोबाइल नंबर (10 अंक)" : "WhatsApp / Mobile Number (10 Digits)";

  const lblAltPhone = document.getElementById("cfgLblAltPhone");
  if (lblAltPhone) lblAltPhone.textContent = isHi ? "आपातकालीन / दूसरा नंबर (Alternate No.)" : "Emergency / Alternate Phone (Optional)";

  const lblEmail = document.getElementById("cfgLblEmail");
  if (lblEmail) lblEmail.textContent = isHi ? "ईमेल आईडी (Email ID)" : "Email Address";

  const lblPickup = document.getElementById("cfgLblPickup");
  if (lblPickup) lblPickup.textContent = isHi ? "पिकअप पॉइंट चुनें (Pickup Location)" : "Select Pickup Location";

  // Pickup 1 & 2
  const pickup1Title = document.getElementById("cfgPickup1Title");
  if (pickup1Title) pickup1Title.textContent = isHi ? cfg.pickup1_name_hi : cfg.pickup1_name_en;
  const pickup1Time = document.getElementById("cfgPickup1Time");
  if (pickup1Time) pickup1Time.textContent = isHi ? `पिकअप समय: ${cfg.pickup1_time_hi}` : `Pickup Time: ${cfg.pickup1_time_en}`;

  const pickup2Title = document.getElementById("cfgPickup2Title");
  if (pickup2Title) pickup2Title.textContent = isHi ? cfg.pickup2_name_hi : cfg.pickup2_name_en;
  const pickup2Time = document.getElementById("cfgPickup2Time");
  if (pickup2Time) pickup2Time.textContent = isHi ? `पिकअप समय: ${cfg.pickup2_time_hi}` : `Pickup Time: ${cfg.pickup2_time_en}`;

  const lblSeats = document.getElementById("cfgLblSeats");
  if (lblSeats) lblSeats.textContent = isHi ? "सीटों की संख्या (Seats)" : "Number of Seats";

  const lblTxn = document.getElementById("cfgLblTxn");
  if (lblTxn) lblTxn.textContent = isHi ? "पेमेंट UTR / Ref No. (यदि भुगतान किया हो)" : "Payment UTR / Ref No. (If Paid Online)";

  const lblNote = document.getElementById("cfgLblNote");
  if (lblNote) lblNote.textContent = isHi ? "कोई विशेष टिप्पणी या अनुरोध (Optional)" : "Special Note or Request (Optional)";

  // Summary box rate
  const summaryRateText = document.getElementById("cfgSummaryRateText");
  if (summaryRateText) {
    const seatVal = document.getElementById("seatCount") ? document.getElementById("seatCount").value || 1 : 1;
    summaryRateText.innerHTML = isHi
      ? `₹${cfg.tripFare} × <span id="summarySeatCount">${seatVal}</span> सीट (भोजन + डीजे वाहन शामिल)`
      : `₹${cfg.tripFare} × <span id="summarySeatCount">${seatVal}</span> Seat (Meals + DJ Coach Included)`;
  }

  const liveTotalAmount = document.getElementById("liveTotalAmount");
  if (liveTotalAmount) {
    const seatVal = parseInt(document.getElementById("seatCount") ? document.getElementById("seatCount").value || 1 : 1, 10);
    liveTotalAmount.textContent = "₹" + (seatVal * cfg.tripFare).toLocaleString("en-IN");
  }

  const submitBtnText = document.getElementById("btnText");
  if (submitBtnText) submitBtnText.textContent = isHi ? "🙏 सीट कन्फर्म करें (Confirm Booking)" : "🙏 Confirm Booking";

  // UPI ID
  const upiIdDisplay = document.getElementById("upiIdText");
  if (upiIdDisplay) upiIdDisplay.textContent = cfg.upiId;

  // 10. Footer Info
  const footerBrand = document.getElementById("cfgFooterBrand");
  if (footerBrand) {
    const parts = cfg.agencyName.split(" ");
    if (parts.length > 1) {
      footerBrand.innerHTML = `${parts[0]} <span>${parts.slice(1).join(" ")}</span>`;
    } else {
      footerBrand.textContent = cfg.agencyName;
    }
  }

  const footerAbout = document.getElementById("cfgFooterAbout");
  if (footerAbout) {
    footerAbout.textContent = isHi
      ? "धार्मिक एवं पर्यटन यात्राओं के लिए आपका विश्वसनीय साथी। हम सुनिश्चित करते हैं कि आपकी हर यात्रा सुरक्षित, सुविधाजनक और आध्यात्मिक आनंद से परिपूर्ण हो।"
      : "Your trusted partner for spiritual and scenic journeys. We ensure your travels are safe, comfortable, and spiritually blissful.";
  }

  const footerPhone = document.getElementById("cfgFooterPhone");
  if (footerPhone) footerPhone.textContent = cfg.phone;

  const footerWa = document.getElementById("cfgFooterWa");
  if (footerWa) footerWa.textContent = cfg.whatsapp;

  const footerEmail = document.getElementById("cfgFooterEmail");
  if (footerEmail) footerEmail.textContent = cfg.email;

  const footerAddress = document.getElementById("cfgFooterAddress");
  if (footerAddress) footerAddress.textContent = isHi ? cfg.address_hi : cfg.address_en;

  const footerCopy = document.getElementById("cfgFooterCopy");
  if (footerCopy) {
    footerCopy.textContent = `© 2026 ${cfg.agencyName}. ${isHi ? "सर्वाधिकार सुरक्षित।" : "All rights reserved."}`;
  }

  const footerSub = document.getElementById("cfgFooterSub");
  if (footerSub) {
    footerSub.textContent = isHi
      ? `${cfg.destination_hi} यात्रा (${cfg.tripDateDisplay_hi}) हेतु निर्मित`
      : `Designed for ${cfg.destination_en} Tour (${cfg.tripDateDisplay_en})`;
  }

  // Update Floating WhatsApp button href
  const floatingWa = document.querySelector(".floating-whatsapp");
  if (floatingWa) {
    const waClean = (cfg.whatsappRaw || cfg.whatsapp || "").replace(/[^0-9]/g, "");
    floatingWa.href = `https://wa.me/${waClean}?text=Hello%20${encodeURIComponent(cfg.agencyName)},%20${encodeURIComponent(cfg.destination_en)}%20Trip%20information.`;
  }

  updateLangToggleButtons(lang);
}

// Auto sync on page load and storage event
window.addEventListener("storage", (e) => {
  if (e.key === CONFIG_STORAGE_KEY || e.key === LANG_STORAGE_KEY) {
    applySiteConfig();
  }
});

window.addEventListener("shive_config_updated", () => {
  applySiteConfig();
});

// Try to fetch latest config from server API on init
(async function initServerConfigSync() {
  try {
    const res = await fetch("http://localhost:5000/api/get-config");
    const data = await res.json();
    if (data.success && data.config) {
      const merged = { ...DEFAULT_CONFIG, ...data.config };
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(merged));
      applySiteConfig();
    }
  } catch (e) {
    // Offline or server not running, use local
  }
})();
