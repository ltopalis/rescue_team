"use strict"

let all_products_in_transition = [];
const table_data_trans = document.getElementById("table-of-products-in-transition").getElementsByTagName("tbody")[0];


fetch(`http://localhost:${PORT}/admin/getProductsOnVans`, {
    method: "GET",
    headers: {
        'Content-Type': 'application/json'
    }
}).then(response => response.json())
    .then(
        data => {
            table_data_trans.innerText = "";

            for (let rescuer of data) {
                let num_of_prods = rescuer.products.length;

                let new_row = table_data_trans.insertRow();
                let new_cell = new_row.insertCell();
                new_cell.innerHTML = `${rescuer.name}</br>${rescuer.username}`;
                new_cell.rowSpan = num_of_prods;

                for (let product of rescuer.products) {
                    new_cell = new_row.insertCell();
                    new_cell.innerText = product.amount;

                    new_cell = new_row.insertCell();
                    new_cell.innerText = product.name;

                    if (num_of_prods-- !== -1)
                        new_row = table_data_trans.insertRow();
                }

            }

        }
    )