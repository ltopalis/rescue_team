"use strict"

pageAccess("ADMIN");

const warehouseIcon = L.Icon.extend({
    options: {
        iconUrl: "../../icons/home.png",
        iconSize: [40, 40],
        popupAnchor: [1, -20]
    }
});

const citizenIcon = L.Icon.extend({
    options: {
        iconUrl: "../../icons/people.png",
        iconSize: [35, 35],
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

const map = L.map('map');
map.setView([38.0, 23.85], 11);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let data = {
    warehouse: { lat: 37.97586815961329, lng: 23.735404014587406 },
    tasks: [
        { id: 5, name: "testName", username: '999999999', type: "offer", location: { lat: 37.96287460104888, lng: 23.73939517167203 }, products: [{ id: 5, name: "eggs", amount: 3 }, { id: 3, name: 'apples', amount: 9 }] },
        { id: 1, name: "testName", username: '999999999', type: "request", takenDate: '2024-06-27 15:36:52', location: { lat: 39.96287460104888, lng: 26.73939517167203 }, products: [{ id: 5, name: "eggs", amount: 3 }, { id: 3, name: 'apples', amount: 9 }] },
        { id: 6, name: "testName", username: '999999999', type: "offer", takenDate: '2024-06-27 15:36:52', location: { lat: 41.96287460104888, lng: 35 }, products: [{ id: 5, name: "eggs", amount: 3 }, { id: 3, name: 'apples', amount: 9 }] },
    ],
    rescuers: [
        { name: 'rescuer1', username: '888888888', active: false, location: { lat: 37.93164766971562, lng: 23.787440201552055 }, products: [{ id: 5, name: "eggs", amount: 3 }, { id: 3, name: 'apples', amount: 9 }], tasks: [1, 6], _lines: [] }
    ]
};

let markers = {
    warehouse: null,
    tasks: [],
    rescuers: []
};


async function init() {
    await fetch(`http://localhost:${PORT}/admin/initMap`, {
        method: "GET",
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(response => response.json())
        .then(
            res => {
                data.warehouse = res.warehouse;
                data.rescuers = res.rescuers;
                data.tasks = res.tasks;

                addMarkersToMap();
            }
        );
}

function addMarkersToMap() {

    // warehouse

    markers.warehouse = L.marker([data.warehouse.lat, data.warehouse.lng], { draggable: true, icon: new warehouseIcon() }).addTo(map);
    markers.warehouse.on('dragend', async (e) => {
        if (confirm('Είστε σίγουρος ότι θέλετε να αλλάξετε την θέση της βάσης;')) {
            fetch(`http://localhost:${PORT}/admin/updateWarehousePosition`, {
                method: "POST",
                body: JSON.stringify(markers.warehouse.getLatLng()),
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(response => {
                if (response.status == 200)
                    data.warehouse = markers.warehouse.getLatLng();

                map.removeLayer(markers.warehouse);
                updateMap();
            });

        } else {

            updateMap();
        }

    });

    // rescuer
    let takenTasks = [];
    if (onlineCheckbox.checked) {
        for (let rescuer of data.rescuers) {
            if (rescuer.active) {
                const rescuerMarker = L.marker([rescuer.location.lat, rescuer.location.lng], { draggable: false, icon: new rescuerIcon() }).addTo(map);

                takenTasks = [...takenTasks, ...rescuer.tasks];

                rescuerMarker.on('mouseover', () => {

                    if (takenCheckbox.checked) {

                        const pathCoords = [];

                        if (offerCheckbox.checked) {
                            for (let task of rescuer.tasks) {
                                const index = data.tasks.findIndex(in_task => in_task.id == task);

                                const taskData = data.tasks[index];

                                if (taskData == null) continue;
                                if (taskData.type !== 'offer') continue;

                                pathCoords.push([rescuer.location.lat, rescuer.location.lng], [taskData.location.lat, taskData.location.lng]);

                            }
                        }

                        if (requestCheckbox.checked) {
                            for (let task of rescuer.tasks) {
                                const index = data.tasks.findIndex(in_task => in_task.id == task);

                                const taskData = data.tasks[index];

                                if (taskData == null) continue;
                                if (taskData.type !== 'request') continue;

                                pathCoords.push([rescuer.location.lat, rescuer.location.lng], [taskData.location.lat, taskData.location.lng]);

                            }
                        }

                        rescuer._lines.push(L.polyline(pathCoords, { color: 'black' }).addTo(map));
                    }
                });

                rescuerMarker.on('mouseout', () => {
                    for (let line of rescuer._lines)
                        line.remove();
                    rescuer._lines = [];
                });

                let popupMsg = `${rescuer.name}</br>${rescuer.active ? 'ενεργός' : 'ανενεργός'}`;

                for (let prod of rescuer.products)
                    popupMsg += `</br>x${prod.amount} ${prod.name}`;

                rescuerMarker.bindPopup(popupMsg);

                markers.rescuers.push(rescuerMarker);
            }
        }

    }

    if (offlineCheckbox.checked) {
        for (let rescuer of data.rescuers) {
            if (!rescuer.active) {
                const rescuerMarker = L.marker([rescuer.location.lat, rescuer.location.lng], { draggable: false, icon: new rescuerIcon() }).addTo(map);

                takenTasks = [...takenTasks, ...rescuer.tasks];

                rescuerMarker.on('mouseover', () => {

                    if (takenCheckbox.checked) {

                        const pathCoords = [];

                        if (offerCheckbox.checked) {
                            for (let task of rescuer.tasks) {
                                const index = data.tasks.findIndex(in_task => in_task.id == task);

                                const taskData = data.tasks[index];

                                if (taskData == null) continue;
                                if (taskData.type !== 'offer') continue;

                                takenTasks.push(task);

                                pathCoords.push([rescuer.location.lat, rescuer.location.lng], [taskData.location.lat, taskData.location.lng]);

                            }
                        }

                        if (requestCheckbox.checked) {
                            for (let task of rescuer.tasks) {
                                const index = data.tasks.findIndex(in_task => in_task.id == task);

                                const taskData = data.tasks[index];

                                if (taskData == null) continue;
                                if (taskData.type !== 'request') continue;

                                takenTasks.push(task);

                                pathCoords.push([rescuer.location.lat, rescuer.location.lng], [taskData.location.lat, taskData.location.lng]);
                            }
                        }

                        rescuer._lines.push(L.polyline(pathCoords, { color: 'black' }).addTo(map));
                    }
                });

                rescuerMarker.on('mouseout', () => {
                    for (let line of rescuer._lines)
                        line.remove();
                    rescuer._lines = [];
                });

                let popupMsg = `${rescuer.name}</br>${rescuer.active ? 'ενεργός' : 'ανενεργός'}`;

                for (let prod of rescuer.products)
                    popupMsg += `</br>x${prod.amount} ${prod.name}`;

                rescuerMarker.bindPopup(popupMsg);

                markers.rescuers.push(rescuerMarker);
            }
        }

    }

    // tasks

    for (let task of data.tasks) {

        if (!offerCheckbox.checked && task.type == 'offer') continue;
        if (!requestCheckbox.checked && task.type == 'request') continue;
        if (!takenCheckbox.checked && takenTasks.includes(task.id)) continue;
        if (!freeCheckbox.checked && !takenTasks.includes(task.id)) continue;


        const taskMarker = L.marker([task.location.lat, task.location.lng], { draggable: false, icon: new citizenIcon((task.type === 'offer' ? { iconUrl: '../../icons/people-red.png' } : null)) }).addTo(map);

        let popupMsg = `${task.name}</br>${task.username}${task.takenDate == undefined ? '' : '</br>' + task.takenDate}`;


        const findNameByTaskId = (taskId) => {
            for (let rescuer of data.rescuers) {
                if (rescuer.tasks.includes(taskId)) {
                    return rescuer.name;
                }
            }
            return null;
        };

        if (findNameByTaskId(task.id) != null)
            popupMsg += `</br>${findNameByTaskId(task.id)}`;

        for (let prod of task.products)
            popupMsg += `</br>x${prod.amount} ${prod.name}`;

        taskMarker.bindPopup(popupMsg);

        markers.tasks.push(taskMarker);

    }

}

function updateMap() {
    map.removeLayer(markers.warehouse);

    for (let marker of markers.rescuers)
        map.removeLayer(marker);

    for (let marker of markers.tasks)
        map.removeLayer(marker);

    markers.rescuers = [];
    markers.tasks = [];

    addMarkersToMap();
}


init();

const offerCheckbox = document.getElementById('offer-checkbox');
const requestCheckbox = document.getElementById('request-checkbox');
const takenCheckbox = document.getElementById('taken-checkbox');
const freeCheckbox = document.getElementById('free-checkbox');
const onlineCheckbox = document.getElementById('online-checkbox');
const offlineCheckbox = document.getElementById('offline-checkbox');


offerCheckbox.addEventListener('click', () => updateMap());
offlineCheckbox.addEventListener('click', () => updateMap());
onlineCheckbox.addEventListener('click', () => updateMap());
freeCheckbox.addEventListener('click', () => updateMap());
takenCheckbox.addEventListener('click', () => updateMap());
requestCheckbox.addEventListener('click', () => updateMap());

