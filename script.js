/* ==================================================
   DARJEELING HOMESTAY DIRECTORY
   SCRIPT.JS - HIGH-PERFORMANCE JSON API VERSION
================================================== */

const SHEET_URL = "https://script.google.com/macros/s/AKfycbwDr5oX8tcgMuXPbUZphku7qNEMfm_KcIpiwwFQdR_UQ7P0DzW4x2lFs9S4H4TnHvN7/exec";
const CACHE_KEY = "homestay_cache";
const CACHE_TIME = "homestay_cache_time";
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

let homestays = [];
let filteredHomestays = [];
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

/* DOM Elements */
const container = document.getElementById("homestayContainer");
const searchInput = document.getElementById("searchInput");
const locationFilter = document.getElementById("locationFilter");
const priceSlider = document.getElementById("priceSlider");
const priceValue = document.getElementById("priceValue");
const sortSelect = document.getElementById("sortSelect");
const resultCount = document.getElementById("resultCount");
const loading = document.getElementById("loading");
const noResult = document.getElementById("noResult");

/* Initialize Page Fast */
document.addEventListener("DOMContentLoaded", () => {
    initFastLoad();
    setupEventListeners();
});

function setupEventListeners() {
    if (searchInput) searchInput.addEventListener("input", applyFilters);
    if (locationFilter) locationFilter.addEventListener("change", applyFilters);
    if (priceSlider) priceSlider.addEventListener("input", handlePriceSlider);
    if (sortSelect) sortSelect.addEventListener("change", applyFilters);
}

/* ==================================================
   FAST INITIALIZATION & CACHING
================================================== */

async function initFastLoad() {
    let hasCachedData = false;

    // 1. Try Instant Render from LocalStorage
    try {
        const cache = localStorage.getItem(CACHE_KEY);
        if (cache) {
            const parsed = JSON.parse(cache);
            if (Array.isArray(parsed) && parsed.length > 0) {
                homestays = parsed;
                filteredHomestays = [...homestays];
                populateLocations();
                applyFilters();
                hideLoading();
                hasCachedData = true;
            }
        }
    } catch (e) {
        localStorage.removeItem(CACHE_KEY);
    }

    // Show loading spinner if no cached data exists
    if (!hasCachedData) {
        showLoading();
    }

    // 2. Fetch fresh data in the background if cache expired or missing
    const cacheTime = localStorage.getItem(CACHE_TIME);
    const isExpired = !cacheTime || (Date.now() - Number(cacheTime) > CACHE_DURATION);

    if (!hasCachedData || isExpired) {
        await fetchFreshData(!hasCachedData);
    }
}

async function fetchFreshData(showErrorUI = false) {
    try {
        const response = await fetch(SHEET_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const freshData = await response.json();
        if (!Array.isArray(freshData)) throw new Error("Invalid API format");

        // Save fresh data to LocalStorage
        homestays = freshData;
        localStorage.setItem(CACHE_KEY, JSON.stringify(homestays));
        localStorage.setItem(CACHE_TIME, Date.now().toString());

        // Update UI
        filteredHomestays = [...homestays];
        populateLocations();
        applyFilters();
    } catch (error) {
        console.error("Fetch error:", error);
        if (showErrorUI && container) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="alert alert-danger">
                        Unable to load homestay data. Please refresh.
                    </div>
                </div>`;
        }
    } finally {
        hideLoading();
    }
}

/* ==================================================
   FILTERING & SORTING
================================================== */

function populateLocations() {
    if (!locationFilter) return;

    const locations = [...new Set(
        homestays
            .map(h => (h.location || "").trim())
            .filter(Boolean)
    )].sort();

    let options = '<option value="">All Locations</option>';
    locations.forEach(loc => {
        options += `<option value="${loc}">${loc}</option>`;
    });

    locationFilter.innerHTML = options;
}

function handlePriceSlider() {
    if (priceValue && priceSlider) {
        priceValue.textContent = `₹${priceSlider.value}`;
    }
    applyFilters();
}

function applyFilters() {
    const search = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const selectedLoc = locationFilter ? locationFilter.value.toLowerCase() : "";
    const maxPrice = priceSlider ? Number(priceSlider.value) : Infinity;

    filteredHomestays = homestays.filter(h => {
        const nameMatch = (h.name || "").toLowerCase().includes(search);
        const locMatch = (h.location || "").toLowerCase().includes(search);
        const descMatch = (h.description || "").toLowerCase().includes(search);
        const matchesSearch = !search || nameMatch || locMatch || descMatch;

        const hLoc = (h.location || "").toLowerCase().trim();
        const matchesLocation = !selectedLoc || hLoc === selectedLoc;

        const price = parseInt(h.price) || 0;
        const matchesPrice = price <= maxPrice;

        return matchesSearch && matchesLocation && matchesPrice;
    });

    sortHomestays();
    renderHomestays();
}

function sortHomestays() {
    if (!sortSelect) return;
    const sortVal = sortSelect.value;

    if (sortVal === "priceLow") {
        filteredHomestays.sort((a, b) => (parseInt(a.price) || 0) - (parseInt(b.price) || 0));
    } else if (sortVal === "priceHigh") {
        filteredHomestays.sort((a, b) => (parseInt(b.price) || 0) - (parseInt(a.price) || 0));
    } else if (sortVal === "nameAZ") {
        filteredHomestays.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (sortVal === "nameZA") {
        filteredHomestays.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
    }
}

/* ==================================================
   FAST BATCH RENDERING
================================================== */

function renderHomestays() {
    if (!container) return;

    if (resultCount) {
        resultCount.textContent = filteredHomestays.length;
    }

    if (filteredHomestays.length === 0) {
        container.innerHTML = "";
        if (noResult) noResult.classList.remove("d-none");
        return;
    }

    if (noResult) noResult.classList.add("d-none");

    // Build all HTML in memory first for a single fast DOM write
    let cardsHtml = "";

    filteredHomestays.forEach(home => {
        const image = home.image && home.image.trim() !== ""
            ? home.image.split("|")[0].trim()
            : "https://placehold.co/800x500?text=No+Image";

        const price = parseInt(home.price) || 0;
        const liked = wishlist.includes(String(home.id));

        const amenities = (home.amenities || "")
            .split(",")
            .slice(0, 4)
            .map(item => `<span class="amenity">${item.trim()}</span>`)
            .join("");

        cardsHtml += `
            <div class="col-xl-4 col-lg-4 col-md-6 mb-4">
                <div class="homestay-card fade-up">
                    <div class="card-image position-relative">
                        <img src="${image}" loading="lazy" alt="${home.name || 'Homestay'}" 
                             onerror="this.src='https://placehold.co/800x500?text=No+Image'">
                        <button class="wishlist btn btn-light rounded-circle position-absolute top-0 end-0 m-2" 
                                onclick="toggleWishlist('${home.id}')">
                            ${liked ? "❤️" : "🤍"}
                        </button>
                        <div class="price-badge">₹${price}</div>
                    </div>
                    <div class="card-body">
                        <h4 class="card-title">${home.name || ''}</h4>
                        <div class="location-badge mb-3">
                            <i class="fa-solid fa-location-dot"></i> ${home.location || ''}
                        </div>
                        <p class="card-text">${(home.description || "").substring(0, 110)}...</p>
                        <div class="amenity-list">${amenities}</div>
                        <div class="d-grid mt-4">
                            <a href="${getDetailsPage(home.id)}" class="btn btn-view">View Details</a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = cardsHtml;
}

function getDetailsPage(id) {
    return String(id) === "0" ? "try.html" : `details.html?id=${id}`;
}

function showLoading() {
    if (loading) loading.style.display = "block";
}

function hideLoading() {
    if (loading) loading.style.display = "none";
}

function toggleWishlist(id) {
    id = String(id);
    const index = wishlist.indexOf(id);

    if (index > -1) {
        wishlist.splice(index, 1);
    } else {
        wishlist.push(id);
    }

    localStorage.setItem("wishlist", JSON.stringify(wishlist));
    renderHomestays();
}
