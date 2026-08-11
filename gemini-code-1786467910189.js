/* ===========================================================
   DARJEELING HOMESTAY DIRECTORY
   DETAILS.JS - OPTIMIZED & ENHANCED
=========================================================== */

const SHEET_URL = "https://script.google.com/macros/s/AKfycbxQC1tyK7OMEb2CmIVXtDhecjBrIw49LonT01jNehB-7VfM5cNa1ph7fzWxSkEqpRyxdQ/exec";

let homestay = null;
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
const id = new URLSearchParams(window.location.search).get("id");

document.addEventListener("DOMContentLoaded", loadHomestay);

async function loadHomestay() {
    try {
        let homes;
        const cache = localStorage.getItem("homestay_cache");

        if (cache) {
            try {
                homes = JSON.parse(cache);
            } catch (e) {
                localStorage.removeItem("homestay_cache");
            }
        }

        if (!homes) {
            const response = await fetch(SHEET_URL);
            homes = await response.json();
            localStorage.setItem("homestay_cache", JSON.stringify(homes));
        }

        homestay = homes.find(h => String(h.id) === String(id));

        if (!homestay) {
            document.body.innerHTML = `
                <div class="container py-5 text-center">
                    <div class="alert alert-warning shadow-sm rounded-4 p-5">
                        <i class="fa-solid fa-triangle-exclamation fs-1 text-warning mb-3"></i>
                        <h3 class="fw-bold">Homestay Not Found</h3>
                        <a href="index.html" class="btn btn-success mt-2">Return to Directory</a>
                    </div>
                </div>
            `;
            return;
        }

        displayHomestay();
    } catch (err) {
        console.error("Error loading homestay details:", err);
    }
}

/* ================= RENDER HOMESTAY DETAILS ================= */
function displayHomestay() {
    document.title = `${homestay.name || 'Homestay Details'} | Vibe Stay`;

    const titleEl = document.getElementById("title");
    const locationEl = document.getElementById("location");
    const priceEl = document.getElementById("price");
    const ratingEl = document.getElementById("rating");
    const descriptionEl = document.getElementById("description");

    if (titleEl) titleEl.textContent = homestay.name || "Untitled Homestay";
    if (locationEl) locationEl.textContent = homestay.location || "Darjeeling";
    if (priceEl) priceEl.textContent = `₹${homestay.price || 'N/A'}`;
    if (ratingEl) ratingEl.textContent = homestay.rating || "4.5";
    if (descriptionEl) descriptionEl.textContent = homestay.description || homestay.short_description || "No description available.";

    renderGallery();
    renderAmenities();
    renderContactInfo();
    updateWishlistButton();
}

/* ================= GALLERY RENDERER ================= */
function renderGallery() {
    const heroImage = document.getElementById("heroImage");
    const galleryGrid = document.getElementById("galleryGrid");

    if (!homestay) return;

    let images = [];
    if (homestay.gallery) {
        images = homestay.gallery.split("|").map(img => img.trim()).filter(Boolean);
    } else if (homestay.image) {
        images = homestay.image.split("|").map(img => img.trim()).filter(Boolean);
    }

    if (images.length === 0) {
        images = ["https://via.placeholder.com/800x500?text=No+Image+Available"];
    }

    if (heroImage) {
        heroImage.src = images[0];
        heroImage.onclick = () => openImageModal(images[0]);
    }

    if (galleryGrid) {
        galleryGrid.innerHTML = "";
        images.slice(1, 5).forEach(img => {
            const col = document.createElement("div");
            col.className = "col-6 col-md-3 mb-3";
            col.innerHTML = `
                <img src="${img}" class="img-fluid rounded-3 shadow-sm hover-zoom" 
                     style="height: 120px; width: 100%; object-fit: cover; cursor: pointer;"
                     onclick="openImageModal('${img}')">
            `;
            galleryGrid.appendChild(col);
        });
    }
}

/* ================= AMENITIES RENDERER ================= */
function renderAmenities() {
    const amenitiesContainer = document.getElementById("amenitiesContainer");
    if (!amenitiesContainer || !homestay.amenities) return;

    const amenitiesList = homestay.amenities.split("|").map(a => a.trim()).filter(Boolean);
    amenitiesContainer.innerHTML = "";

    amenitiesList.forEach(amenity => {
        const badge = document.createElement("span");
        badge.className = "badge bg-light text-dark border p-2 me-2 mb-2 rounded-pill shadow-xs";
        badge.innerHTML = `<i class="fa-solid fa-check text-success me-1"></i>${amenity}`;
        amenitiesContainer.appendChild(badge);
    });
}

/* ================= CONTACT & ACTION LINKS ================= */
function renderContactInfo() {
    const callBtn = document.getElementById("callBtn");
    const whatsappBtn = document.getElementById("whatsappBtn");

    if (callBtn && homestay.phone) {
        callBtn.href = `tel:${homestay.phone}`;
    }

    if (whatsappBtn && homestay.phone) {
        const message = encodeURIComponent(`Hi, I found your homestay "${homestay.name}" on Vibe Stay and would like to inquire about availability.`);
        whatsappBtn.href = `https://wa.me/${homestay.phone.replace(/[^0-9]/g, '')}?text=${message}`;
    }
}

/* ================= IMAGE MODAL ================= */
function openImageModal(src) {
    const modalImg = document.getElementById("modalImage");
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

/* ================= UTILITY TOAST NOTIFIER ================= */
function showToast(msg) {
    const toastEl = document.getElementById("toastMessage");
    const toastText = document.getElementById("toastText");

    if (toastEl && toastText) {
        toastText.textContent = msg;
        const toast = new bootstrap.Toast(toastEl);
        toast.show();
    }
}