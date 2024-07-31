"use strict"

pageAccess("ADMIN");

let all_products = [];
const table_data = document.getElementById("table-of-products").getElementsByTagName("tbody")[0];
const checkbox = document.getElementById("editable-checkbox");

checkbox.checked = false;

const response = fetch(`http://localhost:${PORT}/admin/getProducts`, {
    method: "GET"
}).then(response => response.json())
    .then(
        data => {
            for (let product of data) {
                product["edited"] = false;
                if (all_products[product.ID] === undefined) {
                    let prod = [];
                    prod['id'] = product.ID;
                    prod['product_name'] = product.PRODUCT_NAME;
                    prod['category'] = product.CATEGORY;
                    prod['details'] = [];
                    prod['quantity'] = { old: product.AMOUNT, new: undefined };
                    prod['edited'] = product.edited
                    prod['discontinued'] = product.DISCONTINUED == true ? true : false;
                    prod['details'].push([product.DETAIL_NAME, product.DETAIL_VALUE]);
                    all_products[product.ID] = prod;
                }
                else {
                    all_products[product.ID]['details'].push([product.DETAIL_NAME, product.DETAIL_VALUE]);
                }
            }

            if (all_products.length > 1) all_products.sort((a, b) => a['product_name'].localeCompare(b['product_name']));
            add_products_to_table();
        }
    );

function add_products_to_table() {
    table_data.innerHTML = "";

    const deletedSwitch = document.getElementById("deleted-checkbox").checked;

    let i = 0;

    while (all_products[i] !== undefined) {
        if (all_products[i]['discontinued'] == !deletedSwitch) { i++; continue; }
        let num_of_details = all_products[i]['details'].length;

        let new_row = table_data.insertRow();

        let new_cell = new_row.insertCell();

        let deleteIcon = document.createElement("i");
        deleteIcon.classList.add("fas");
        if (deletedSwitch == false)
            deleteIcon.classList.add("fa-trash-alt");
        else
            deleteIcon.classList.add('fa-refresh');

        let deleteButton = document.createElement("button");
        deleteButton.setAttribute("id", `deleteButton_${all_products[i]["id"]}`);
        deleteButton.setAttribute("data-bs-toggle", "tooltip");
        deleteButton.setAttribute("data-bs-placement", "top");
        deleteButton.setAttribute("title", (deletedSwitch == false ? "Διαγραφή" : "Επαναφορά"));
        deleteButton.addEventListener("click", async () => {
            const prod_id = deleteButton.id.split("_")[1];
            const prod = all_products.filter(prod => prod["id"] == prod_id)[0];

            if (deletedSwitch == false ? window.confirm("Είσαι σίγουρος ότι θέλεις να διαγράψεις το προϊόν;") == true : window.confirm("Είσαι σίγουρος ότι θέλεις να επαναφέρεις το προϊόν;") == true) {
                prod['discontinued'] = deletedSwitch == false ? true : false;

                const dataToSend = { 'id': prod['id'], 'discontinued': prod['discontinued'] == true ? 1 : 0 };

                const response = await fetch(`http://localhost:${PORT}/admin/alterAvailabilityProduct`, {
                    method: "POST",
                    headers: {
                        'Content-type': 'application/json'
                    },
                    body: JSON.stringify(dataToSend)
                });

                if (response.status == 200 && response.statusText == "OK")
                    alert("Επιτυχής ανανέωση ποσοτήτων");
                else {
                    alert("Προέκυψε πρόβλημα. Ξαναπροσπαθήστε!");
                    consoel.log(response);
                }

                add_products_to_table();
            }
        });
        deleteButton.classList.add(deletedSwitch == false ? "deleteButton" : "restoreButton");
        deleteButton.appendChild(deleteIcon);
        new_cell.appendChild(deleteButton);
        new_cell.rowSpan = num_of_details;

        new_cell = new_row.insertCell();
        new_cell.appendChild(document.createTextNode(all_products[i]['product_name']));
        new_cell.rowSpan = num_of_details;

        new_cell = new_row.insertCell();
        new_cell.appendChild(document.createTextNode(all_products[i]['category']));
        new_cell.rowSpan = num_of_details;

        for (let detail of all_products[i]['details']) {
            new_cell = new_row.insertCell();
            new_cell.appendChild(document.createTextNode(detail[0] === null ? "-" : detail[0]));

            new_cell = new_row.insertCell();
            new_cell.appendChild(document.createTextNode(detail[1] == null ? "-" : detail[1]));
            if (num_of_details-- !== 1)
                new_row = table_data.insertRow();
        }

        new_cell = new_row.insertCell();
        const editable = document.getElementById("editable-checkbox").checked;
        let amount_field = document.createElement("input");
        amount_field.setAttribute("id", `textField_${all_products[i]["id"]}`);
        amount_field.setAttribute("type", "number");
        amount_field.setAttribute("min", "0");
        amount_field.setAttribute("value", all_products["edited"] ? all_products[i]['quantuity']["new"] : all_products[i]['quantity']["old"]);
        if (editable === false) amount_field.setAttribute("readonly", "");
        amount_field.classList.add("form-control");

        amount_field.addEventListener("change", () => {
            const prod_id = amount_field.id.split("_")[1];
            const prod = all_products.filter(prod => prod["id"] == prod_id);
            prod[0]['quantity']["new"] = amount_field.value;
        });

        new_cell.appendChild(amount_field);

        i++;
    }

    document.getElementById("table-of-products").querySelectorAll('td[rowspan]').forEach(cell => {
        cell.style.verticalAlign = "middle";
    })
}

function toogle_ediatble_field() {
    let inputFields = document.getElementsByTagName("input");
    if (checkbox.checked) {
        for (let inputfield of inputFields) {
            inputfield.readOnly = false;
        }
    }
    else {
        for (let inputfield of inputFields) {
            inputfield.readOnly = true;
        }
    }
}

function toogle_deleted_field() {
    add_products_to_table();
}

const save_btn = document.getElementById("save-new-values");
const cancel_btn = document.getElementById("cancel-new-values");

save_btn.addEventListener("click", async (e) => {
    e.preventDefault();

    let dataToSend = [];

    if (window.confirm("Είσαι σίγουρος ότι θέλεις να αποθηκεύσεις τις αλλαγές;") == true) {
        for (let prod of all_products) {
            if (prod !== undefined && prod['quantity']["new"] !== undefined) {
                dataToSend.push({ "id": parseInt(prod["id"], 10), "amount": parseInt(prod['quantity']["new"], 10) });
                prod['quantity']["old"] = parseInt(prod['quantity']["new"], 10).toString();
                prod['quantity']["new"] = undefined;
            }
        }

        if (dataToSend.length > 0) {
            const response = await fetch(`http://localhost:${PORT}/admin/updateAmount`, {
                method: "POST",
                body: JSON.stringify(dataToSend),
                headers: {
                    'Content-type': 'application/json'
                },
            });
        }

        checkbox.checked = false;
        add_products_to_table();
    }
});

cancel_btn.addEventListener("click", e => {
    e.preventDefault();

    for (let prod of all_products) {
        if (prod !== undefined && prod['quantity']["new"] !== undefined)
            prod['quantity']["new"] = undefined;
    }
    checkbox.checked = false;
    add_products_to_table();
});