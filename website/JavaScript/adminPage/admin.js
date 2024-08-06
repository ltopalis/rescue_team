"use strict"

pageAccess("ADMIN");

const ctx = document.getElementById('stats-graph');
const startDatepicker = document.getElementById('start-date');
const endDatepicker = document.getElementById('end-date');
const productsDropDownMenu = document.getElementById('products-select');
const productTable = document.getElementsByClassName('table')[0];

let myGraph = null;
let products = [];

const dates = { start: null, end: null };

async function getDates() {
    await fetch(`http://localhost:${PORT}/admin/dashboard`, {
        method: 'POST',
        body: JSON.stringify(dates),
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(response => response.json())
        .then(
            data => updateGraph(data)
        )
}

function updateGraph(params) {

    if (myGraph) myGraph.destroy();

    myGraph = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['νέα Αιτήματα', 'νέες Προσφορές', 'ολοκληρωμένα Αιτήματα', 'ολοκληρωμένες Προσφορές'],
            datasets: [{
                label: '# tasks',
                data: [params.not_completed_requests, params.not_completed_offers, params.completed_requests, params.completed_offers],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

async function initDropdownMenuOfProducts() {
    await fetch(`http://localhost:${PORT}/admin/getProductsForAnnouncement`, {
        method: "GET",
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(response => response.json())
        .then(
            data => {
                products = [...data];
                productsDropDownMenu.innerText = '';

                for (let d of data) {
                    const option = document.createElement('option');
                    option.value = d.ID;
                    option.innerText = d.PRODUCT_NAME;

                    productsDropDownMenu.appendChild(option);
                }

            }
        )
}

getDates();
initDropdownMenuOfProducts();

startDatepicker.addEventListener('change', (e) => {
    dates.start = startDatepicker.value;
    getDates();
});

endDatepicker.addEventListener('change', () => {
    dates.end = endDatepicker.value;
    getDates();
});

productsDropDownMenu.addEventListener('change', (event) => {
    const prodId = event.target.options[event.target.selectedIndex].value;

    products[products.findIndex(p => p.ID == prodId)].used = true;


    updateModal();
})

function cancelAnnouncement() {
    for (let product of products)
        product.used = false;

    updateModal();
}

async function createAnnouncement() {

    let announcementProducts = [];

    for (let prod of products)
        if (prod.used)
            announcementProducts.push(prod.ID);

    await fetch(`http://localhost:${PORT}/admin/createAnnouncement`, {
        method: 'POST',
        body: JSON.stringify(announcementProducts),
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(response => {
        if (response.status == 200) {
            for (let product of products)
                product.used = false;

            updateModal();
        }
    })




}

function updateModal() {

    productsDropDownMenu.innerText = '';
    const tableBody = productTable.getElementsByTagName('tbody')[0];
    tableBody.innerText = '';

    const option = document.createElement('option');
    option.innerText = '';

    productsDropDownMenu.appendChild(option);

    for (let prod of products) {
        if (!prod.used) {
            const option = document.createElement('option');
            option.value = prod.ID;
            option.innerText = prod.PRODUCT_NAME;

            productsDropDownMenu.appendChild(option);
        }
        else {

            const new_row = tableBody.insertRow();
            let new_cell = new_row.insertCell();

            let deleteIcon = document.createElement("i");
            deleteIcon.classList.add("fas");
            deleteIcon.classList.add("fa-x");

            let deleteButton = document.createElement("button");
            deleteButton.setAttribute("data-bs-toggle", "tooltip");
            deleteButton.setAttribute("data-bs-placement", "top");
            deleteButton.setAttribute("title", "Διαγραφή");
            deleteButton.setAttribute('id', `deleteProduct_${prod.ID}`);
            deleteButton.addEventListener("click", async () => {
                const product_id = deleteButton.id.split('_')[1];
                const index = products.findIndex(p => p.ID == product_id);
                products[index].used = false;
                updateModal();
            });

            deleteButton.classList.add("deleteButton");
            deleteButton.appendChild(deleteIcon);
            new_cell.appendChild(deleteButton);

            new_cell = new_row.insertCell();
            new_cell.appendChild(document.createTextNode(prod['PRODUCT_NAME']));

        }

    }

}