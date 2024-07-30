"use strict"

pageAccess("RESCUER");

const warehouseIcon = L.Icon.extend({
    options: {
        iconUrl: "../../icons/home.png",
        iconSize: [40, 40],
        popupAnchor: [1, -20]
    }
});

const rescuerIcon = L.Icon.extend({
    options: {
        iconUrl: "../../icons/delivery-van.png",
        iconSize: [30, 30],
        popupAnchor: [-2, -9]
    }
});

const citizenIcon = L.Icon.extend({
    options: {
        iconUrl: "../../icons/people.png",
        iconSize: [35, 35],
        popupAnchor: [1, -20]
    }
});

const loadButton = document.getElementById("load");
const unloadButton = document.getElementById("unload");

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

                markers.warehouse = L.marker([data.warehouse.lat, data.warehouse.lng], { draggable: false, icon: new warehouseIcon() }).addTo(map);
                markers.myPos = L.marker([data.myPos.lat, data.myPos.lng], { draggable: true, icon: new rescuerIcon() }).addTo(map);

                markers.warehouse.bindPopup("Βάση");
                markers.myPos.bindPopup(user.name);

                for (let task of user.currentTasks) {
                    let newMarker = L.marker([task.location.lat, task.location.lng], {
                        draggable: false, icon: new citizenIcon({
                            iconUrl: (task.type == "Προσφορά" ? "../../icons/people-blue.png" : "../../icons/people-red.png")
                        })
                    }).addTo(map);

                    let popupMsg = `
                    Όνομα:      ${task.name}<br>
                    Τηλέφωνο:   ${task.username}<br> 
                    Προϊόν:     x${task.products.amount} ${task.products.name}<br>
                    Αναλήφθηκε: ${task.acceptDate}`;

                    newMarker.bindPopup(popupMsg);

                    markers.currentTasks.push(newMarker);
                }

                for (let task of tasks) {
                    let newMarker = L.marker([task.location.lat, task.location.lng], {
                        draggable: false, icon: new citizenIcon({
                            iconUrl: (task.type == "Προσφορά" ? "../../icons/people.png" : "../../icons/people-red.png")
                        })
                    }).addTo(map);

                    let popupMsg = `
                    Όνομα:      ${task.name}<br>
                    Τηλέφωνο:   ${task.username}<br> 
                    Προϊόν:     x${task.products.amount} ${task.products.name}<br>
                    <a class='btn btn-warning' id='getTaskButtonFor_${task.id}' onclick='getTaskButtonClicked(${task.id})'>Ανάληψη</a>`;

                    newMarker.bindPopup(popupMsg);

                    markers.tasks.push(newMarker);
                }

                markers.myPos.on('dragend', async (e) => {
                    markers.myPos.getLatLng().lat = e.target.getLatLng().lat;
                    markers.myPos.getLatLng().lng = e.target.getLatLng().lng;

                    const response = await fetch(`http://localhost:${PORT}/updatePosition`, {
                        method: "POST",
                        body: JSON.stringify({ position: markers.myPos.getLatLng() }),
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });

                    if (markers.myPos.getLatLng().distanceTo(markers.warehouse.getLatLng()) <= 100) {
                        loadButton.classList.remove("disabled");
                        unloadButton.classList.remove("disabled");
                    }
                    else {
                        loadButton.classList.add("disabled");
                        unloadButton.classList.add("disabled");
                    }
                });

                updateTasksPanel();

                if (markers.myPos.getLatLng().distanceTo(markers.warehouse.getLatLng()) <= 100) {
                    loadButton.classList.remove("disabled");
                    unloadButton.classList.remove("disabled");
                }
                else {
                    loadButton.classList.add("disabled");
                    unloadButton.classList.add("disabled");
                }

            }
        )
}

function updateTasksPanel() {

    const taskPanel = document.getElementById("tasksPanel");

    taskPanel.innerHTML = "";

    for (let task of user.currentTasks) {
        let taskTitle = document.createElement("h5");
        taskTitle.classList.add("card-title");
        taskTitle.innerText = task.name;

        let taskSubtitle = document.createElement("h6");
        taskSubtitle.classList.add("card-subtitle");
        taskSubtitle.classList.add("mb-2");
        taskSubtitle.classList.add("text-muted");
        taskSubtitle.innerText = task.type;

        let taskText = document.createElement("p");
        taskText.classList.add("card-text");
        taskText.innerText = `${task.date}\n${task.username}\n\nx${task.products.amount} ${task.products.name}`

        let completeButton = document.createElement("a");
        completeButton.classList.add("btn");
        completeButton.classList.add("btn-success");
        completeButton.classList.add("d-md-inline");
        completeButton.id = `completeButtonTaskFor_${task.id}`;
        completeButton.innerText = "Ολοκλήρωση";


        let rejectButton = document.createElement("a");
        rejectButton.classList.add("btn");
        rejectButton.classList.add("btn-danger");
        rejectButton.classList.add("d-md-inline");
        rejectButton.id = `rejectButtonTaskFor_${task.id}`;
        rejectButton.setAttribute("onclick", `cancelTaskButtonClicked(${task.id})`);
        rejectButton.innerText = "Ακύρωση";


        let cardBody = document.createElement("div");
        cardBody.classList.add("card-body");
        cardBody.appendChild(taskTitle);
        cardBody.appendChild(taskSubtitle);
        cardBody.appendChild(taskText);
        cardBody.appendChild(completeButton);
        cardBody.appendChild(rejectButton);

        let card = document.createElement("div");
        card.classList.add("card");
        card.appendChild(cardBody);
        card.id = `cardTaskFor_${task.id}`;

        taskPanel.appendChild(card);

    }
}

let user = {
    warehouse: {},
    position: {},
    currentTasks: [{ id: 1, name: "Μπάμπης", username: "6987452015", location: { lat: 38.64776165212098, lng: 23.12625890968818 }, acceptDate: "2024-07-30 15:40:34", date: "2024-07-30 15:35:34", products: { name: "νερό", amount: 5 }, type: "Προσφορά" },
    { id: 2, name: "Μάκης", username: "6945128443", location: { lat: 38.24673484881786, lng: 23.400586171562672 }, acceptDate: "2024-07-30 12:48:44", date: "2024-07-30 12:38:44", products: { name: "Depon", amount: 2 }, type: "Αίτηση" },
    // { id: 3, name: "Μήτσος", username: "6954214530", location: { lat: 38.54776165212098, lng: 23.02625890968818 }, acceptDate: "2024-07-30 11:03:14", date: "2024-07-30 10:53:14", products: { name: "Panmigran ", amount: 8 }, type: "Προσφορά" },
    { id: 4, name: "Κατερίνα", username: "6957432019", location: { lat: 38.4169823256788, lng: 23.081978669454646 }, acceptDate: "2024-07-28 07:33:02", date: "2024-07-28 07:23:02", products: { name: "Ζάχαρη", amount: 25 }, type: "Αίτηση" }
    ]
};

let tasks = [
    { id: 5, name: "Σπύρος", username: "6985213647", location: { lat: 37.77718717873785, lng: 23.931768977728874 }, date: "2024-07-30 15:35:34", products: { name: "ψωμί", amount: 3 }, type: "Προσφορά" },
    { id: 6, name: "Σωτήρης", username: "6921478305", location: { lat: 38.77718715873785, lng: 23.951568977728874 }, date: "2024-07-30 15:35:34", products: { name: "γάζες", amount: 6 }, type: "Αίτηση" },
    { id: 7, name: "Πάρης", username: "6985223471", location: { lat: 36.77708713873785, lng: 23.891548977728874 }, date: "2024-07-30 15:35:34", products: { name: "σιρόπι για τον βήχα", amount: 2 }, type: "Προσφορά" },
    { id: 8, name: "Άκης", username: "6901230587", location: { lat: 37.77774515873785, lng: 23.501486977728874 }, date: "2024-07-30 15:35:34", products: { name: "πάνες", amount: 1 }, type: "Προσφορά" },
]

let markers = {
    warehouse: null,
    myPos: null,
    currentTasks: [],
    tasks: []
};

const map = L.map('map');
map.setView([38.0, 23.85], 8);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

init();

function getTaskButtonClicked(id) {
    if (user.currentTasks.length < 4) {

        const index = tasks.findIndex(element => element.id === id);

        if (index !== -1) {
            const [elem] = tasks.splice(index, 1);

            user.currentTasks.push(elem);

            for (let m of markers.currentTasks)
                map.removeLayer(m);

            for (let m of markers.tasks)
                map.removeLayer(m);

            map.removeLayer(markers.myPos);
            map.removeLayer(markers.warehouse);

            markers.currentTasks = [];
            markers.tasks = [];

            init();
        }

    } else {
        alert("Δεν μπορείτε να αναλάβετε περισσότερα από 4 tasks ταυτόχρονα");
    }
}

function cancelTaskButtonClicked(id) {
    // TODO: Update the DB

    const index = user.currentTasks.findIndex(element => element.id === id);

    if (index !== -1) {
        const [elem] = user.currentTasks.splice(index, 1);

        tasks.push(elem);

        for (let m of markers.currentTasks)
            map.removeLayer(m);

        for (let m of markers.tasks)
            map.removeLayer(m);

        map.removeLayer(markers.myPos);
        map.removeLayer(markers.warehouse);

        markers.currentTasks = [];
        markers.tasks = [];

        init();
    }
}