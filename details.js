/* ===========================================================
   DARJEELING HOMESTAY DIRECTORY
   DETAILS.JS
=========================================================== */

const SHEET_URL =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vTWXIyW8Zk4YXmIK4Bl1g2cMIIWBEOaaIrfSM2zaWsTr63lmc0Td8lDm2kY11Ap2w/pub?gid=942226858&single=true&output=csv";

let homestay = null;

let wishlist =
JSON.parse(localStorage.getItem("wishlist")) || [];

const id =
new URLSearchParams(window.location.search).get("id");

document.addEventListener(

"DOMContentLoaded",

loadHomestay

);


/* ==========================================
   Load Google Sheet
========================================== */

async function loadHomestay(){

    try{

        const response =
        await fetch(SHEET_URL);

        const csv =
        await response.text();

        const homes =
        csvToObjects(csv);

        homestay =
        homes.find(h=>String(h.id)===String(id));

        if(!homestay){

            document.body.innerHTML=

            `
            <div class="container py-5">

            <div class="alert alert-danger">

            Homestay not found.

            </div>

            </div>
            `;

            return;

        }

        displayHomestay();

    }

    catch(err){

        console.error(err);

    }

}


/* ==========================================
   CSV Parser
========================================== */

function csvToObjects(csv){

    const rows =
    csv.trim().split("\n");

    const headers =
    rows[0]
    .split(",")
    .map(h=>h.trim());

    const data=[];

    for(let i=1;i<rows.length;i++){

        const values =
        parseCSV(rows[i]);

        let obj={};

        headers.forEach((h,index)=>{

            obj[h]=values[index] || "";

        });

        data.push(obj);

    }

    return data;

}


/* ==========================================
   Parse CSV
========================================== */

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
/* ===========================================================
   DETAILS.JS - PART 2
   DISPLAY HOMESTAY
=========================================================== */

function displayHomestay(){

    document.title =
    homestay.name + " | Darjeeling Homestay";

    document.getElementById("heroImage").src =
    homestay.image ||
    "https://placehold.co/1200x700?text=No+Image";

    document.getElementById("homeName").textContent =
    homestay.name;

    document.getElementById("homeLocation").innerHTML =
    `<i class="fa-solid fa-location-dot"></i>
     ${homestay.location}`;

    document.getElementById("detailName").textContent =
    homestay.name;

    document.getElementById("detailLocation").innerHTML =
    `<i class="fa-solid fa-location-dot"></i>
     ${homestay.location}`;

    document.getElementById("detailPrice").textContent =
    homestay.price
    ? "₹ " + homestay.price
    : "Price on Request";

    document.getElementById("detailDescription").textContent =
    homestay.description ||
    "No description available.";

    document.getElementById("detailScenery").textContent =
    homestay.scenery ||
    "No scenery information available.";

    renderAmenities();

    setupButtons();

    createGallery();

    updateWishlistButton();

}


/* ==========================================
   Amenities
========================================== */

function renderAmenities(){

    const container =
    document.getElementById("detailAmenities");

    container.innerHTML = "";

    if(!homestay.amenities){

        container.innerHTML =
        "<p>No amenities available.</p>";

        return;

    }

    homestay.amenities

    .split(",")

    .forEach(item=>{

        container.innerHTML +=

        `

        <span class="amenity">

            <i class="fa-solid fa-check text-success"></i>

            ${item.trim()}

        </span>

        `;

    });

}


/* ==========================================
   Contact Buttons
========================================== */

function setupButtons(){

    if(homestay.phone){

        document.getElementById("callBtn")

        .onclick = ()=>{

            window.location.href =
            "tel:" + homestay.phone;

        };

    }

    if(homestay.whatsapp){

        document.getElementById("whatsappBtn")

        .onclick = ()=>{

            window.open(

            "https://wa.me/" +

            homestay.whatsapp,

            "_blank"

            );

        };

    }

    if(homestay.googleMap){

        document.getElementById("mapBtn")

        .onclick = ()=>{

            window.open(

            homestay.googleMap,

            "_blank"

            );

        };

    }

    if(homestay.website){

        document.getElementById("websiteBtn")

        .onclick = ()=>{

            window.open(

            homestay.website,

            "_blank"

            );

        };

    }

    document.getElementById("facebookBtn").href =
    homestay.facebook || "#";

    document.getElementById("instagramBtn").href =
    homestay.instagram || "#";

    document.getElementById("youtubeBtn").href =
    homestay.youtube || "#";

   const shareBtn = document.getElementById("shareBtn");

if (shareBtn) {

    shareBtn.onclick = async () => {

        const shareData = {
            title: homestay.name,
            text: `🏡 ${homestay.name}
📍 ${homestay.location}
₹ ${homestay.price}`,
            url: window.location.href
        };

        if (navigator.share) {

            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log(err);
            }

        } else {

            navigator.clipboard.writeText(window.location.href);
            alert("Link copied to clipboard.");

        }

    };

}

}

/* ==========================================
   Gallery
========================================== */

function createGallery() {

    const gallery =
    document.getElementById("galleryContainer");

    if (!gallery) return;

    gallery.innerHTML = "";

    let images = [];

    if (homestay.image) {

        images = homestay.image
            .split("|")
            .map(img => img.trim())
            .filter(img => img !== "");

    }

    if (images.length === 0) {

        images.push("https://placehold.co/800x500?text=No+Image");

    }

    images.forEach(img => {

        gallery.innerHTML += `

        <div class="col-lg-4 col-md-6">

            <img src="${img}"
                 class="img-fluid rounded shadow">

        </div>

        `;

    });

}


/* ==========================================
   Wishlist
========================================== */

function updateWishlistButton(){

    const btn =
    document.getElementById("wishlistBtn");

    if(!btn) return;

    const liked =
    wishlist.includes(String(homestay.id));

    btn.innerHTML =
    liked ?

    "❤️ Remove Wishlist"

    :

    "🤍 Add Wishlist";

    btn.onclick = toggleWishlist;

}


function toggleWishlist(){

    const id = String(homestay.id);

    const index =
    wishlist.indexOf(id);

    if(index > -1){

        wishlist.splice(index,1);

    }

    else{

        wishlist.push(id);

    }

    localStorage.setItem(

        "wishlist",

        JSON.stringify(wishlist)

    );

    updateWishlistButton();

}


