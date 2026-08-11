/* ==================================================
   DARJEELING HOMESTAY DIRECTORY
   SCRIPT.JS - APP MAIN CONTROLLER
================================================== */

/* Cache Configuration */
const CACHE_KEY = "homestay_cache";
const CACHE_TIME = "homestay_cache_time";
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

/* Apps Script Web App URL */
const SHEET_URL = "https://script.google.com/macros/s/AKfycbxQC1tyK7OMEb2CmIVXtDhecjBrIw49LonT01jNehB-7VfM5cNa1ph7fzWxSkEqpRyxdQ/exec";

/* Global State */
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

/* Initialize Application */
document.addEventListener("DOMContentLoaded", () => {
    loadWithCache();

    if (searchInput) searchInput.addEventListener("input", applyFilters);
    if (locationFilter) locationFilter.addEventListener("change", applyFilters);
    if (priceSlider) priceSlider.addEventListener("input", handlePriceSlider);
    if (sortSelect) sortSelect.addEventListener("change", applyFilters);
});

/* ======================================
   Data Fetching & Caching
====================================== */

async function loadHomestays() {
    showLoading();

    try {
        const response = await fetch(SHEET_URL);
        homestays = await response.json();

        filteredHomestays = [...homestays];
        populateLocations();
        applyFilters();
        hideLoading();
    } catch (error) {
        console.error("Error loading JSON data:", error);
        hideLoading();
        if (container) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger">
                        Unable to load homestay data.
                    </div>
                </div>
            `;
        }
    }
}

async function loadWithCache() {
    showLoading();
    let loadedFromCache = false;

    try {
        const cache = localStorage.getItem(CACHE_KEY);
        const time = localStorage.getItem(CACHE_TIME);

        if (cache && time && (Date.now() - Number(time) < CACHE_DURATION)) {
            try {
                const parsedData = JSON.parse(cache);
                if (Array.isArray(parsedData) && parsedData.length > 0) {
                    homestays = parsedData;
                    loadedFromCache = true;
                }
            } catch (e) {
                localStorage.removeItem(CACHE_KEY);
            }
        }

        if (!loadedFromCache) {
            const response = await fetch(SHEET_URL);
            homestays = await response.json();
            
            localStorage.setItem(CACHE_KEY, JSON.stringify(homestays));
            localStorage.setItem(CACHE_TIME, Date.now().toString());
        }

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
                </div>`;
        }
    } finally {
        hideLoading();
    }
}

/* ======================================
   Filtering & Sorting
====================================== */

function populateLocations() {
    if (!locationFilter) return;

    const locations = [...new Set(
        homestays
            .map(h => h.location ? h.location.trim() : "")
            .filter(Boolean)
    )].sort();

    locationFilter.innerHTML = '<option value="">All Locations</option>';
    locations.forEach(loc => {
        const option = document.createElement("option");
        option.value = loc;
        option.textContent = loc;
        locationFilter.appendChild(option);
    });
}

function handlePriceSlider() {
    if (priceValue && priceSlider) {
        priceValue.textContent = priceSlider.value;
    }
    applyFilters();
}

function applyFilters() {
    const search = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const selectedLocation = locationFilter ? locationFilter.value.toLowerCase() : "";
    const maxPrice = priceSlider ? Number(priceSlider.value) : Infinity;

    filteredHomestays = homestays.filter(h => {
        const nameMatch = h.name ? h.name.toLowerCase().includes(search) : false;
        const locMatchStr = h.location ? h.location.toLowerCase().includes(search) : false;
        const tagMatch = h.tags ? h.tags.toLowerCase().includes(search) : false;

        const matchesSearch = !search || nameMatch || locMatchStr || tagMatch;

        const hLocation = h.location ? h.location.toLowerCase().trim() : "";
        const matchesLocation = !selectedLocation || hLocation === selectedLocation;

        const price = Number(h.price) || 0;
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
        filteredHomestays.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sortVal === "priceHigh") {
        filteredHomestays.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else if (sortVal === "rating") {
        filteredHomestays.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
    }
}

/* ======================================
   UI Rendering
====================================== */

function renderHomestays() {
    if (!container) return;
    container.innerHTML = "";

    if (resultCount) {
        resultCount.textContent = filteredHomestays.length;
    }

    if (filteredHomestays.length === 0) {
        if (noResult) noResult.classList.remove("d-none");
        return;
    }

    if (noResult) noResult.classList.add("d-none");

    filteredHomestays.forEach(h => {
        const firstImg = h.image ? h.image.split("|")[0].trim() : "https://via.placeholder.com/400x250?text=No+Image";
        const isWishlisted = wishlist.includes(String(h.id));

        const card = document.createElement("div");
        card.className = "col-md-6 col-lg-4 mb-4";

        card.innerHTML = `
            <div class="card h-100 shadow-sm border-0 rounded-4 overflow-hidden position-relative">
                <button class="btn btn-light position-absolute top-0 end-0 m-3 rounded-circle shadow-sm"
                        style="z-index: 2; width: 40px; height: 40px; padding: 0;"
                        onclick="toggleWishlistMain('${h.id}', event)">
                    <span id="wish-icon-${h.id}">${isWishlisted ? '❤️' : '🤍'}</span>
                </button>
                <img src="${firstImg}" class="card-img-top" alt="${h.name || 'Homestay'}" style="height: 220px; object-fit: cover;">
                <div class="card-body d-flex flex-column p-4">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-2 fs-6">
                            <i class="fa-solid fa-location-dot me-1"></i>${h.location || 'Darjeeling'}
                        </span>
                        <span class="fw-bold text-warning">
                            <i class="fa-solid fa-star me-1"></i>${h.rating || '4.5'}
                        </span>
                    </div>
                    <h5 class="card-title fw-bold text-dark mb-2">${h.name || 'Untitled Homestay'}</h5>
                    <p class="card-text text-muted small flex-grow-1 mb-3">${h.short_description || h.description || ''}</p>
                    <div class="d-flex justify-content-between align-items-center pt-3 border-top">
                        <div>
                            <span class="fs-5 fw-bold text-success">₹${h.price || 'N/A'}</span>
                            <span class="text-muted small">/ night</span>
                        </div>
                        <a href="details.html?id=${h.id}" class="btn btn-outline-success rounded-pill px-4">View Details</a>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function toggleWishlistMain(id, event) {
    if (event) event.stopPropagation();
    const strId = String(id);
    const index = wishlist.indexOf(strId);

    if (index > -1) {
        wishlist.splice(index, 1);
    } else {
        wishlist.push(strId);
    }

    localStorage.setItem("wishlist", JSON.stringify(wishlist));
    const icon = document.getElementById(`wish-icon-${id}`);
    if (icon) {
        icon.textContent = wishlist.includes(strId) ? '❤️' : '🤍';
    }
}

function showLoading() {
    if (loading) loading.classList.remove("d-none");
}

function hideLoading() {
    if (loading) loading.classList.add("d-none");
}

/* Navbar scroll effect */
window.addEventListener("scroll", function () {
    const navbar = document.querySelector(".navbar");
    if (navbar) {
        if (window.scrollY > 30) {
            navbar.classList.add("scrolled");
        } else {
            navbar.classList.remove("scrolled");
        }
    }
});

console.log("Darjeeling Homestay Directory Loaded Successfully");