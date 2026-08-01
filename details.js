/* ==========================================================
   DETAILS.JS
   PART 4.3A
========================================================== */

const SHEET_URL =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vTWXIyW8Zk4YXmIK4Bl1g2cMIIWBEOaaIrfSM2zaWsTr63lmc0Td8lDm2kY11Ap2w/pub?gid=942226858&single=true&output=csv";

let homestays = [];
let currentHome = null;

/* --------------------------
   Get ID from URL
--------------------------- */

const params = new URLSearchParams(window.location.search);
const homestayId = params.get("id");

/* --------------------------
   Initialize
--------------------------- */

document.addEventListener("DOMContentLoaded", () => {

    loadHomestay();

});

/* --------------------------
   Load Google Sheet
--------------------------- */

async function loadHomestay(){

    try{

        const response = await fetch(SHEET_URL);

        const csv = await response.text();

        homestays = csvToObjects(csv);

        currentHome = homestays.find(
            h => String(h.id) === String(homestayId)
        );

        if(!currentHome){

            document.body.innerHTML = `
            <div class="container py-5 text-center">
                <h2>Homestay Not Found</h2>
                <a href="index.html"
                class="btn btn-success mt-3">
                Back Home
                </a>
            </div>
            `;
            return;

        }

        displayHomestay();

        loadRelatedHomestays();

    }

    catch(error){

        console.error(error);

        document.body.innerHTML=`
        <div class="container py-5 text-center">

        <h2>

        Unable to load Homestay

        </h2>

        <button
        class="btn btn-success"

        onclick="location.reload()">

        Retry

        </button>

        </div>
        `;

    }

}

/* --------------------------
   CSV Parser
--------------------------- */

function csvToObjects(csv){

    const rows = csv.trim().split("\n");

    const headers = rows[0]
        .split(",")
        .map(h=>h.trim());

    const data=[];

    for(let i=1;i<rows.length;i++){

        const values=parseCSV(rows[i]);

        let obj={};

        headers.forEach((header,index)=>{

            obj[header]=values[index] || "";

        });

        data.push(obj);

    }

    return data;

}

/* --------------------------
   Parse CSV Line
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
   Display Homestay
--------------------------- */

function displayHomestay(){

    document.title=currentHome.name;

    document.getElementById("heroImage").src=
        currentHome.image;

    document.getElementById("homeName").innerHTML=
        currentHome.name;

    document.getElementById("homeLocation").innerHTML=
        "📍 "+currentHome.location;

    document.getElementById("detailName").innerHTML=
        currentHome.name;

    document.getElementById("detailPrice").innerHTML=
        currentHome.price;

    document.getElementById("detailDescription").innerHTML=
        currentHome.description;

    document.getElementById("detailScenery").innerHTML=
        currentHome.scenery;

    createAmenities();

    connectButtons();

}

/* --------------------------
   Amenities
--------------------------- */

function createAmenities(){

    const container =
    document.getElementById("detailAmenities");

    container.innerHTML="";

    if(!currentHome.amenities) return;

    const list =
    currentHome.amenities.split(",");

    list.forEach(item=>{

        container.innerHTML +=

        `<span>${item.trim()}</span>`;

    });

}

/* ==========================================================
   DETAILS.JS
   PART 4.3B
========================================================== */

/* --------------------------
   Contact Buttons
--------------------------- */

function connectButtons(){

    // Call
    document.getElementById("callBtn").onclick=function(){

        if(currentHome.phone){

            window.location.href="tel:"+currentHome.phone;

        }

    };

    // WhatsApp
    document.getElementById("whatsappBtn").onclick=function(){

        if(currentHome.whatsapp){

            window.open(
                "https://wa.me/"+currentHome.whatsapp,
                "_blank"
            );

        }

    };

    // Google Map
    document.getElementById("mapBtn").onclick=function(){

        if(currentHome.googleMap){

            window.open(
                currentHome.googleMap,
                "_blank"
            );

        }

    };

    // Website
    document.getElementById("websiteBtn").onclick=function(){

        if(currentHome.website){

            window.open(
                currentHome.website,
                "_blank"
            );

        }

    };

    // Facebook
    if(currentHome.facebook){

        document
        .getElementById("facebookBtn")
        .href=currentHome.facebook;

    }else{

        document
        .getElementById("facebookBtn")
        .style.display="none";

    }

    // Instagram
    if(currentHome.instagram){

        document
        .getElementById("instagramBtn")
        .href=currentHome.instagram;

    }else{

        document
        .getElementById("instagramBtn")
        .style.display="none";

    }

    // YouTube
    if(currentHome.youtube){

        document
        .getElementById("youtubeBtn")
        .href=currentHome.youtube;

    }else{

        document
        .getElementById("youtubeBtn")
        .style.display="none";

    }

}

/* --------------------------
   Related Homestays
--------------------------- */

function loadRelatedHomestays(){

    const container=
    document.getElementById("relatedHomestays");

    container.innerHTML="";

    const related=
    homestays
    .filter(home=>home.id!==currentHome.id)
    .slice(0,3);

    related.forEach(home=>{

        const image=
        home.image && home.image.trim()!==""
        ? home.image
        : "https://via.placeholder.com/600x400?text=Homestay";

        container.innerHTML+=`

        <div class="col-lg-4 col-md-6 mb-4">

            <div class="card h-100 shadow-sm">

                <img
                src="${image}"
                class="card-img-top"
                style="height:220px;object-fit:cover;">

                <div class="card-body">

                    <h5>${home.name}</h5>

                    <p>

                    📍 ${home.location}

                    </p>

                    <h4 class="text-success">

                    ₹ ${home.price}

                    </h4>

                    <button

                    class="btn btn-success w-100"

                    onclick="window.location='details.html?id=${home.id}'">

                    View Details

                    </button>

                </div>

            </div>

        </div>

        `;

    });

}

/* --------------------------
   Image Error
--------------------------- */

document.addEventListener("error",function(e){

    if(e.target.tagName==="IMG"){

        e.target.src=
        "https://via.placeholder.com/800x500?text=No+Image";

    }

},true);

/* --------------------------
   Scroll Top
--------------------------- */

window.scrollTo({

    top:0,

    behavior:"smooth"

});

/* --------------------------
   Console
--------------------------- */

console.log("Details Page Loaded Successfully");


