"use strict"

// custom icons
const base = L.icon({
    iconUrl: "icons/home.png",
    iconSize: [53,53],
    popupAnchor: [1, -20]
});

const van = L.icon({
    iconUrl: "http://localhost/Project/icons/delivery-van.png",
    iconSize: [30,30],
    popupAnchor: [-2, -9]
});

const person = L.icon({
    iconUrl: "http://localhost/Project/icons/people.png",
    iconSize: [35,35],
    popupAnchor: [1, -20]
});

const user = JSON.parse(localStorage.getItem("user")) || { };
if(user.role === null || user.role === undefined)
    window.location.replace('http://localhost/Project/');

let map = L.map('map');

let markers = [];

map.setView([38.0, 23.85], 10);

//tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',).addTo(map);

// create markers

// TODO: Create Class

markers[0] = L.marker(
    [user.warehouse_location.lat, user.warehouse_location.lng], {
    draggable: false,
    icon: base
});
markers[1] = L.marker(
    [38, 23.8], {
    draggable: true,
    icon: van
}
);

markers[2] = L.marker(
    [user.location.lat, user.location.lng], {
    draggable: false,
    icon: person
}
);

for (let marker of markers) {
    marker.on('dragend', function (e) {
    let pos = marker.getLatLng();
    console.log(`${marker.getPopup().getContent()} ${pos.lat} ${pos.lng}`);
    });

    marker.addTo(map);
}

markers[1].bindPopup('ΦΟΡΤΗΓΟ 1');
markers[2].bindPopup(user.name);
markers[0].bindPopup('ΒΑΣΗ');
