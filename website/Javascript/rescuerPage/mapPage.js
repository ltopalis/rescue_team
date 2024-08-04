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
const activeSwitch = document.getElementById("active-checkbox");
activeSwitch.checked = false;
let lines = [];

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
                user.load = data.load;
                user.currentTasks = data.currentTasks;

                tasks = data.tasks;

                markers.warehouse = L.marker([data.warehouse.lat, data.warehouse.lng], { draggable: false, icon: new warehouseIcon() }).addTo(map);
                markers.myPos = L.marker([data.myPos.lat, data.myPos.lng], { draggable: true, icon: new rescuerIcon() }).addTo(map);

                markers.warehouse.bindPopup("Βάση");
                let popupMsg = user.name + "</br>";
                for (let l of user.load)
                    popupMsg += `x${l.amount} ${l.name}</br>`
                markers.myPos.bindPopup(popupMsg);

                for (let task of user.currentTasks) {
                    let newMarker = L.marker([task.location.lat, task.location.lng], {
                        draggable: false, icon: new citizenIcon({
                            iconUrl: (task.type == "Προσφορά" ? "../../icons/people-blue.png" : "../../icons/people-red.png")
                        })
                    }).addTo(map);

                    let popupMsg = `
                    Όνομα:      ${task.name}<br>
                    Τηλέφωνο:   ${task.username}<br>

                    Προϊόν:     `;
                    for (let pr of task.products)
                        popupMsg += `x${pr.amount} ${pr.name}, `;
                    popupMsg += `</br>Αναλήφθηκε: ${task.acceptDate}`;

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
                    Προϊόν:     `;
                    for (let pr of task.products)
                        popupMsg += `x${pr.amount} ${pr.name}, `;
                    popupMsg += `</br><a class='btn btn-warning' id='getTaskButtonFor_${task.id}' onclick='getTaskButtonClicked(${task.id})'>Ανάληψη</a>`;

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
                    }).then(response => {
                        if (response.status == 200) {
                            user.position.lat = e.target.getLatLng().lat;
                            user.position.lng = e.target.getLatLng().lng;
                        }
                    });

                    if (markers.myPos.getLatLng().distanceTo(markers.warehouse.getLatLng()) <= 100) {
                        user.load.length !== 0 ? unloadButton.classList.remove("disabled") : null;
                        loadButton.classList.remove("disabled");
                    }
                    else {
                        loadButton.classList.add("disabled");
                        unloadButton.classList.add("disabled");
                    }

                    for (let task of user.currentTasks) {

                        const index = markers.currentTasks.findIndex(marker => marker.getLatLng().lat == task.location.lat && marker.getLatLng().lng == task.location.lng);
                        const dist = markers.myPos.getLatLng().distanceTo(markers.currentTasks[index].getLatLng());

                        const btn = document.getElementById(`completeButtonTaskFor_${task.id}`);

                        if (dist > 50)
                            btn.classList.add("disabled");
                        else
                            btn.classList.remove("disabled");

                    }

                });

                updateTasksPanel();

                if (markers.myPos.getLatLng().distanceTo(markers.warehouse.getLatLng()) <= 100) {
                    user.load.length !== 0 ? unloadButton.classList.remove("disabled") : unloadButton.classList.add("disabled");;
                    loadButton.classList.remove("disabled");
                }
                else {
                    loadButton.classList.add("disabled");
                    unloadButton.classList.add("disabled");
                }

                setWarehouseProductsOnModal();

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
        taskText.innerText = `${task.date}\n${task.username}\n\nx${task.products[0].amount} ${task.products[0].name}`;

        const productsList = document.createElement("ul");
        productsList.classList.add("list-group");
        productsList.classList.add("list-group-flush");
        for (let p in task.products) {
            const productItem = document.createElement("li");
            productItem.classList.add("list-group-item");
            productItem.innerText = `x${p.amount} ${p.name}`;

            productsList.appendChild(productItem);
        }

        let completeButton = document.createElement("a");
        completeButton.classList.add("btn");
        completeButton.classList.add("btn-success");
        completeButton.classList.add("d-md-inline");

        const index = markers.currentTasks.findIndex(marker => marker.getLatLng().lat == task.location.lat && marker.getLatLng().lng == task.location.lng);
        const dist = markers.myPos.getLatLng().distanceTo(markers.currentTasks[index].getLatLng());
        if (dist > 50)
            completeButton.classList.add("disabled");
        completeButton.id = `completeButtonTaskFor_${task.id}`;
        completeButton.innerText = "Ολοκλήρωση";
        completeButton.setAttribute("onclick", `completeButtonClicked(${task.id})`);


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

        card.addEventListener("mouseenter", () => {

            const pathCoords = [[user.position.lat, user.position.lng], [task.location.lat, task.location.lng]];

            lines.push(L.polyline(pathCoords, { color: 'black' }).addTo(map));

        });

        card.addEventListener("mouseleave", () => {
            lines[0].remove();
            lines = [];
        });

        taskPanel.appendChild(card);

    }
}

async function setWarehouseProductsOnModal() {
    const tableBody = document.getElementsByTagName("tbody")[0];
    tableBody.innerText = "";

    await fetch(`http://localhost:${PORT}/rescuer/getWarehouseProducts`, {
        method: "GET",
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(response => response.json())
        .then(
            data => {

                for (let prod of data) {
                    let new_row = tableBody.insertRow();

                    let new_cell = new_row.insertCell();
                    new_cell.innerText = prod.PRODUCT_NAME;

                    new_cell = new_row.insertCell();
                    new_cell.innerText = prod.AMOUNT;

                    let amount_field = document.createElement("input");
                    amount_field.setAttribute("id", `textField_${prod.ID}`);
                    amount_field.setAttribute("type", "number");
                    amount_field.setAttribute("min", "0");
                    amount_field.setAttribute("max", prod.AMOUNT);
                    amount_field.addEventListener("change", (event) => {
                        const index = user.loadProducts.findIndex(obj => obj.id === prod.ID);
                        const newValue = parseInt(event.target.value, 10) > prod.AMOUNT ? prod.AMOUNT : parseInt(event.target.value, 10);

                        if (index !== -1)
                            newValue !== 0 ? user.loadProducts[index].amount = newValue : user.loadProducts.splice(index, 1);
                        else
                            newValue !== 0 ? user.loadProducts.push({ id: prod.ID, amount: newValue }) : null;

                    });

                    new_cell = new_row.insertCell();
                    new_cell.appendChild(amount_field);
                }
            }
        )
}

let user = {
    warehouse: { lat: 0, lng: 0 },
    position: { lat: 0, lng: 0 },
    load: [{ id: 0, name: "demo", category: "demo", amount: 0 }],
    loadProducts: [],
    currentTasks: [{ id: 1, name: "Μπάμπης", username: "6987452015", location: { lat: 38.64776165212098, lng: 23.12625890968818 }, acceptDate: "2024-07-30 15:40:34", date: "2024-07-30 15:35:34", products: [{ id: 5, name: "νερό", amount: 5 }], type: "Προσφορά" },
    { id: 2, name: "Μάκης", username: "6945128443", location: { lat: 38.24673484881786, lng: 23.400586171562672 }, acceptDate: "2024-07-30 12:48:44", date: "2024-07-30 12:38:44", products: [{ id: 3, name: "Depon", amount: 2 }], type: "Αίτηση" },
    // { id: 3, name: "Μήτσος", username: "6954214530", location: { lat: 38.54776165212098, lng: 23.02625890968818 }, acceptDate: "2024-07-30 11:03:14", date: "2024-07-30 10:53:14", products: [{ id: 2, name: "Panmigran ", amount: 8 }], type: "Προσφορά" },
    { id: 4, name: "Κατερίνα", username: "6957432019", location: { lat: 38.4169823256788, lng: 23.081978669454646 }, acceptDate: "2024-07-28 07:33:02", date: "2024-07-28 07:23:02", products: [{ id: 6, name: "Ζάχαρη", amount: 25 }], type: "Αίτηση" }
    ]
};

let tasks = [
    { id: 5, name: "Σπύρος", username: "6985213647", location: { lat: 37.77718717873785, lng: 23.931768977728874 }, date: "2024-07-30 15:35:34", products: { id: 9, name: "ψωμί", amount: 3 }, type: "Προσφορά" },
    { id: 6, name: "Σωτήρης", username: "6921478305", location: { lat: 38.77718715873785, lng: 23.951568977728874 }, date: "2024-07-30 15:35:34", products: { id: 10, name: "γάζες", amount: 6 }, type: "Αίτηση" },
    { id: 7, name: "Πάρης", username: "6985223471", location: { lat: 36.77708713873785, lng: 23.891548977728874 }, date: "2024-07-30 15:35:34", products: { id: 8, name: "σιρόπι για τον βήχα", amount: 2 }, type: "Προσφορά" },
    { id: 8, name: "Άκης", username: "6901230587", location: { lat: 37.77774515873785, lng: 23.501486977728874 }, date: "2024-07-30 15:35:34", products: { id: 4, name: "πάνες", amount: 1 }, type: "Προσφορά" },
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

async function getTaskButtonClicked(id) {

    if (user.currentTasks.length < 4) {

        fetch(`http://localhost:${PORT}/rescuer/getTask`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ taskId: id })
        }).then((response) => {
            if (response.status == 200) {
                for (let m of markers.currentTasks)
                    map.removeLayer(m);

                for (let m of markers.tasks)
                    map.removeLayer(m);

                map.removeLayer(markers.myPos);
                map.removeLayer(markers.warehouse);

                init();
            }
        })

    } else {
        alert("Δεν μπορείτε να αναλάβετε περισσότερα από 4 tasks ταυτόχρονα");
    }
}

function cancelTaskButtonClicked(id) {

    fetch(`http://localhost:${PORT}/rescuer/cancelTask`, {
        method: "POST",
        body: JSON.stringify({ taskId: id }),
        headers: {
            'Content-Type': 'application/json'
        },
    }).then((response) => {
        if (response.status == 200) {
            for (let m of markers.currentTasks)
                map.removeLayer(m);

            for (let m of markers.tasks)
                map.removeLayer(m);

            map.removeLayer(markers.myPos);
            map.removeLayer(markers.warehouse);

            markers.currentTasks = [];
            markers.tasks = [];

            lines[0].remove();
            lines = [];

            for (let m of markers.currentTasks)
                map.removeLayer(m);

            for (let m of markers.tasks)
                map.removeLayer(m);

            map.removeLayer(markers.myPos);
            map.removeLayer(markers.warehouse);

            init();
        }
    })
}

unloadButton.addEventListener("click", async () => {

    if (user.load.length !== 0) {
        await fetch(`http://localhost:${PORT}/rescuer/unload`, {
            body: JSON.stringify(user.load),
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            }
        });

        for (let m of markers.currentTasks)
            map.removeLayer(m);

        for (let m of markers.tasks)
            map.removeLayer(m);

        map.removeLayer(markers.myPos);
        map.removeLayer(markers.warehouse);

        init();

        alert("Επιτυχής εκφόρτωση προϊόντων");
    }

})

async function loadToVan() {

    await fetch(`http://localhost:${PORT}/rescuer/loadProductsToVan`, {
        method: "POST",
        body: JSON.stringify(user.loadProducts),
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(response => response.status == 200 ? user.loadProducts = [] : null);

    for (let m of markers.currentTasks)
        map.removeLayer(m);

    for (let m of markers.tasks)
        map.removeLayer(m);

    map.removeLayer(markers.myPos);
    map.removeLayer(markers.warehouse);

    init();
}

function cancelLoading() {

    for (let m of markers.currentTasks)
        map.removeLayer(m);

    for (let m of markers.tasks)
        map.removeLayer(m);

    map.removeLayer(markers.myPos);
    map.removeLayer(markers.warehouse);

    init();
    user.loadProducts = [];
}

function completeButtonClicked(id) {
    const tastIndex = user.currentTasks.findIndex(t => t.id == id);
    const task = user.currentTasks[tastIndex];

    console.log(task)

    const isSubset = (a, b) => {
        return a.every(aItem => {
            const bItem = b.find(bItem => bItem.id === aItem.id);
            return bItem && bItem.amount >= aItem.amount;
        });
    };

    if (task.type == 'Προσφορά' ? true : isSubset(task.products, user.load)) {

        fetch(`http://localhost:${PORT}/rescuer/completeTask`, {
            method: "POST",
            body: JSON.stringify({ taskId: id }),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then((response) => {
            if (response.status == 200) {

                for (let m of markers.currentTasks)
                    map.removeLayer(m);

                for (let m of markers.tasks)
                    map.removeLayer(m);

                map.removeLayer(markers.myPos);
                map.removeLayer(markers.warehouse);

                markers.currentTasks = [];
                markers.tasks = [];

                lines[0].remove();
                lines = [];

                for (let m of markers.currentTasks)
                    map.removeLayer(m);

                for (let m of markers.tasks)
                    map.removeLayer(m);

                map.removeLayer(markers.myPos);
                map.removeLayer(markers.warehouse);

                init();

            }
        })

    }
    else
        alert("Not enough products")

}

activeSwitch.addEventListener("click", async () => {
    fetch(`http://localhost:${PORT}/rescuer/setActivity`, {
        method: 'POST',
        body: JSON.stringify({ active: activeSwitch.checked }),
        headers: {
            'Content-Type': 'application/json'
        }
    });
});