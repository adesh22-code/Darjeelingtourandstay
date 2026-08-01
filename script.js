/* ===========================================================
   DARJEELING HOMESTAY DIRECTORY
   PART 3.1
=========================================================== */

const SHEET_URL =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vTWXIyW8Zk4YXmIK4Bl1g2cMIIWBEOaaIrfSM2zaWsTr63lmc0Td8lDm2kY11Ap2w/pub?gid=942226858&single=true&output=csv";

/* --------------------------
   Global Variables
--------------------------- */

let homestays = [];
let filteredHomestays = [];

const homestayContainer =
document.getElementById("homestayContainer");

const featuredContainer =
document.getElementById("featuredContainer");

const loading =
document.getElementById("loading");

const searchInput =
document.getElementById("searchInput");

const wishlistCount =
document.getElementById("wishlistCount");


/* --------------------------
   Loading
--------------------------- */

function showLoading(){

    loading.style.display="block";

}

function hideLoading(){

    loading.style.display="none";

}


/* --------------------------
   Fetch Google Sheet
--------------------------- */

async function loadHomestays(){

    try{

        showLoading();

        const response =
        await fetch(SHEET_URL);

        const csv =
        await response.text();

        homestays =
        csvToObjects(csv);

        filteredHomestays =
        [...homestays];

        renderHomestays(filteredHomestays);

        renderFeatured();

        updateWishlistCount();

        hideLoading();

    }

    catch(error){

        console.error(error);

        hideLoading();

        homestayContainer.innerHTML=
        `
        <div class="col-12">

        <div class="alert alert-danger">

        Failed to load homestays.

        </div>

        </div>
        `;

    }

}


/* --------------------------
   CSV Parser
--------------------------- */

function csvToObjects(csv){

    const rows =
    csv.trim().split("\n");

    const headers =
    rows[0]
    .split(",")
    .map(h=>h.trim());

    const data=[];

    for(let i=1;i<rows.length;i++){

        const values=parseCSV(rows[i]);

        let obj={};

        headers.forEach((header,index)=>{

            obj[header]=
            values[index] || "";

        });

        data.push(obj);

    }

    return data;

}


/* --------------------------
   CSV Line Parser
--------------------------- */

function parseCSV(line){

    let result=[];

    let current="";

    let insideQuotes=false;

    for(let i=0;i<line.length;i++){

        const char=line[i];

        if(char=='"'){

            insideQuotes=!insideQuotes;

        }

        else if(char=="," && !insideQuotes){

            result.push(current);

            current="";

        }

        else{

            current+=char;

        }

    }

    result.push(current);

    return result;

}


/* --------------------------
   Search
--------------------------- */

searchInput.addEventListener("input",function(){

    const keyword=
    this.value
    .toLowerCase()
    .trim();

    filteredHomestays=
    homestays.filter(home=>{

        return(

            home.name.toLowerCase().includes(keyword)

            ||

            home.location.toLowerCase().includes(keyword)

            ||

            home.description.toLowerCase().includes(keyword)

            ||

            home.amenities.toLowerCase().includes(keyword)

        );

    });

    renderHomestays(filteredHomestays);

});


/* --------------------------
   Start
--------------------------- */

document.addEventListener("DOMContentLoaded",()=>{

    loadHomestays();

});

/* ===========================================================
   PART 3.2
   CREATE HOMESTAY CARDS
=========================================================== */

function renderHomestays(data){

    homestayContainer.innerHTML="";

    if(data.length===0){

        homestayContainer.innerHTML=`
        <div class="col-12 text-center py-5">
            <h3>No Homestay Found</h3>
            <p>Try another keyword.</p>
        </div>
        `;

        return;
    }

    data.forEach(home=>{

        const image =
        home.image && home.image.trim() !== ""
        ? home.image
        : "https://via.placeholder.com/600x400?text=Homestay";

        const card=`

        <div class="col-lg-4 col-md-6">

            <div class="homestay-card">

                <div class="card-image">

                    <img
                    src="${image}"
                    loading="lazy"
                    alt="${home.name}">

                    <span class="featured">
                    Mountain View
                    </span>

                    <button
                      class="wishlist"
                      data-id="${home.id}"
                      onclick="toggleWishlist('${home.id}')">

                      ${isWishlisted(home.id) ? "❤️" : "🤍"}

                      </button>

                </div>

                <div class="card-body">

                    <h4 class="card-title">

                        ${home.name}

                    </h4>

                    <div class="location">

                        <i class="fa-solid fa-location-dot"></i>

                        ${home.location}

                    </div>

                    <div class="rating">

                        ⭐⭐⭐⭐⭐

                    </div>

                    <div class="price">

                        ₹ ${home.price}

                        <small>/night</small>

                    </div>

                    <div class="badge-box">

                        ${createAmenityBadges(home.amenities)}

                    </div>

                    <p>

                    ${shortText(home.description,120)}

                    </p>

                    <button
                    class="btn btn-success btn-view"
                    onclick="openDetails('${home.id}')">

                    View Details

                    </button>

                </div>

            </div>

        </div>

        `;

        homestayContainer.innerHTML+=card;

    });

}


/* ==========================================
   Featured Homestays
========================================== */

function renderFeatured(){

    featuredContainer.innerHTML="";

    const featured=
    homestays.slice(0,3);

    featured.forEach(home=>{

        const image=
        home.image
        ? home.image
        : "https://via.placeholder.com/600x400";

        featuredContainer.innerHTML+=`

        <div class="col-lg-4">

            <div class="homestay-card">

                <div class="card-image">

                    <img src="${image}">

                </div>

                <div class="card-body">

                    <h5>${home.name}</h5>

                    <p>

                    📍 ${home.location}

                    </p>

                    <h4 class="text-success">

                    ₹ ${home.price}

                    </h4>

                </div>

            </div>

        </div>

        `;

    });

}


/* ==========================================
   Amenity Badges
========================================== */

function createAmenityBadges(text){

    if(!text) return "";

    const list=text.split(",");

    let html="";

    list.forEach(item=>{

        html+=`

        <span>

        ${item.trim()}

        </span>

        `;

    });

    return html;

}


/* ==========================================
   Description Shortener
========================================== */

function shortText(text,length){

    if(!text) return "";

    if(text.length<=length)
        return text;

    return text.substring(0,length)+"...";

}


/* ==========================================
   Open Details Page
========================================== */

function openDetails(id){

    window.location.href=
    "details.html?id="+id;

}

/* ===========================================================
   PART 3.3
   WISHLIST & UI FUNCTIONS
=========================================================== */

/* --------------------------
   Wishlist
--------------------------- */

let wishlist =
JSON.parse(localStorage.getItem("wishlist")) || [];


/* --------------------------
   Toggle Wishlist
--------------------------- */

function toggleWishlist(id){

    id = String(id);

    if(wishlist.includes(id)){

        wishlist =
        wishlist.filter(item => item !== id);

    }else{

        wishlist.push(id);

    }

    localStorage.setItem(
        "wishlist",
        JSON.stringify(wishlist)
    );

    updateWishlistCount();

    renderHomestays(filteredHomestays);

}


/* --------------------------
   Wishlist Counter
--------------------------- */

function updateWishlistCount(){

    if(wishlistCount){

        wishlistCount.innerHTML =
        wishlist.length;

    }

}


/* --------------------------
   Check Wishlist
--------------------------- */

function isWishlisted(id){

    return wishlist.includes(String(id));

}


/* --------------------------
   Replace Heart Icons
--------------------------- */

function refreshWishlistIcons(){

    document
    .querySelectorAll(".wishlist")
    .forEach(button=>{

        const id =
        button.dataset.id;

        if(isWishlisted(id)){

            button.innerHTML="❤️";

        }else{

            button.innerHTML="🤍";

        }

    });

}


/* --------------------------
   Scroll To Top
--------------------------- */

const topBtn =
document.getElementById("topBtn");

window.addEventListener("scroll",()=>{

    if(window.scrollY>300){

        topBtn.style.display="block";

    }

    else{

        topBtn.style.display="none";

    }

});


topBtn.addEventListener("click",()=>{

    window.scrollTo({

        top:0,

        behavior:"smooth"

    });

});


/* --------------------------
   Refresh Icons After Render
--------------------------- */

const oldRender =
renderHomestays;

renderHomestays=function(data){

    oldRender(data);

    refreshWishlistIcons();

};


/* --------------------------
   Image Error
--------------------------- */

document.addEventListener("error",function(e){

    if(e.target.tagName==="IMG"){

        e.target.src=
        "https://via.placeholder.com/600x400?text=No+Image";

    }

},true);


/* ===========================================================
   PART 3.4
   PERFORMANCE & UTILITIES
=========================================================== */

/* --------------------------
   Local Cache
--------------------------- */

const CACHE_KEY = "homestayCache";
const CACHE_TIME = "homestayCacheTime";
const CACHE_DURATION = 1000 * 60 * 30; // 30 Minutes


async function loadHomestays(){

    try{

        showLoading();

        const cache = localStorage.getItem(CACHE_KEY);
        const cacheTime = localStorage.getItem(CACHE_TIME);

        if(cache && cacheTime){

            const age = Date.now() - Number(cacheTime);

            if(age < CACHE_DURATION){

                homestays = JSON.parse(cache);
                filteredHomestays = [...homestays];

                renderHomestays(filteredHomestays);
                renderFeatured();
                updateWishlistCount();

                hideLoading();

                return;
            }

        }

        const response = await fetch(SHEET_URL);

        if(!response.ok){

            throw new Error("Network Error");

        }

        const csv = await response.text();

        homestays = csvToObjects(csv);

        filteredHomestays = [...homestays];

        localStorage.setItem(
            CACHE_KEY,
            JSON.stringify(homestays)
        );

        localStorage.setItem(
            CACHE_TIME,
            Date.now()
        );

        renderHomestays(filteredHomestays);

        renderFeatured();

        updateWishlistCount();

        hideLoading();

    }

    catch(err){

        console.error(err);

        hideLoading();

        homestayContainer.innerHTML=`

        <div class="col-12">

            <div class="alert alert-danger text-center">

                <h4>

                Failed to Load Google Sheet

                </h4>

                <p>

                Check Internet or Google Sheet Permission.

                </p>

                <button
                class="btn btn-success"

                onclick="loadHomestays()">

                Retry

                </button>

            </div>

        </div>

        `;

    }

}


/* --------------------------
   Clear Cache
--------------------------- */

function clearCache(){

    localStorage.removeItem(CACHE_KEY);

    localStorage.removeItem(CACHE_TIME);

}


/* --------------------------
   Reload Data
--------------------------- */

function reloadData(){

    clearCache();

    loadHomestays();

}


/* --------------------------
   Share Homestay
--------------------------- */

function shareHomestay(id){

    const url =
    window.location.origin+
    "/details.html?id="+id;

    if(navigator.share){

        navigator.share({

            title:"Darjeeling Homestay",

            text:"Check this Homestay",

            url:url

        });

    }

    else{

        navigator.clipboard.writeText(url);

        alert("Link Copied");

    }

}


/* --------------------------
   Phone
--------------------------- */

function callOwner(number){

    window.location.href="tel:"+number;

}


/* --------------------------
   WhatsApp
--------------------------- */

function whatsapp(number){

    window.open(

    "https://wa.me/"+number,

    "_blank"

    );

}


/* --------------------------
   Google Map
--------------------------- */

function openMap(url){

    window.open(url,"_blank");

}


/* --------------------------
   Website
--------------------------- */

function openWebsite(url){

    if(url){

        window.open(url,"_blank");

    }

}


/* --------------------------
   Scroll Animation
--------------------------- */

const observer = new IntersectionObserver(

entries=>{

entries.forEach(entry=>{

if(entry.isIntersecting){

entry.target.style.opacity=1;

entry.target.style.transform="translateY(0px)";

}

});

},

{

threshold:.1

}

);


function animateCards(){

document.querySelectorAll(".homestay-card")

.forEach(card=>{

card.style.opacity=0;

card.style.transform="translateY(40px)";

card.style.transition=".6s";

observer.observe(card);

});

}


/* --------------------------
   Override Render
--------------------------- */

const previousRender = renderHomestays;

renderHomestays=function(data){

previousRender(data);

refreshWishlistIcons();

animateCards();

};


/* --------------------------
   Console
--------------------------- */

console.log(

"Darjeeling Homestay Directory Loaded Successfully."

);
