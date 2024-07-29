"use strict"

pageAccess("RESCUER");

// function init() {
//     getWarehouse();
//     getMyPosition();
// }


// async function getWarehouse() {

//     const response = await fetch(`http://localhost:${PORT}/getWarehouseLocation`, {
//         method: "GET"
//     }).then(response => response.json())
//         .then(
//             data => {
//                 user.warehouse.position = { lat: data.LATITUDE, lng: data.LONGTITUDE }
//                 markers.warehouse = L.marker([user.warehouse.position.lat, user.warehouse.position.lng]).addTo(map);
//                 markers.warehouse.bindPopup("ΒΑΣΗ");
//             }
//         );
// }

// async function getMyPosition() {
//     const response = await fetch(`http://localhost:${PORT}/getMyPosition`, {
//         "method": "GET"
//     }).then(response => response.json())
//         .then(
//             data => {
//                 user.position = { lat: data.lat, lng: data.lng };
//                 markers.myPos = L.marker([user.position.lat, user.position.lng]).addTo(map);
//                 markers.myPos
//             }
//         );
// }

async function init() {
    const response = await fetch(`http://localhost:${PORT}/rescuer/init`, {
        method: "GET"
    }).then(response => response.json())
        .then(
            data => {
                user.warehouse = data.warehouse;
                user.position = data.myPos;
                user.name = data.name;
                user.username = data.username;

                markers.warehouse = L.marker([data.warehouse.lat, data.warehouse.lng], { draggable: false }).addTo(map);
                markers.myPos = L.marker([data.myPos.lat, data.myPos.lng], { draggable: true }).addTo(map);

                markers.warehouse.bindPopup("Βάση");
                markers.myPos.bindPopup(user.name);

                markers.myPos.on('dragend', async (e) => {
                    markers.myPos.getLatLng().lat = e.target.getLatLng().lat;
                    markers.myPos.getLatLng().lng = e.target.getLatLng().lng;

                    const response = await fetch(`http://localhost:${PORT}/updatePosition`, {
                        method: "POST",
                        body: JSON.stringify({ position: markers.myPos.getLatLng() }),
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })
                });
            }
        )
}

let user = {
    warehouse: {},
    position: {}
};

let markers = {
    warehouse: null,
    myPos: null
};

const map = L.map('map');
map.setView([38.0, 23.85], 10);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

init();