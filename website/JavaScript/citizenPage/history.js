"use strict"

pageAccess("CITIZEN");

let offers = [];

fetch(`http://localhost:${PORT}/citizen/getOffersRequests`, {
    method: "GET",
    headers: {
        'Content-type': 'application/json'
    }
}).then(response => response.json())
    .then(data => {
        offers = data;
        updateTable();
    });

function updateTable() {
    const tableBody = document.getElementById("table-of-requests-offers").getElementsByTagName('tbody')[0];

    tableBody.innerHTML = '';

    for (let elem of offers) {
        let new_row = tableBody.insertRow();

        let num_of_products = elem.products.length;

        let new_cell = new_row.insertCell();
        new_cell.rowSpan = num_of_products;

        if (elem.type === 'request') {

            const cancelButtonIcon = document.createElement("i");
            cancelButtonIcon.classList.add("fa-solid");
            cancelButtonIcon.classList.add("fa-xmark");

            const cancelButton = document.createElement("button");
            if (elem.status === 'created') {
                cancelButton.setAttribute("data-bs-toggle", "tooltip");
                cancelButton.setAttribute("data-bs-placement", "top");
                cancelButton.setAttribute("title", "Ακύρωση");
            }
            if (elem.status !== 'created') cancelButton.setAttribute("disabled", "");
            cancelButton.addEventListener("click", async () => await cancelTask(elem.id));
            cancelButton.classList.add("cancelButton");
            cancelButton.appendChild(cancelButtonIcon);
            new_cell.appendChild(cancelButton);
        }

        new_cell = new_row.insertCell();
        new_cell.appendChild(document.createTextNode(elem.createdOn));
        new_cell.rowSpan = num_of_products;

        new_cell = new_row.insertCell();
        new_cell.appendChild(document.createTextNode(elem.type === 'offer' ? 'Προσφορά' : 'Αίτηση'));
        new_cell.rowSpan = num_of_products;

        new_cell = new_row.insertCell();
        new_cell.classList.add(elem.status)
        let state;
        switch (elem.status) {
            case "created":
                state = 'Υποβλήθηκε';
                break;
            case "inTransition":
                state = 'Σε μεταφορά';
                break;
            case 'canceled':
                state = 'Ακυρωμένη';
                break;
            case 'completed':
                state = 'Ολοκληρωμένη';
                break;
        }
        new_cell.appendChild(document.createTextNode(state));
        new_cell.rowSpan = num_of_products;

        new_cell = new_row.insertCell();
        new_cell.appendChild(document.createTextNode(elem.assumedOn ? elem.assumedOn : "-"));
        new_cell.rowSpan = num_of_products;

        new_cell = new_row.insertCell();
        new_cell.appendChild(document.createTextNode(elem.completedOn ? elem.completedOn : "-"));
        new_cell.rowSpan = num_of_products;

        for (let prod of elem.products) {
            new_cell = new_row.insertCell();
            new_cell.appendChild(document.createTextNode(prod.name));

            new_cell = new_row.insertCell();
            new_cell.appendChild(document.createTextNode(prod.amount));
            if (num_of_products-- !== 1)
                new_row = tableBody.insertRow();
        }
    }
}

async function cancelTask(id) {

    await fetch(`http://localhost:${PORT}/citizen/cancelTaskFromCitizen`, {
        method: 'POST',
        body: JSON.stringify({ id }),
        headers: {
            'Content-type': 'application/json'
        }
    }).then(response => {

        if (response.status === 200) {
            const index = offers.findIndex(off => off.id === id);

            offers[index].status = 'canceled';

            updateTable();
        }

    });

}