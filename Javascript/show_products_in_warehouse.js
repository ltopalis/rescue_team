"use strict"

let user = JSON.parse(localStorage.getItem("user")) || { };
if(user.role === null || user.role === undefined)
    window.location.replace('http://localhost/Project/');
else if(user.role !== "ADMIN")
    alert("Δεν έχετε πρόσβαση σε αυτήν την σελίδα!");

let all_products = [];
const table_data = document.getElementById("table-of-products").getElementsByTagName("tbody")[0];

fetch("/Project/PHP/show_products_in_warehouse.php", { 
    method: "GET"
}).then(response => response.json())
    .then(
        data => {
            for(let product of data){
                product["edited"] = false;
                all_products = [...all_products, product];
            }
            all_products.sort((a, b) => a.PRODUCT_NAME.localeCompare(b.PRODUCT_NAME));
            add_products_to_table();
        }
    ).catch(error => alert(`Error: ${error}`));




for(let trElem of table_data.getElementsByTagName("tr"))
    trElem.remove();

function add_products_to_table(){
    for(let product of all_products){
        let new_row = table_data.insertRow();
        
        let new_cell = new_row.insertCell();
        new_cell.appendChild(document.createTextNode(product["ID"]));
        new_cell.setAttribute("hidden", "");

        new_cell = new_row.insertCell();
        new_cell.appendChild(document.createTextNode(product["PRODUCT_NAME"]));
        
        new_cell = new_row.insertCell();
        new_cell.appendChild(document.createTextNode(product["CATEGORY"]));

        new_cell = new_row.insertCell();
        new_cell.appendChild(document.createTextNode(product["DETAIL_NAME"] == null ? "-" : product["DETAIL_NAME"]));
        
        new_cell = new_row.insertCell();
        new_cell.appendChild(document.createTextNode(product["DETAIL_VALUE"]== null ? "-" : product["DETAIL_VALUE"]));

        new_cell = new_row.insertCell();
        let amount_field = document.createElement("input");
        amount_field.setAttribute("type", "text");
        amount_field.setAttribute("value", product["AMOUNT"]);
        amount_field.setAttribute("readonly", "true");
        amount_field.classList.add("form-control");
        new_cell.appendChild(amount_field);
    }
}

const checkbox = document.getElementById("editable-checkbox");
function toogle_ediatble_field(){
    let inputFields = document.getElementsByTagName("input");
    if(checkbox.checked){
        for(let inputfield of inputFields){
            inputfield.readOnly = false;
        }
    }
    else {
        for(let inputfield of inputFields){
            inputfield.readOnly = true;
        }
    }
}

