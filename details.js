/* ===========================================================
   DARJEELING HOMESTAY DIRECTORY
   DETAILS.JS - FAULT-TOLERANT & CACHE-ALIGNED VERSION
=========================================================== */

/* ===========================================================
   CONFIG & CACHE
=========================================================== */

// Change to your Google Apps Script Web App URL if fetching dynamically
const DATA_URL = "data.json";

// Standardized Cache Keys matching script.js
const CACHE_KEY = "homestay_cache_v2";
const CACHE_TIME_KEY = "homestay_cache_time";
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

/* ===========================================================
   GLOBAL VARIABLES
=========================================================== */

let homestay = null;
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
const id = new URLSearchParams(window.location.search).get("id");

/* ===========================================================
   START & LISTENERS
=========================================================== */

document.addEventListener("DOMContentLoaded", loadHomestay);

// Synchronize wishlist state across multiple open tabs
window.addEventListener("storage", (e) => {
    if (e.key === "wishlist") {
        try {
            wishlist = JSON.parse(e.newValue) || [];
            updateWishlistButton();
        } catch (err) {
            console.error("Wishlist sync error:", err);
        }
    }
});

/* ===========================================================
   HELPER: FLEXIBLE CASE-INSENSITIVE ID LOOKUP
=========================================================== */

function findHomestayById(homesList, targetId) {
    if (!homesList || !Array.isArray(homesList) || targetId === null || targetId === undefined) {
        return null;
    }

    const cleanTargetId = String(targetId).trim().toLowerCase();

    return homesList.find(home => {
        if (!home) return false;
        
        // Checks all common property key variations coming from Google Sheets / JSON
        const rawId = home.id ?? home.ID ?? home.Id ?? home["id "] ?? home["ID "] ?? home["sl_no"] ?? home["Sl No"];
        
        if (rawId === undefined || rawId === null) return false;
        
        return String(rawId).trim().toLowerCase() === cleanTargetId;
    });
}

/* ===========================================================
   LOAD HOMESTAY FROM CACHE OR API
=========================================================== */

async function loadHomestay() {
    try {
        console.log("Loading homestay ID:", id);

        if (!id) {
            showNotFound("No Homestay ID specified in the URL.");
            return;
        }

        let homes = null;

        // 1. Try reading from cache first
        const cachedData = localStorage.getItem(CACHE_KEY);
        const cachedTime = localStorage.getItem(CACHE_TIME_KEY);

        if (cachedData && cachedTime && (Date.now() - Number(cachedTime) < CACHE_DURATION)) {
            try {
                homes = JSON.parse(cachedData);
                console.log("Loaded homes from local cache.");
            } catch (e) {
                console.warn("Cache parse failed, clearing cache:", e);
                localStorage.removeItem(CACHE_KEY);
                localStorage.removeItem(CACHE_TIME_KEY);
            }
        }

        // 2. Fallback fetch if cache is missing or expired
        if (!homes || !Array.isArray(homes)) {
            console.log("Fetching fresh homestay data...");
            const response = await fetch(DATA_URL);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: Failed to fetch ${DATA_URL}`);
            }

            homes = await response.json();

            if (!Array.isArray(homes)) {
                throw new Error("JSON data returned is not an array");
            }

            localStorage.setItem(CACHE_KEY, JSON.stringify(homes));
            localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
        }

        // 3. Flexible lookup for the target property
        homestay = findHomestayById(homes, id);

        if (!homestay) {
            console.warn(`Homestay with ID '${id}' not found in dataset:`, homes);
            showNotFound(`Homestay with ID "${escapeHtml(id)}" could not be located.`);
            return;
        }

        // Hide loader if present
        const loader = document.getElementById("loading");
        if (loader) loader.style.display = "none";

        // Display property details
        displayHomestay();

    } catch (error) {
        console.error("Error loading homestay:", error);
        showError("Unable to load homestay details. Please refresh the page.");
    }
}

/* ===========================================================
   UI ERROR & NOT FOUND HANDLERS (SAFE / NON-DESTRUCTIVE)
=========================================================== */

function showNotFound(msg = "Homestay not found.") {
    const loader = document.getElementById("loading");
    if (loader) {
        loader.innerHTML = `
            <div class="container py-5 text-center">
                <div class="alert alert-warning shadow-sm rounded-4 p-4">
                    <i class="fa-solid fa-triangle-exclamation fs-1 text-warning mb-3"></i>
                    <h4 class="fw-bold">Homestay Not Found</h4>
                    <p class="text-muted mb-3">${msg}</p>
                    <a href="index.html" class="btn btn-success">Return to Directory</a>
                </div>
            </div>
        `;
        loader.style.display = "block";
    } else {
        alert(msg);
    }
}

function showError(message) {
    const loader = document.getElementById("loading");
    if (loader) {
        loader.innerHTML = `
            <div class="alert alert-danger m-3 p-3">
                <i class="fa-solid fa-circle-exclamation me-2"></i> ${message}
            </div>
        `;
        loader.style.display = "block";
    } else {
        alert(message);
    }
}

/* ===========================================================
   DISPLAY HOMESTAY
=========================================================== */

function displayHomestay() {
    if (!homestay) return;

    // Helper to safely get property fields regardless of header casing
    const getField = (keys, fallback = "") => {
        for (const k of keys) {
            if (homestay[k] !== undefined && homestay[k] !== null) return homestay[k];
        }
        return fallback;
    };

    const nameVal = getField(["name", "Name", "title", "Title"], "Unnamed Homestay");
    const locationVal = getField(["location", "Location", "place", "Place"], "Location Not Specified");
    const imageVal = getField(["image", "Image", "photo", "Photo"], "https://placehold.co/1200x700?text=No+Image+Available");
    const priceVal = getField(["price", "Price", "rate", "Rate"]);
    const descVal = getField(["description", "Description", "desc", "Desc"], "No description provided.");
    const amenitiesVal = getField(["amenities", "Amenities", "facilities", "Facilities"]);
    const phoneVal = getField(["phone", "Phone", "mobile", "Mobile", "contact", "Contact"]);
    const whatsappVal = getField(["whatsapp", "WhatsApp", "Whatsapp"]);
    const mapVal = getField(["googleMap", "GoogleMap", "google_map", "map", "Map"]);
    const websiteVal = getField(["website", "Website", "site", "Site"]);

    // Title
    document.title = `${nameVal} | Darjeeling Homestay`;

    // Hero Image
    const heroImage = document.getElementById("heroImage");
    if (heroImage) heroImage.src = imageVal;

    // Names
    const homeName = document.getElementById("homeName");
    if (homeName) homeName.textContent = nameVal;

    const detailName = document.getElementById("detailName");
    if (detailName) detailName.textContent = nameVal;

    // Location
    const homeLocation = document.getElementById("homeLocation");
    if (homeLocation) {
        homeLocation.innerHTML = `<i class="fa-solid fa-location-dot text-danger me-1"></i> ${escapeHtml(locationVal)}`;
    }

    const detailLocation = document.getElementById("detailLocation");
    if (detailLocation) {
        detailLocation.innerHTML = `<i class="fa-solid fa-location-dot text-muted me-1"></i> ${escapeHtml(locationVal)}`;
    }

    // Price
    const detailPrice = document.getElementById("detailPrice");
    if (detailPrice) {
        detailPrice.textContent = priceVal ? `₹${priceVal}` : "N/A";
    }

    // Description
    const detailDescription = document.getElementById("detailDescription");
    if (detailDescription) {
        detailDescription.textContent = descVal;
    }

    // Amenities
    const detailAmenities = document.getElementById("detailAmenities");
    if (detailAmenities) {
        if (amenitiesVal) {
            const list = String(amenitiesVal).split(",").map(i => i.trim()).filter(Boolean);
            if (list.length > 0) {
                detailAmenities.innerHTML = list.map(item => `<span class="badge bg-light text-dark border me-1 mb-1">${escapeHtml(item)}</span>`).join("");
            } else {
                detailAmenities.textContent = "No amenities listed.";
            }
        } else {
            detailAmenities.textContent = "No amenities listed.";
        }
    }

    // Phone / Call Actions
    const handleCall = () => {
        if (phoneVal) {
            window.location.href = `tel:${phoneVal}`;
        } else {
            showToast("Phone number not provided.");
        }
    };
    const callBtn = document.getElementById("callBtn");
    if (callBtn) callBtn.onclick = handleCall;
    const mobileCallBtn = document.getElementById("mobileCallBtn");
    if (mobileCallBtn) mobileCallBtn.onclick = handleCall;

    // WhatsApp Action
    const whatsappBtn = document.getElementById("whatsappBtn");
    if (whatsappBtn) {
        whatsappBtn.onclick = () => {
            const targetNum = whatsappVal || phoneVal;
            if (targetNum) {
                const cleanNumber = String(targetNum).replace(/[^0-9]/g, "");
                window.open(`https://wa.me/${cleanNumber}`, "_blank");
            } else {
                showToast("WhatsApp contact not available.");
            }
        };
    }

    // Google Map Action
    const mapBtn = document.getElementById("mapBtn");
    if (mapBtn) {
        mapBtn.onclick = () => {
            if (mapVal) {
                window.open(mapVal, "_blank");
            } else {
                showToast("Map link not available.");
            }
        };
    }

    // Website Action
    const websiteBtn = document.getElementById("websiteBtn");
    if (websiteBtn) {
        const siteUrl = String(websiteVal).trim();
        if (siteUrl && siteUrl !== "#") {
            websiteBtn.onclick = () => window.open(siteUrl, "_blank");
        } else {
            websiteBtn.style.display = "none";
        }
    }

    // Form & Wishlist Initializers
    setupEnquiryForm(phoneVal, nameVal);
    updateWishlistButton();
}

/* ===========================================================
   ENQUIRY FORM HANDLER
=========================================================== */

function setupEnquiryForm(ownerPhoneRaw, homestayName) {
    const enquiryForm = document.getElementById("enquiryForm");
    if (!enquiryForm) return;

    enquiryForm.onsubmit = function (e) {
        e.preventDefault();

        const ownerPhone = ownerPhoneRaw ? String(ownerPhoneRaw).replace(/[^0-9+]/g, "") : "";
        if (!ownerPhone) {
            showToast("Owner phone number is not available.");
            return;
        }

        const name = document.getElementById("enquiryName")?.value || "";
        const phone = document.getElementById("enquiryPhone")?.value || "";
        const checkIn = document.getElementById("enquiryCheckIn")?.value || "";
        const checkOut = document.getElementById("enquiryCheckOut")?.value || "";

        const message = `Hello! Enquiry for ${homestayName}:\n` +
                        `Name: ${name}\n` +
                        `Phone: ${phone}\n` +
                        `Check-in: ${checkIn}\n` +
                        `Check-out: ${checkOut}`;

        window.open(`https://wa.me/${ownerPhone}?text=${encodeURIComponent(message)}`, "_blank");
    };
}

/* ===========================================================
   WISHLIST HANDLERS
=========================================================== */

function updateWishlistButton() {
    if (!homestay) return;

    const rawId = homestay.id ?? homestay.ID ?? homestay.Id ?? homestay["sl_no"] ?? homestay["Sl No"];
    if (rawId === null || rawId === undefined) return;

    const homestayId = String(rawId);
    const liked = wishlist.includes(homestayId);

    const btn = document.getElementById("wishlistBtn");
    const mobileBtn = document.getElementById("mobileWishlistBtn");

    if (btn) {
        btn.innerHTML = liked ? `<i class="fa-solid fa-heart me-1"></i> Saved` : `<i class="fa-regular fa-heart me-1"></i> Save to Wishlist`;
        btn.className = liked ? "btn btn-danger" : "btn btn-outline-danger";
        btn.onclick = toggleWishlist;
    }

    if (mobileBtn) {
        mobileBtn.innerHTML = liked ? "❤️" : "🤍";
        mobileBtn.onclick = toggleWishlist;
    }
}

function toggleWishlist() {
    if (!homestay) return;

    const rawId = homestay.id ?? homestay.ID ?? homestay.Id ?? homestay["sl_no"] ?? homestay["Sl No"];
    if (rawId === undefined || rawId === null) return;

    const homestayId = String(rawId);
    const index = wishlist.indexOf(homestayId);

    if (index > -1) {
        wishlist.splice(index, 1);
        showToast("Removed from Wishlist");
    } else {
        wishlist.push(homestayId);
        showToast("Added to Wishlist!");
    }

    localStorage.setItem("wishlist", JSON.stringify(wishlist));
    updateWishlistButton();
}

/* ===========================================================
   TOAST FEEDBACK (SAFE BOOTSTRAP CHECK)
=========================================================== */

function showToast(msg) {
    const toastEl = document.getElementById("toastMessage");
    const toastText = document.getElementById("toastText");

    if (toastText) toastText.textContent = msg;

    if (toastEl && typeof bootstrap !== "undefined" && bootstrap?.Toast) {
        const toast = new bootstrap.Toast(toastEl, { delay: 2500 });
        toast.show();
    } else {
        alert(msg);
    }
}

/* ===========================================================
   UTILITIES
=========================================================== */

function escapeHtml(str) {
    return String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}