/* ==================================================
   DARJEELING HOMESTAY DIRECTORY
   APP.JS - JSON API VERSION
================================================== */

/* ======================================
   JSON API + Cache
====================================== */

const DATA_URL = "https://script.google.com/macros/s/AKfycbwDr5oX8tcgMuXPbUZphku7qNEMfm_KcIpiwwFQdR_UQ7P0DzW4x2lFs9S4H4TnHvN7/exec";
const CACHE_KEY = "homestay_cache";
const CACHE_TIME = "homestay_cache_time";
const CACHE_DURATION = 30 * 60 * 1000;

/* ======================================
   Global Variables
====================================== */

let homestays = [];
let filteredHomestays = [];
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

/* ======================================
   Elements
====================================== */

const container = document.getElementById("homestayContainer");
const searchInput = document.getElementById("searchInput");
const locationFilter = document.getElementById("locationFilter");
const priceSlider = document.getElementById("priceSlider");
const priceValue = document.getElementById("priceValue");
const sortSelect = document.getElementById("sortSelect");
const resultCount = document.getElementById("resultCount");
const loading = document.getElementById("loading");
const noResult = document.getElementById("noResult");
const wishlistCount = document.getElementById("wishlistCount");
const clearFilters = document.getElementById("clearFilters");

/* ======================================
   Loading
====================================== */

function showLoading() {
    if (loading) {
        loading.style.display = "block";
    }
}

function hideLoading() {
    if (loading) {
        loading.style.display = "none";
    }
}

/* ======================================
   Start
====================================== */

document.addEventListener("DOMContentLoaded", () => {
    loadWithCache();
    updateWishlistCount();
});

/* ======================================
   Load Homestays From JSON API
====================================== */

async function loadHomestays() {
    showLoading();

    try {
        const response = await fetch(DATA_URL);

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("API did not return an array");
        }

        homestays = data;
        filteredHomestays = [...homestays];

        populateLocations();
        applyFilters();
        hideLoading();

        return homestays;

    } catch (error) {
        console.error("JSON API loading error:", error);
        hideLoading();

        if (container) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger">
                        Unable to load homestay data. Please refresh the page.
                    </div>
                </div>
            `;
        }

        throw error;
    }
}

/* ==================================================
   FILTERS & SEARCH
==================================================*/

/* ======================================
   Populate Location Dropdown
====================================== */

function populateLocations() {
    if (!locationFilter) return;

    const locations = [
        ...new Set(
            homestays
                .map(home => (home.location || "").trim())
                .filter(location => location !== "")
        )
    ];

    locations.sort();

    locationFilter.innerHTML = `<option value="">All Locations</option>`;

    locations.forEach(location => {
        locationFilter.innerHTML += `<option value="${location}">${location}</option>`;
    });
}

/* ======================================
   Apply Filters
====================================== */

function applyFilters() {
    const keyword = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const selectedLocation = locationFilter ? locationFilter.value : "";
    const maxPrice = priceSlider ? Number(priceSlider.value) : Infinity;

    if (priceValue && priceSlider) {
        priceValue.innerHTML = "₹" + maxPrice;
    }

    filteredHomestays = homestays.filter(home => {
        const name = (home.name || "").toLowerCase();
        const location = (home.location || "").toLowerCase();
        const description = (home.description || "").toLowerCase();
        const amenities = (home.amenities || "").toLowerCase();
        const price = parseInt(home.price) || 0;

        const searchMatch =
            name.includes(keyword) ||
            location.includes(keyword) ||
            description.includes(keyword) ||
            amenities.includes(keyword);

        const locationMatch =
            selectedLocation === "" ||
            home.location === selectedLocation;

        const priceMatch = price <= maxPrice;

        return searchMatch && locationMatch && priceMatch;
    });

    sortHomestays();
}

/* ======================================
   Sort
====================================== */

function sortHomestays() {
    if (!sortSelect) return;

    const sort = sortSelect.value;

    switch (sort) {
        case "priceLow":
            filteredHomestays.sort(
                (a, b) => (parseInt(a.price) || 0) - (parseInt(b.price) || 0)
            );
            break;

        case "priceHigh":
            filteredHomestays.sort(
                (a, b) => (parseInt(b.price) || 0) - (parseInt(a.price) || 0)
            );
            break;

        case "nameAZ":
            filteredHomestays.sort(
                (a, b) => (a.name || "").localeCompare(b.name || "")
            );
            break;

        case "nameZA":
            filteredHomestays.sort(
                (a, b) => (b.name || "").localeCompare(a.name || "")
            );
            break;

        default:
            break;
    }

    renderHomestays();
}

/* ======================================
   Event Listeners
====================================== */

if (searchInput) searchInput.addEventListener("input", applyFilters);
if (locationFilter) locationFilter.addEventListener("change", applyFilters);
if (priceSlider) priceSlider.addEventListener("input", applyFilters);
if (sortSelect) sortSelect.addEventListener("change", applyFilters);

if (clearFilters) {
    clearFilters.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";
        if (locationFilter) locationFilter.value = "";
        if (priceSlider) priceSlider.value = 10000;
        if (sortSelect) sortSelect.value = "default";
        applyFilters();
    });
}

/* ======================================
   Share Button
====================================== */

const shareButton = document.getElementById("shareBtn");

if (shareButton) {
    shareButton.addEventListener("click", async () => {
        const shareData = {
            title: document.title || "Darjeeling Homestay Directory",
            text: "Check out this amazing homestay page!",
            url: window.location.href
        };

        /* Native mobile share */
        if (navigator.share) {
            try {
                await navigator.share(shareData);
                return;
            } catch (err) {
                if (err.name !== "AbortError") {
                    console.log("Share skipped or cancelled:", err);
                }
                return;
            }
        }

        /* Desktop fallback */
        try {
            await navigator.clipboard.writeText(window.location.href);
            showToast("Link copied to clipboard! 📋");
        } catch (err) {
            prompt("Copy this link to share:", window.location.href);
        }
    });
}

/* ==================================================
   CARD RENDERING
==================================================*/

/* ======================================
   Extract Numeric Price
====================================== */

function getPrice(value) {
    if (!value) return 0;
    const number = String(value).replace(/[^0-9]/g, "");
    return parseInt(number) || 0;
}

/* ======================================
   Render Homestays
====================================== */

function renderHomestays() {
    if (!container) return;

    container.innerHTML = "";

    if (resultCount) {
        resultCount.innerHTML = filteredHomestays.length;
    }

    if (filteredHomestays.length === 0) {
        if (noResult) noResult.classList.remove("d-none");
        return;
    }

    if (noResult) noResult.classList.add("d-none");

    filteredHomestays.forEach(home => {
        const image = home.image && home.image.trim() !== ""
            ? home.image
            : "https://placehold.co/800x500?text=No+Image";

        const price = getPrice(home.price);
        const liked = wishlist.includes(String(home.id));

        const amenities = (home.amenities || "")
            .split(",")
            .slice(0, 4)
            .map(item => `<span class="amenity">${item.trim()}</span>`)
            .join("");

        container.innerHTML += `
            <div class="col-xl-4 col-lg-4 col-md-6">
                <div class="homestay-card fade-up">
                    <div class="card-image">
                        <img
                            src="${image}"
                            loading="lazy"
                            alt="${home.name || "Homestay"}"
                            onerror="this.src='https://placehold.co/800x500?text=No+Image'">
                        <button
                            class="wishlist"
                            onclick="toggleWishlist('${home.id}')">
                            ${liked ? "❤️" : "🤍"}
                        </button>
                        <div class="price-badge">
                            ₹${price}
                        </div>
                    </div>

                    <div class="card-body">
                        <h4 class="card-title">
                            ${home.name || ""}
                        </h4>

                        <div class="location-badge mb-3">
                            <i class="fa-solid fa-location-dot"></i>
                            ${home.location || ""}
                        </div>

                        <p class="card-text">
                            ${(home.description || "").substring(0, 120)}...
                        </p>

                        <div class="amenity-list">
                            ${amenities}
                        </div>

                        <div class="d-grid mt-4">
                            <a
                                href="${getDetailsPage(home.id)}"
                                class="btn btn-view">
                                View Details
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
}

/* ======================================
   Details Page Routing
====================================== */

function getDetailsPage(id) {
    switch (String(id)) {
        case "0":
            return "try.html";
        default:
            return `details.html?id=${id}`;
    }
}

/* ======================================
   Update Result Count
====================================== */

function updateResultCount() {
    if (resultCount) {
        resultCount.innerHTML = filteredHomestays.length;
    }
}

/* ======================================
   Refresh Screen
====================================== */

function refreshDirectory() {
    applyFilters();
}

/* ==================================================
   WISHLIST, TOAST & UTILITIES
==================================================*/

/* ======================================
   Wishlist
====================================== */

function toggleWishlist(id) {
    id = String(id);
    const index = wishlist.indexOf(id);

    if (index > -1) {
        wishlist.splice(index, 1);
        showToast("Removed from Wishlist ❤️");
    } else {
        wishlist.push(id);
        showToast("Added to Wishlist ❤️");
    }

    localStorage.setItem("wishlist", JSON.stringify(wishlist));
    updateWishlistCount();
    renderHomestays();
}

/* ======================================
   Wishlist Counter
====================================== */

function updateWishlistCount() {
    if (wishlistCount) {
        wishlistCount.innerHTML = wishlist.length;
    }
}

/* ======================================
   Toast
====================================== */

function showToast(message) {
    const toastBody = document.getElementById("toastText");
    if (!toastBody) return;
    toastBody.innerHTML = message;

    const toastElement = document.getElementById("toastMessage");
    if (!toastElement) return;

    const toast = new bootstrap.Toast(toastElement);
    toast.show();
}

/* ======================================
   Scroll To Top
====================================== */

window.addEventListener("scroll", () => {
    const button = document.getElementById("topBtn");
    if (!button) return;

    if (window.scrollY > 400) {
        button.style.display = "block";
    } else {
        button.style.display = "none";
    }
});

const topButton = document.getElementById("topBtn");

if (topButton) {
    topButton.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
}

/* ======================================
   Image Preview
====================================== */

document.addEventListener("click", function (e) {
    if (e.target.tagName === "IMG" && e.target.closest(".card-image")) {
        const preview = document.getElementById("previewImage");
        const modalElement = document.getElementById("imageModal");

        if (!preview || !modalElement) return;

        preview.src = e.target.src;
        new bootstrap.Modal(modalElement).show();
    }
});

/* ==================================================
   CACHE SYSTEM - JSON
==================================================*/

async function loadWithCache() {
    showLoading();
    let loadedFromCache = false;

    try {
        const cache = localStorage.getItem(CACHE_KEY);
        const time = localStorage.getItem(CACHE_TIME);

        /* ==================================
           Use valid cached JSON
        ================================== */

        if (cache && time && (Date.now() - Number(time) < CACHE_DURATION)) {
            try {
                const parsedData = JSON.parse(cache);

                if (Array.isArray(parsedData) && parsedData.length > 0) {
                    homestays = parsedData;
                    loadedFromCache = true;
                }
            } catch (e) {
                console.error("Invalid cache:", e);
                localStorage.removeItem(CACHE_KEY);
                localStorage.removeItem(CACHE_TIME);
            }
        }

        /* ==================================
           Fetch fresh JSON
        ================================== */

        if (!loadedFromCache) {
            const response = await fetch(DATA_URL);

            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }

            const data = await response.json();

            if (!Array.isArray(data)) {
                throw new Error("JSON API did not return an array");
            }

            homestays = data;

            /* Save JSON to cache */
            localStorage.setItem(CACHE_KEY, JSON.stringify(homestays));
            localStorage.setItem(CACHE_TIME, Date.now().toString());
        }

        /* ==================================
           Render
        ================================== */

        filteredHomestays = [...homestays];
        populateLocations();
        applyFilters();

    } catch (error) {
        console.error("Loading error:", error);

        if (container) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="alert alert-danger">
                        Unable to load homestay data. Please refresh.
                    </div>
                </div>
            `;
        }
    } finally {
        hideLoading();
    }
}

/* ======================================
   Navbar Scrolling
====================================== */

window.addEventListener("scroll", function () {
    const navbar = document.querySelector(".navbar");
    if (!navbar) return;

    if (window.scrollY > 30) {
        navbar.classList.add("scrolled");
    } else {
        navbar.classList.remove("scrolled");
    }
});

/* ======================================
   Console
====================================== */

console.log("Darjeeling Homestay Directory Loaded Successfully - JSON API");
