/* ==================================================
   DARJEELING HOMESTAY DIRECTORY
   APP.JS - PART 3A
================================================== */

const SHEET_URL =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vTWXIyW8Zk4YXmIK4Bl1g2cMIIWBEOaaIrfSM2zaWsTr63lmc0Td8lDm2kY11Ap2w/pub?gid=942226858&single=true&output=csv";

/* ======================================
   Global Variables
====================================== */

let homestays = [];

let filteredHomestays = [];

let wishlist =
JSON.parse(localStorage.getItem("wishlist")) || [];


/* ======================================
   Elements
====================================== */

const container =
document.getElementById("homestayContainer");

const searchInput =
document.getElementById("searchInput");

const locationFilter =
document.getElementById("locationFilter");

const priceSlider =
document.getElementById("priceSlider");

const priceValue =
document.getElementById("priceValue");

const sortSelect =
document.getElementById("sortSelect");

const resultCount =
document.getElementById("resultCount");

const loading =
document.getElementById("loading");

const noResult =
document.getElementById("noResult");

const wishlistCount =
document.getElementById("wishlistCount");

const clearFilters =
document.getElementById("clearFilters");


/* ======================================
   Loading
====================================== */

function showLoading(){

    loading.style.display="block";

}

function hideLoading(){

    loading.style.display="none";

}


/* ======================================
   Start
====================================== */

document.addEventListener(

"DOMContentLoaded",

()=>{

loadHomestays();

updateWishlistCount();

}

);


/* ======================================
   Load Google Sheet
====================================== */

async function loadHomestays(){

showLoading();

try{

const response=
await fetch(SHEET_URL);

const csv=
await response.text();

homestays=
csvToObjects(csv);

filteredHomestays=
[...homestays];

populateLocations();

applyFilters();

hideLoading();

}

catch(error){

console.error(error);

hideLoading();

container.innerHTML=

`
<div class="col-12">

<div class="alert alert-danger">

Unable to load Google Sheet.

</div>

</div>

`;

}

}


/* ======================================
   CSV Parser
====================================== */

function csvToObjects(csv){

const rows=
csv.trim().split("\n");

const headers=
rows[0]
.split(",")
.map(h=>h.trim());

const data=[];

for(let i=1;i<rows.length;i++){

const values=
parseCSV(rows[i]);

let obj={};

headers.forEach((header,index)=>{

obj[header]=
values[index] || "";

});

data.push(obj);

}

return data;

}


/* ======================================
   Parse CSV
====================================== */

function parseCSV(line){

let result=[];

let current="";

let inside=false;

for(let i=0;i<line.length;i++){

const c=line[i];

if(c=='"'){

inside=!inside;

}

else if(c=="," && !inside){

result.push(current);

current="";

}

else{

current+=c;

}

}

result.push(current);

return result;

}

/* ==================================================
   APP.JS - PART 3B
   FILTERS & SEARCH
==================================================*/


/* ======================================
   Populate Location Dropdown
====================================== */

function populateLocations(){

    const locations = [
        ...new Set(
            homestays
            .map(home => (home.location || "").trim())
            .filter(location => location !== "")
        )
    ];

    locations.sort();

    locationFilter.innerHTML = `

        <option value="">

            All Locations

        </option>

    `;

    locations.forEach(location => {

        locationFilter.innerHTML += `

            <option value="${location}">

                ${location}

            </option>

        `;

    });

}


/* ======================================
   Apply Filters
====================================== */

function applyFilters(){

    const keyword =
    searchInput.value.toLowerCase().trim();

    const selectedLocation =
    locationFilter.value;

    const maxPrice =
    Number(priceSlider.value);

    priceValue.innerHTML =
    "₹" + maxPrice;

    filteredHomestays =
    homestays.filter(home => {

        const name =
        (home.name || "").toLowerCase();

        const location =
        (home.location || "").toLowerCase();

        const description =
        (home.description || "").toLowerCase();

        const amenities =
        (home.amenities || "").toLowerCase();

        const price =
        parseInt(home.price) || 0;

        const searchMatch =

            name.includes(keyword) ||

            location.includes(keyword) ||

            description.includes(keyword) ||

            amenities.includes(keyword);

        const locationMatch =

            selectedLocation === "" ||

            home.location === selectedLocation;

        const priceMatch =

            price <= maxPrice;

        return (

            searchMatch &&

            locationMatch &&

            priceMatch

        );

    });

    sortHomestays();

}


/* ======================================
   Sort
====================================== */

function sortHomestays(){

    const sort =
    sortSelect.value;

    switch(sort){

        case "priceLow":

            filteredHomestays.sort(

                (a,b)=>

                (parseInt(a.price)||0)

                -

                (parseInt(b.price)||0)

            );

            break;

        case "priceHigh":

            filteredHomestays.sort(

                (a,b)=>

                (parseInt(b.price)||0)

                -

                (parseInt(a.price)||0)

            );

            break;

        case "nameAZ":

            filteredHomestays.sort(

                (a,b)=>

                a.name.localeCompare(b.name)

            );

            break;

        case "nameZA":

            filteredHomestays.sort(

                (a,b)=>

                b.name.localeCompare(a.name)

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

searchInput.addEventListener(

    "input",

    applyFilters

);

locationFilter.addEventListener(

    "change",

    applyFilters

);

priceSlider.addEventListener(

    "input",

    applyFilters

);

sortSelect.addEventListener(

    "change",

    applyFilters

);

clearFilters.addEventListener(

    "click",

    ()=>{

        searchInput.value = "";

        locationFilter.value = "";

        priceSlider.value = 10000;

        sortSelect.value = "default";

        applyFilters();

    }

);

/* ==================================================
   APP.JS - PART 3C
   CARD RENDERING
==================================================*/


/* ======================================
   Extract Numeric Price
====================================== */

function getPrice(value){

    if(!value) return 0;

    const number =
    String(value)
    .replace(/[^0-9]/g,"");

    return parseInt(number) || 0;

}


/* ======================================
   Render Homestays
====================================== */

function renderHomestays(){

    container.innerHTML = "";

    resultCount.innerHTML =
    filteredHomestays.length;

    if(filteredHomestays.length===0){

        noResult.classList.remove("d-none");

        return;

    }

    noResult.classList.add("d-none");

    filteredHomestays.forEach(home=>{

        const image =

        home.image && home.image.trim()!=="" ?

        home.image :

        "https://placehold.co/800x500?text=No+Image";

        const price =
        getPrice(home.price);

        const liked =
        wishlist.includes(String(home.id));

        const amenities =

        (home.amenities || "")

        .split(",")

        .slice(0,4)

        .map(item=>

            `<span class="amenity">

            ${item.trim()}

            </span>`

        )

        .join("");

        container.innerHTML += `

<div class="col-xl-4 col-lg-4 col-md-6">

<div class="homestay-card fade-up">

<div class="card-image">

<img

src="${image}"

loading="lazy"

alt="${home.name}"

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

${home.name}

</h4>

<div class="location-badge mb-3">

<i class="fa-solid fa-location-dot"></i>

${home.location}

</div>

<p class="card-text">

${(home.description || "").substring(0,120)}...

</p>

<div class="amenity-list">

${amenities}

</div>

<div class="d-grid mt-4">

<a

href="details.html?id=${home.id}"

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
   Update Result Count
====================================== */

function updateResultCount(){

    resultCount.innerHTML =

    filteredHomestays.length;

}


/* ======================================
   Refresh Screen
====================================== */

function refreshDirectory(){

    applyFilters();

}
/* ==================================================
   APP.JS - PART 3D
   WISHLIST, TOAST & UTILITIES
==================================================*/


/* ======================================
   Wishlist
====================================== */

function toggleWishlist(id){

    id = String(id);

    const index = wishlist.indexOf(id);

    if(index > -1){

        wishlist.splice(index,1);

        showToast("Removed from Wishlist ❤️");

    }

    else{

        wishlist.push(id);

        showToast("Added to Wishlist ❤️");

    }

    localStorage.setItem(

        "wishlist",

        JSON.stringify(wishlist)

    );

    updateWishlistCount();

    renderHomestays();

}


/* ======================================
   Wishlist Counter
====================================== */

function updateWishlistCount(){

    wishlistCount.innerHTML = wishlist.length;

}


/* ======================================
   Toast
====================================== */

function showToast(message){

    const toastBody =

    document.getElementById("toastText");

    toastBody.innerHTML = message;

    const toast =

    new bootstrap.Toast(

        document.getElementById("toastMessage")

    );

    toast.show();

}


/* ======================================
   Scroll To Top
====================================== */

window.addEventListener(

"scroll",

()=>{

const button =

document.getElementById("topBtn");

if(window.scrollY > 400){

button.style.display = "block";

}

else{

button.style.display = "none";

}

});

document.getElementById("topBtn")

.addEventListener(

"click",

()=>{

window.scrollTo({

top:0,

behavior:"smooth"

});

});


/* ======================================
   Image Preview
====================================== */

document.addEventListener(

"click",

function(e){

if(

e.target.tagName==="IMG"

&&

e.target.closest(".card-image")

){

document

.getElementById("previewImage")

.src=e.target.src;

new bootstrap.Modal(

document.getElementById("imageModal")

).show();

}

});


/* ======================================
   Cache Google Sheet
====================================== */

const CACHE_KEY = "homestay_cache";

const CACHE_TIME = "homestay_cache_time";

const CACHE_DURATION =

30 * 60 * 1000;


/* Optional cache loader */

async function loadWithCache(){

    const cache =

    localStorage.getItem(CACHE_KEY);

    const time =

    localStorage.getItem(CACHE_TIME);

    if(

        cache &&

        time &&

        Date.now()-Number(time)

        < CACHE_DURATION

    ){

        homestays =

        JSON.parse(cache);

    }

    else{

        const response =

        await fetch(SHEET_URL);

        const csv =

        await response.text();

        homestays =

        csvToObjects(csv);

        localStorage.setItem(

            CACHE_KEY,

            JSON.stringify(homestays)

        );

        localStorage.setItem(

            CACHE_TIME,

            Date.now()

        );

    }

    filteredHomestays = [...homestays];

    populateLocations();

    applyFilters();

}

//wishlist
document.addEventListener("DOMContentLoaded", () => {
    const wishlistContainer = document.getElementById("wishlistContainer");
    
    if (wishlistContainer) {
        loadWishlist();
    }
});

function loadWishlist() {
    const wishlistContainer = document.getElementById("wishlistContainer");
    
    // Retrieve saved wishlist array from localStorage (adjust key name if yours differs, e.g., 'wishlist')
    const savedWishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

    if (savedWishlist.length === 0) {
        wishlistContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="card border-0 shadow-sm p-5">
                    <h3 class="text-muted mb-3">Your wishlist is empty</h3>
                    <p class="text-muted mb-4">Browse homestays and tap the wishlist button to save them here for your trip.</p>
                    <a href="index.html" class="btn btn-success px-4 py-2 mx-auto" style="width: fit-content;">Explore Homestays</a>
                </div>
            </div>
        `;
        return;
    }

    // Render saved items (Assuming savedWishlist contains homestay objects or IDs)
    // If you store full objects, you can loop and build HTML cards directly:
    wishlistContainer.innerHTML = savedWishlist.map(homestay => `
        <div class="col-md-4 mb-4">
            <div class="card h-100 border-0 shadow-sm rounded-4 overflow-hidden">
                <img src="${homestay.image || 'placeholder.jpg'}" class="card-img-top" alt="${homestay.name}" style="height: 200px; object-fit: cover;">
                <div class="card-body d-flex flex-column">
                    <h5 class="fw-bold">${homestay.name}</h5>
                    <p class="text-muted small mb-2"><i class="fa-solid fa-location-dot"></i> ${homestay.location}</p>
                    <h6 class="text-success fw-bold mb-3">₹ ${homestay.price}</h6>
                    <div class="mt-auto d-flex gap-2">
                        <a href="details.html?id=${homestay.id}" class="btn btn-outline-success flex-grow-1">View Details</a>
                        <button onclick="removeFromWishlist('${homestay.id}')" class="btn btn-outline-danger"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Helper function to remove an item from wishlist storage
function removeFromWishlist(id) {
    let savedWishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
    savedWishlist = savedWishlist.filter(item => item.id !== id);
    localStorage.setItem("wishlist", JSON.stringify(savedWishlist));
    loadWishlist(); // Refresh grid
}


/* ======================================
   Console
====================================== */

console.log(

"Darjeeling Homestay Directory Loaded Successfully"

);
