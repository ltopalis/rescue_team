/*"use strict"

// custom icons
const base = L.icon({
    iconUrl: "http://localhost/icons/home.png",
    iconSize: [53, 53],
    popupAnchor: [1, -20]
});

const van = L.icon({
    iconUrl: "../icons/delivery-van.png",
    iconSize: [30, 30],
    popupAnchor: [-2, -9]
});

const person = L.icon({
    iconUrl: "../icons/people.png",
    iconSize: [35, 35],
    popupAnchor: [1, -20]
});

const user = JSON.parse(localStorage.getItem("user")) || {};
if (user.role === null || user.role === undefined)
    window.location.replace('../index.html');

let map = L.map('map');

let markers = [];

map.setView([38.0, 23.85], 10);

//tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',).addTo(map);

// create markers

// TODO: Create Class
class Marker {
    constructor(in_lat, in_lng, name, drag) {

        this.latitude = {
            _lat: in_lat,
            get lat() {
                return this._lat;
            },
            set lat(newValue) {
                this._lat = newValue;
                this.onChange(this._lat);
            },
        };

        this.longtitude = {
            _lng: in_lng,
            get lng() {
                return this._lng;
            },
            set lng(newValue) {
                this._lng = newValue;
                this.onChange(this._lng);
            },
        };

        this.name = name;
        this.marker = L.marker(
            [this.latitude._lat, this.longtitude._lng], {
            draggable: drag
        });
        this.marker.addTo(map);
        this.marker.bindPopup(this.name);
    }

    onChange(newValue) {
        console.log(newValue);
    }
}

class Warehouse extends Marker {
    constructor(lat, lng, drag) {
        super(lat, lng, 'ΒΑΣΗ', drag);

        this.marker.on('dragend', (e) => {
            let pos = this.marker.getLatLng();

            if (confirm("Είστε σίγουροι ότι θέλετε να αλλάξει η θέση της βάσης") == true) {
                this.latitude = pos.lat;
                this.longtitude = pos.lng;
            }

        });
    }

}

class Rescuer extends Marker {
    constructor(lat, lng, rescuer_name, drag) {
        super(lat, lng, rescuer_name, drag);

        // Attach dragend event handler to the marker
        this.marker.on('dragend', () => {
            this.latitude = this.marker.getLatLng().lat;
            this.longtitude = this.marker.getLatLng().lng;

            this.calculateDistances();
        });
    }

    // Calculate distances to all Warehouse markers
    calculateDistances() {
        // Get the current position of the dragged Rescuer marker
        const currentLatLng = this.marker.getLatLng();

        this.latitude = currentLatLng.lat;
        this.longtitude = currentLatLng.lng;

        // Iterate through all markers
        for (let i = 0; i < markers.length; i++) {
            if (markers[i] instanceof Warehouse) {
                // Get the position of the Warehouse marker
                const warehouseLatLng = markers[i].marker.getLatLng();

                // Calculate distance in meters
                const distance = currentLatLng.distanceTo(warehouseLatLng);

                // Output the distance
                console.log(`Distance to Warehouse ${i}: ${distance.toFixed(2)} meters`);
            }
        }
    }
}

class Citizen extends Marker {
    constructor(lat, lng, citizen_name, drag) {
        super(lat, lng, citizen_name, drag);
    }

}

// Base
markers[0] = new Warehouse(user.warehouse_location.lat, user.warehouse_location.lng, true);

// rescuer
markers[1] = new Rescuer(user.location.lat, user.location.lng, user.name, true);

// citizen
markers[2] = new Citizen(12.5, 13, "citizen", true);

// markers[2] = L.marker(
//     [user.location.lat, user.location.lng], {
//     draggable: false,
//     // icon: person
// }
// );

// for (let marker of markers) {
//     marker.on('dragend', function (e) {
//     let pos = marker.getLatLng();
//     console.log(`${marker.getPopup().getContent()} ${pos.lat} ${pos.lng}`);
//     });

//     marker.addTo(map);
// }

// markers[1].bindPopup(user.name);
// // markers[2].bindPopup(user.name);
// markers[0].bindPopup('ΒΑΣΗ');
*/

"use strict"

// custom icons
const base = L.icon({
    iconUrl: "http://localhost/icons/home.png",
    iconSize: [53, 53],
    popupAnchor: [1, -20]
});

const van = L.icon({
    iconUrl: "../icons/delivery-van.png",
    iconSize: [30, 30],
    popupAnchor: [-2, -9]
});

const person = L.icon({
    iconUrl: "../icons/people.png",
    iconSize: [35, 35],
    popupAnchor: [1, -20]
});

const user = JSON.parse(localStorage.getItem("user")) || {};
if (user.role === null || user.role === undefined)
    window.location.replace('../index.html');

let map = L.map('map');

let markers = [];

map.setView([38.0, 23.85], 10);

// tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// create markers

class Marker {
    constructor(in_lat, in_lng, name, drag) {
        this.marker = L.marker(
            [in_lat, in_lng], {
            draggable: drag
        }
        );
        this.marker.addTo(map);
        this.marker.bindPopup(name);

        // Bind the dragend event
        this.marker.on('dragend', (e) => {
            this.marker.getLatLng().lat = e.target.getLatLng().lat;
            this.marker.getLatLng().lng = e.target.getLatLng().lng;
            this.onChange();
        });
    }

    onChange() {
        console.log(`Marker moved to: Lat ${this.marker.getLatLng()}, Lng ${this.marker.getLatLng().lng}`);
    }

}

class Warehouse extends Marker {
    constructor(lat, lng, drag) {
        super(lat, lng, 'ΒΑΣΗ', drag);
    }

    onChange() {
        if (confirm("Είστε σίγουροι ότι θέλετε να αλλάξει η θέση της βάσης")) {
            console.log(`Warehouse moved to: Lat ${0}, Lng ${5}`);
        }
    }
}

function updatePosition(user, marker) {
    let dataToBeSent = [];

    dataToBeSent.push({'id': user.id, 'lng': marker.getLatLng().lng, 'lat':marker.getLatLng().lat});


    const jsonData = JSON.stringify(dataToBeSent);
    console.log(dataToBeSent);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "../PHP/rescuer/update_position.php", true);
    xhr.setRequestHeader('Content-type', 'application/json');
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {

            if (xhr.responseText !== "Success") {
                alert("Προέκυψε πρόβλημα. Ξαναπροσπαθήστε!");
                console.error(xhr.responseText);
            }
        }
    };

    xhr.send(jsonData);
}

class Rescuer extends Marker {
    constructor(lat, lng, rescuer_name, drag) {
        super(lat, lng, rescuer_name, drag);
    }

    calculateDistances() {
        const currentLatLng = L.latLng(this.marker.getLatLng().lat, this.marker.getLatLng().lng);

        // Iterate through all markers
        for (let i = 0; i < markers.length; i++) {
            if (markers[i] instanceof Warehouse) {
                const warehouseLatLng = L.latLng(markers[i].marker.getLatLng().lat, markers[i].marker.getLatLng().lng);
                const distance = currentLatLng.distanceTo(warehouseLatLng);

                
            }
        }
    }

    onChange() {
        updatePosition(user, this.marker);
        this.calculateDistances();
    }
}

class Citizen extends Marker {
    constructor(lat, lng, citizen_name, drag) {
        super(lat, lng, citizen_name, drag);
    }
}

// Create instances
markers[0] = new Warehouse(user.warehouse_location.lat, user.warehouse_location.lng, true);
markers[1] = new Rescuer(user.location.lat, user.location.lng, user.name, true);
markers[2] = new Citizen(12.5, 13, "citizen", true);
