/* ===========================================================
   DARJEELING HOMESTAY DIRECTORY
   DETAILS.JS - JSON API VERSION
=========================================================== */

/* ===========================================================
   JSON API & CACHE CONFIGURATION
=========================================================== */

/* Switch between local data.json or Google Apps Script Web App URL */
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

// Sync wishlist changes made in other tabs instantly
window.addEventListener("storage", (e) => {
    if (e.key === "wishlist") {
        wishlist = JSON.parse(e.newValue) || [];
        updateWishlistButton();
    }
});

/* ===========================================================
   LOAD HOMESTAY FROM JSON API
=========================================================== */

async function loadHomestay() {
    try {
        console.log("Loading homestay ID:", id);

        if (!id) {
            showNotFound();
            return;
        }

        let homes = null;

        /* ⚡ INSTANT LOAD: Check if cache exists and is fresh */
        const cachedData = localStorage.getItem(CACHE_KEY);
        const cachedTime = localStorage.getItem(CACHE_TIME_KEY);

        if (cachedData && cachedTime && (Date.now() - Number(cachedTime) < CACHE_DURATION)) {
            try {
                homes = JSON.parse(cachedData);
                console.log("Loaded homes from cache");
            } catch (e) {
                console.error("Cache parse error", e);
                localStorage.removeItem(CACHE_KEY);
                localStorage.removeItem(CACHE_TIME_KEY);
            }
        }

        /* 🐢 FALLBACK: Only fetch from network/API if cache is missing or expired */
        if (!homes) {
            console.log("No cache found. Fetching fresh data...");
            const response = await fetch(DATA_URL);

            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }

            homes = await response.json();

            if (!Array.isArray(homes)) {
                throw new Error("JSON API did not return an array");
            }

            // Save to localStorage using standardized cache keys
            localStorage.setItem(CACHE_KEY, JSON.stringify(homes));
            localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
        }

        /* Find requested homestay */
        homestay = homes.find(
            home => String(home.id).trim() === String(id).trim()
        );

        if (!homestay) {
            showNotFound();
            return;
        }

        displayHomestay();

    } catch (error) {
        console.error("Error loading homestay:", error);
        showError("Unable to load homestay details. Please refresh the page.");
    }
}

/* ===========================================================
   NOT FOUND
=========================================================== */

function showNotFound() {
    document.body.innerHTML = `
        <div class="container py-5 text-center">
            <div class="alert alert-warning shadow-sm rounded-4 p-5">
                <i class="fa-solid fa-triangle-exclamation fs-1 text-warning mb-3"></i>
                <h3 class="fw-bold">Homestay Not Found</h3>
                <p class="text-muted">
                    The requested property could not be located.
                </p>
                <a href="index.html" class="btn btn-success mt-2">
                    Return to Directory
                </a>
            </div>
        </div>
    `;
}

/* ===========================================================
   ERROR
=========================================================== */

function showError(message) {
    const loader = document.getElementById("loading");

    if (loader) {
        loader.innerHTML = `
            <div class="alert alert-danger">
                ${message}
            </div>
        `;
    }
}

/* ===========================================================
   DISPLAY HOMESTAY
=========================================================== */

function displayHomestay() {
    /* ==========================================
       Page title
    ========================================== */
    document.title = `${homestay.name || "Details"} | Darjeeling Homestay`;

    /* ==========================================
       Hero Image
    ========================================== */
    const heroImage = document.getElementById("heroImage");
    if (heroImage) {
        heroImage.src = homestay.image || "https://placehold.co/1200x700?text=No+Image+Available";
    }

    /* ==========================================
       Hero Name
    ========================================== */
    const homeName = document.getElementById("homeName");
    if (homeName) {
        homeName.textContent = homestay.name || "Unnamed Homestay";
    }

    /* ==========================================
       Hero Location
    ========================================== */
    const homeLocation = document.getElementById("homeLocation");
    if (homeLocation) {
        homeLocation.innerHTML = `
            <i class="fa-solid fa-location-dot text-danger me-1"></i>
            ${homestay.location || "Location Not Specified"}
        `;
    }

    /* ==========================================
       Details Name
    ========================================== */
    const detailName = document.getElementById("detailName");
    if (detailName) {
        detailName.textContent = homestay.name || "";
    }

    /* ==========================================
       Details Location
    ========================================== */
    const detailLocation = document.getElementById("detailLocation");
    if (detailLocation) {
        detailLocation.innerHTML = `
            <i class="fa-solid fa-location-dot text-muted me-1"></i>
            ${homestay.location || ""}
        `;
    }

    /* ==========================================
       Price
    ========================================== */
    const detailPrice = document.getElementById("detailPrice");
    if (detailPrice) {
        detailPrice.textContent = homestay.price ? `₹${homestay.price}` : "N/A";
    }

    /* ==========================================
       Description
    ========================================== */
    const detailDescription = document.getElementById("detailDescription");
    if (detailDescription) {
        detailDescription.textContent = homestay.description || "No description provided.";
    }

    /* ==========================================
       Amenities
    ========================================== */
    const detailAmenities = document.getElementById("detailAmenities");
    if (detailAmenities) {
        if (homestay.amenities) {
            const amenitiesList = String(homestay.amenities)
                .split(",")
                .map(item => item.trim())
                .filter(Boolean);

            if (amenitiesList.length > 0) {
                detailAmenities.innerHTML = amenitiesList
                    .map(item => `<span class="badge bg-light text-dark border me-1 mb-1">${escapeHtml(item)}</span>`)
                    .join("");
            } else {
                detailAmenities.textContent = "No amenities listed.";
            }
        } else {
            detailAmenities.textContent = "No amenities listed.";
        }
    }

    /* ==========================================
       CALL ACTION
    ========================================== */
    const handleCall = () => {
        if (homestay && homestay.phone) {
            window.location.href = `tel:${homestay.phone}`;
        } else {
            showToast("Phone number not provided.");
        }
    };

    const callBtn = document.getElementById("callBtn");
    if (callBtn) {
        callBtn.onclick = handleCall;
    }

    const mobileCallBtn = document.getElementById("mobileCallBtn");
    if (mobileCallBtn) {
        mobileCallBtn.onclick = handleCall;
    }

    /* ==========================================
       WHATSAPP ACTION
    ========================================== */
    const whatsappBtn = document.getElementById("whatsappBtn");
    if (whatsappBtn) {
        whatsappBtn.onclick = () => {
            if (homestay && homestay.whatsapp) {
                const cleanNumber = homestay.whatsapp.replace(/[^0-9]/g, "");
                window.open(`https://wa.me/${cleanNumber}`, "_blank");
            } else {
                showToast("WhatsApp contact not available.");
            }
        };
    }

    /* ==========================================
       GOOGLE MAP ACTION
    ========================================== */
    const mapBtn = document.getElementById("mapBtn");
    if (mapBtn) {
        mapBtn.onclick = () => {
            if (homestay && homestay.googleMap) {
                window.open(homestay.googleMap, "_blank");
            } else {
                showToast("Map direction link not available.");
            }
        };
    }

    /* ==========================================
       WEBSITE ACTION
    ========================================== */
    const websiteBtn = document.getElementById("websiteBtn");
    if (websiteBtn) {
        const website = (homestay.website || "").trim();
        if (website && website !== "#") {
            websiteBtn.onclick = () => {
                window.open(website, "_blank");
            };
        } else {
            websiteBtn.style.display = "none";
        }
    }

    /* ==========================================
       ENQUIRY FORM
    ========================================== */
    setupEnquiryForm();

    /* ==========================================
       WISHLIST BUTTON
    ========================================== */
    updateWishlistButton();
}

/* ===========================================================
   ENQUIRY FORM HANDLER
=========================================================== */

function setupEnquiryForm() {
    const enquiryForm = document.getElementById("enquiryForm");
    if (!enquiryForm) return;

    enquiryForm.onsubmit = function (e) {
        e.preventDefault();

        let ownerPhone = homestay && homestay.phone ? homestay.phone.replace(/[^0-9+]/g, "") : "";
        if (!ownerPhone) {
            showToast("Owner phone number is not available.");
            return;
        }

        const name = document.getElementById("enquiryName").value;
        const phone = document.getElementById("enquiryPhone").value;
        const checkIn = document.getElementById("enquiryCheckIn").value;
        const checkOut = document.getElementById("enquiryCheckOut").value;

        const homestayName = homestay ? homestay.name : "Homestay";
        const message = `Hello! Enquiry for ${homestayName}:\n` +
                        `Name: ${name}\n` +
                        `Phone: ${phone}\n` +
                        `Check-in: ${checkIn}\n` +
                        `Check-out: ${checkOut}`;

        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/${ownerPhone}?text=${encodedMessage}`, "_blank");
    };
}

/* ===========================================================
   UPDATE WISHLIST BUTTON
=========================================================== */

function updateWishlistButton() {
    if (!homestay) return;

    const homestayId = String(homestay.id);
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

/* ===========================================================
   TOGGLE WISHLIST
=========================================================== */

function toggleWishlist() {
    if (!homestay) return;

    const homestayId = String(homestay.id);
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
   TOAST FEEDBACK
=========================================================== */

function showToast(msg) {
    const toastEl = document.getElementById("toastMessage");
    const toastText = document.getElementById("toastText");

    if (toastEl && toastText) {
        toastText.textContent = msg;

        const toast = new bootstrap.Toast(toastEl, {
            delay: 2500
        });

        toast.show();
    }
}

/* ===========================================================
   UTILITY HELPERS
=========================================================== */

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* ===========================================================
   DEBUG LOG
=========================================================== */

console.log("Details JS loaded - JSON API version");
console.log("Requested ID:", id);