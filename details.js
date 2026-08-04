/* ===========================================================
   DARJEELING HOMESTAY DIRECTORY
   DETAILS.JS - OPTIMIZED & ENHANCED
=========================================================== */

const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTWXIyW8Zk4YXmIK4Bl1g2cMIIWBEOaaIrfSM2zaWsTr63lmc0Td8lDm2kY11Ap2w/pub?gid=942226858&single=true&output=csv";
/*
const DATA_URL = "data.json";
*/
let homestay = null;
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
const id = new URLSearchParams(window.location.search).get("id");

document.addEventListener("DOMContentLoaded", loadHomestay);

async function loadHomestay() {
    try {
        const response = await fetch(SHEET_URL);
        const csv = await response.text();
        const homes = csvToObjects(csv);
        /*
        const response = await fetch(DATA_URL);
        const homes = await response.json();
         */
        homestay = homes.find(h => String(h.id) === String(id));

        if (!homestay) {
            document.body.innerHTML = `
                <div class="container py-5 text-center">
                    <div class="alert alert-warning shadow-sm rounded-4 p-5">
                        <i class="fa-solid fa-triangle-exclamation fs-1 text-warning mb-3"></i>
                        <h3 class="fw-bold">Homestay Not Found</h3>
                        <p class="text-muted">The requested property could not be located or has been moved.</p>
                        <a href="index.html" class="btn btn-success mt-2">Return to Directory</a>
                    </div>
                </div>
            `;
            return;
        }

        displayHomestay();
    } catch (err) {
        console.error("Error loading CSV:", err);
    }
}

/* ================= CSV PARSER ================= */
function csvToObjects(csv) {
    const rows = csv.trim().split("\n");
    const headers = rows[0].split(",").map(h => h.trim());
    const data = [];

    for (let i = 1; i < rows.length; i++) {
        const values = parseCSV(rows[i]);
        let obj = {};
        headers.forEach((h, index) => {
            obj[h] = values[index] ? values[index].trim() : "";
        });
        data.push(obj);
    }
    return data;
}

function parseCSV(line) {
    let result = [];
    let current = "";
    let inside = false;

    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
            inside = !inside;
        } else if (c === "," && !inside) {
            result.push(current);
            current = "";
        } else {
            current += c;
        }
    }
    result.push(current);
    return result;
}

/* ================= RENDER HOMESTAY ================= */
function displayHomestay() {
    document.title = `${homestay.name || 'Details'} | Darjeeling Homestay`;

    // Hero Header Setup
    document.getElementById("heroImage").src = homestay.image || "https://placehold.co/1200x700?text=No+Image+Available";
    document.getElementById("homeName").textContent = homestay.name || "Unnamed Homestay";
    document.getElementById("homeLocation").innerHTML = `<i class="fa-solid fa-location-dot text-danger me-1"></i> ${homestay.location || 'Location Not Specified'}`;

    // Summary Card Setup
    document.getElementById("detailName").textContent = homestay.name || "";
    document.getElementById("detailLocation").innerHTML = `<i class="fa-solid fa-location-dot text-muted me-1"></i> ${homestay.location || ''}`;
    
    const formattedPrice = homestay.price ? `₹ ${homestay.price}` : "Price on Request";
    document.getElementById("detailPrice").textContent = formattedPrice;
    
    // Mobile Bottom Bar Price Update
    const mobilePriceEl = document.getElementById("mobilePrice");
    if (mobilePriceEl) mobilePriceEl.textContent = formattedPrice;

    // Body Content
    document.getElementById("detailDescription").textContent = homestay.description || "No description provided for this homestay.";
    document.getElementById("detailScenery").textContent = homestay.scenery || "No specific scenic views detailed for this location.";

    renderAmenities();
    setupButtons();
    createGallery();
    updateWishlistButton();
}

/* ================= AMENITIES ================= */
function renderAmenities() {
    const container = document.getElementById("detailAmenities");
    container.innerHTML = "";

    if (!homestay.amenities) {
        container.innerHTML = `<span class="text-muted small">No amenities listed for this stay.</span>`;
        return;
    }

    homestay.amenities.split(",").forEach(item => {
        if (item.trim()) {
            container.innerHTML += `
                <span class="amenity-chip">
                    <i class="fa-solid fa-circle-check text-success"></i>
                    ${item.trim()}
                </span>
            `;
        }
    });
}

/* ================= BUTTON ACTION HANDLERS ================= */
function setupButtons() {
    // Phone Call Handler
    const handleCall = () => {
        if (homestay && homestay.phone) {
            window.location.href = `tel:${homestay.phone}`;
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
            if (homestay && homestay.whatsapp) {
                const cleanNumber = homestay.whatsapp.replace(/[^0-9]/g, '');
                window.open(`https://wa.me/${cleanNumber}`, "_blank");
            } else {
                showToast("WhatsApp contact not available.");
            }
        };
    }

    // Google Maps Link
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

    // Website Link
    const websiteBtn = document.getElementById("websiteBtn");
    if (websiteBtn) {
        if (homestay && homestay.website && homestay.website !== "#") {
            websiteBtn.onclick = () => window.open(homestay.website, "_blank");
        } else {
            websiteBtn.style.display = "none";
        }
    }

    // Dynamic Share Handler (Native Share Drawer + Clipboard Fallback)
    const handleShare = async (e) => {
        if (e) e.preventDefault();

        const shareData = {
            title: homestay ? homestay.name : document.title,
            text: homestay ? `🏡 Check out ${homestay.name} in ${homestay.location}!` : "Check out this homestay!",
            url: window.location.href
        };

        // Check if Web Share API is available (Requires HTTPS on Mobile Browsers)
        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                // Fired if the user cancels out of the share drawer
                console.log("Share sheet dismissed or canceled:", err);
            }
        } else {
            // Fallback for HTTP testing, Desktop Chrome, or unsupported browsers
            try {
                await navigator.clipboard.writeText(window.location.href);
                showToast("Link copied to clipboard!");
            } catch (err) {
                // Ultimate fallback if clipboard access is denied
                prompt("Copy this link to share:", window.location.href);
            }
        }
    };

    // Attach click handler to ALL Share buttons on the page (by ID or Class)
    const shareBtns = document.querySelectorAll("#shareBtn, .share-btn");
    shareBtns.forEach(btn => {
        btn.onclick = handleShare;
    });

    // Social Links setup
    const socialLinks = [
        { id: "facebookBtn", url: homestay ? homestay.facebook : "" },
        { id: "instagramBtn", url: homestay ? homestay.instagram : "" },
        { id: "youtubeBtn", url: homestay ? homestay.youtube : "" }
    ];

    let hasSocials = false;
    socialLinks.forEach(item => {
        const btn = document.getElementById(item.id);
        if (!btn) return;

        const url = (item.url || "").trim();
        if (url && url !== "#" && url.toLowerCase() !== "n/a") {
            btn.href = url;
            btn.target = "_blank";
            btn.rel = "noopener noreferrer";
            btn.style.display = "inline-flex";
            hasSocials = true;
        } else {
            btn.style.display = "none";
        }
    });

    if (!hasSocials) {
        const socialCard = document.getElementById("socialCard");
        if (socialCard) socialCard.style.display = "none";
    }
}

/* ================= ENQUIRY FORM (WHATSAPP SYSTEM) ================= */
function setupEnquiryForm() {
    const enquiryForm = document.getElementById("enquiryForm");
    if (!enquiryForm) return;

    enquiryForm.onsubmit = function (e) {
        e.preventDefault();

        // Retrieve WhatsApp or Phone number from sheet data
        let ownerPhone = homestay ? (homestay.whatsapp || homestay.phone || "") : "";
        
        // Strip non-numeric characters
        ownerPhone = ownerPhone.replace(/[^0-9]/g, '');

        if (!ownerPhone) {
            showToast("Owner contact number is not available.");
            return;
        }

        // Auto-prepend India country code (+91) if 10 digits provided
        if (ownerPhone.length === 10) {
            ownerPhone = "91" + ownerPhone;
        }

        const name = document.getElementById("enquiryName").value;
        const phone = document.getElementById("enquiryPhone").value;
        const checkIn = document.getElementById("enquiryCheckIn").value;
        const checkOut = document.getElementById("enquiryCheckOut").value;
        const homestayName = homestay ? homestay.name : "Homestay";

        const message = `Hello! I would like to enquire about *${homestayName}*:\n\n` +
                        `👤 *Name:* ${name}\n` +
                        `📞 *Phone:* ${phone}\n` +
                        `📅 *Check-in:* ${checkIn}\n` +
                        `📅 *Check-out:* ${checkOut}`;

        const whatsappUrl = `https://wa.me/${ownerPhone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, "_blank");
    };
}


/* ================= GALLERY ENGINE ================= */
function createGallery() {
    const gallery = document.getElementById("galleryContainer");
    if (!gallery) return;

    gallery.innerHTML = "";
    let images = [];

    if (homestay.gallery) {
        images = homestay.gallery.split("|").map(img => img.trim()).filter(img => img !== "");
    }

    if (images.length === 0) {
        gallery.innerHTML = `
            <div class="col-12 text-center text-muted py-3">
                <i class="fa-regular fa-image fs-3 mb-2 d-block"></i>
                <p class="mb-0">No extra gallery photos available.</p>
            </div>
        `;
        return;
    }

    images.forEach(img => {
        gallery.innerHTML += `
            <div class="col-6 col-md-4">
                <div class="gallery-item shadow-sm" onclick="openImage('${img}')">
                    <img src="${img}" class="gallery-image" alt="Homestay Photo" loading="lazy">
                </div>
            </div>
        `;
    });
}

/* Modal Zoom Image View */
function openImage(src) {
    const modalImg = document.getElementById("previewImage");
    if (modalImg) {
        modalImg.src = src;
        const modal = new bootstrap.Modal(document.getElementById("imageModal"));
        modal.show();
    }
}

/* ================= WISHLIST SYSTEM ================= */
function updateWishlistButton() {
    const btn = document.getElementById("wishlistBtn");
    const mobileBtn = document.getElementById("mobileWishlistBtn");

    if (!homestay) return;

    const liked = wishlist.includes(String(homestay.id));

    if (btn) {
        btn.innerHTML = liked ? "❤️ Wishlisted" : "🤍 Add Wishlist";
        btn.className = liked ? "btn btn-danger" : "btn btn-outline-danger";
        btn.onclick = toggleWishlist;
    }

    if (mobileBtn) {
        mobileBtn.innerHTML = liked ? "❤️" : "🤍";
        mobileBtn.onclick = toggleWishlist;
    }
}

function toggleWishlist() {
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

/* ================= UTILITY TOAST NOTIFIER ================= */
function showToast(msg) {
    const toastEl = document.getElementById("toastMessage");
    const toastText = document.getElementById("toastText");

    if (toastEl && toastText) {
        toastText.textContent = msg;
        const toast = new bootstrap.Toast(toastEl, { delay: 2500 });
        toast.show();
    }
}
