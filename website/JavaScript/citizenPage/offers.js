"use strict"

pageAccess("CITIZEN");

let announcements = [{ id: 5, date: '2024-05-09 12:35:24', products: [{ id: 8, category: 'testCat', name: 'pasta', details: [{ detail_name: 'detail', value: 5 }, { detail_name: 'detail2', value: 85 }] }, { id: 4, category: 'bring it to the runway', name: 'water', details: [{ detail_name: 'detail', value: 5 }, { detail_name: 'detail2', value: 85 }] }] },
{ id: 5, date: '2024-05-09 12:35:24', products: [{ id: 8, category: 'testCat', name: 'pasta', details: [{ detail_name: 'detail', value: 5 }, { detail_name: 'detail2', value: 85 }] }, { id: 4, category: 'bring it to the runway', name: 'water', details: [{ detail_name: 'detail', value: 5 }, { detail_name: 'detail2', value: 85 }] }] },
{ id: 5, date: '2024-05-09 12:35:24', products: [{ id: 8, category: 'testCat', name: 'pasta', details: [{ detail_name: 'detail', value: 5 }, { detail_name: 'detail2', value: 85 }] }, { id: 4, category: 'bring it to the runway', name: 'water', details: [{ detail_name: 'detail', value: 5 }, { detail_name: 'detail2', value: 85 }] }] },
{ id: 5, date: '2024-05-09 12:35:24', products: [{ id: 8, category: 'testCat', name: 'pasta', details: [{ detail_name: 'detail', value: 5 }, { detail_name: 'detail2', value: 85 }] }, { id: 4, category: 'bring it to the runway', name: 'water', details: [{ detail_name: 'detail', value: 5 }, { detail_name: 'detail2', value: 85 }] }] },
{ id: 5, date: '2024-05-09 12:35:24', products: [{ id: 8, category: 'testCat', name: 'pasta', details: [{ detail_name: 'detail', value: 5 }, { detail_name: 'detail2', value: 85 }] }, { id: 4, category: 'bring it to the runway', name: 'water', details: [{ detail_name: 'detail', value: 5 }, { detail_name: 'detail2', value: 85 }] }] }]

const announcementTable = document.getElementById('table-of-announcement');

async function init() {

    await fetch(`http://localhost:${PORT}/citizen/getAnnouncements`, {
        method: 'GET',
        headers: {
            'Content-type': 'application/json'
        }
    }).then(response => response.json())
        .then(data => {
            announcements = data;
            updateTable();
        });

}

function updateTable() {

    const tableBody = announcementTable.getElementsByTagName('tbody')[0];
    tableBody.innerText = '';

    for (let announcement of announcements) {

        let num_of_products = announcement.products.length;

        let new_row = tableBody.insertRow();
        let new_cell = new_row.insertCell();

        let offerIcon = document.createElement("i");
        offerIcon.classList.add('fas');
        offerIcon.classList.add('fa-envelope');

        let offerButton = document.createElement("button");
        offerButton.setAttribute("id", `offerButton_${announcement["id"]}`);
        offerButton.setAttribute("data-bs-toggle", "tooltip");
        offerButton.setAttribute("data-bs-placement", "top");
        offerButton.setAttribute("title", "Προσφέρετε");
        offerButton.setAttribute('data-bs-toggle', 'modal');
        offerButton.setAttribute('data-bs-target', '#products-to-offer');
        offerButton.setAttribute('onclick', `updateModalTable(${announcement.id})`);
        offerButton.classList.add("offerButton");
        offerButton.appendChild(offerIcon);
        new_cell.appendChild(offerButton);
        new_cell.rowSpan = num_of_products;
        new_cell.style.verticalAlign = 'middle';

        new_cell = new_row.insertCell();
        new_cell.appendChild(document.createTextNode(announcement.date));
        new_cell.rowSpan = num_of_products;
        new_cell.style.verticalAlign = 'middle';

        for (let product of announcement.products) {
            new_cell = new_row.insertCell();
            new_cell.appendChild(document.createTextNode(product.category));
            new_cell.style.verticalAlign = 'middle';

            new_cell = new_row.insertCell();
            new_cell.appendChild(document.createTextNode(product.name));
            new_cell.style.verticalAlign = 'middle';

            if (num_of_products-- !== 1)
                new_row = tableBody.insertRow();
        }
    }

}

function updateModalTable(announcementId) {
    const announcement = announcements[announcements.findIndex(ann => ann.id == announcementId)];
    const productTable = document.getElementById('products-table').getElementsByTagName('tbody')[0];

    productTable.innerText = '';

    for (let product of announcement.products) {

        let number_of_details = product.details.length;

        let new_row = productTable.insertRow();
        let new_cell = new_row.insertCell();

        let amountTextField = document.createElement('input');
        amountTextField.setAttribute('type', 'number');
        amountTextField.setAttribute('min', '0');
        amountTextField.setAttribute('value', '0');
        amountTextField.setAttribute("id", `amountTextFieldForProduct_${product.id}`);
        amountTextField.classList.add('form-control');
        amountTextField.classList.add('amountProductTextField');
        new_cell.appendChild(amountTextField);
        new_cell.style.verticalAlign = 'middle';
        new_cell.rowSpan = number_of_details;

        new_cell = new_row.insertCell();
        new_cell.appendChild(document.createTextNode(product.name));
        new_cell.rowSpan = number_of_details;
        new_cell.style.verticalAlign = 'middle';

        new_cell = new_row.insertCell();
        new_cell.appendChild(document.createTextNode(product.category));
        new_cell.rowSpan = number_of_details;
        new_cell.style.verticalAlign = 'middle';

        for (let detail of product.details) {
            new_cell = new_row.insertCell();
            new_cell.appendChild(document.createTextNode(detail.detail_name));
            new_cell.style.verticalAlign = 'middle';

            new_cell = new_row.insertCell();
            new_cell.appendChild(document.createTextNode(detail.detail_value));
            new_cell.style.verticalAlign = 'middle';

            if (number_of_details-- !== 1)
                new_row = productTable.insertRow();

        }

    }
}

async function createOffer() {

    const amountTextFields = document.getElementsByClassName("amountProductTextField");

    for (let amountTF of amountTextFields)
        if (amountTF.value > 0) {
            const productID = amountTF.id.split("_")[1];
            console.log(amountTF.value, productID);
        }

}

init();