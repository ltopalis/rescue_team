"use strict"

let user = JSON.parse(localStorage.getItem("user")) || { };
if(user.role === null || user.role === undefined)
    window.location.replace('../index.html');
else if(user.role !== "ADMIN")
    alert("Δεν έχετε πρόσβαση σε αυτήν την σελίδα!");

let all_products = [];
const table_data = document.getElementById("table-of-products").getElementsByTagName("tbody")[0];
let number_of_pages_on_table;
let page = 0;

fetch("../PHP/show_products_in_warehouse.php", { 
    method: "GET"
}).then(response => response.json())
    .then(
        data => {
            for(let product of data){
                product["edited"] = false;
                if(all_products[product.ID] === undefined){
                    let prod = [product.ID, product.PRODUCT_NAME, product.CATEGORY, [], product.AMOUNT, product.edited];
                    prod[3].push([product.DETAIL_NAME, product.DETAIL_VALUE]);
                    all_products[product.ID] = prod;
                }
                else{
                    all_products[product.ID][3].push([product.DETAIL_NAME, product.DETAIL_VALUE]);
                }
            }
            all_products.sort((a, b) => a[1].localeCompare(b[1]));
            number_of_pages_on_table = Math.ceil(all_products.length / number_of_products_per_page);
            add_products_to_table();
        }
    ).catch(error => console.error(`HERE: ${error}`));

function add_products_to_table(){
    let start = page * number_of_products_per_page;
    let finish = start + number_of_products_per_page;
    if(finish > all_products.length - 1)
        finish = all_products.length - 1;

    console.log(start, finish);

    table_data.innerHTML = "";

    for(let i = start; i < finish; i++){
        let num_of_details = all_products[i][3].length;

        let new_row = table_data.insertRow();
        
        let new_cell = new_row.insertCell();
        new_cell.appendChild(document.createTextNode(all_products[i][0]));
        new_cell.setAttribute("hidden", "");
        new_cell.rowSpan = num_of_details;

        new_cell = new_row.insertCell();
        new_cell.appendChild(document.createTextNode(all_products[i][1]));
        new_cell.rowSpan = num_of_details;
        
        new_cell = new_row.insertCell();
        new_cell.appendChild(document.createTextNode(all_products[i][2]));
        new_cell.rowSpan = num_of_details;

        for(let detail of all_products[i][3]){
            new_cell = new_row.insertCell();
            new_cell.appendChild(document.createTextNode(detail[0] === null ? "-" : detail[0]));

            new_cell = new_row.insertCell();
            new_cell.appendChild(document.createTextNode(detail[1] == null ? "-" : detail[1]));
            if(num_of_details-- !== 1)
                new_row = table_data.insertRow();
        }

        new_cell = new_row.insertCell();
        // new_cell.rowSpan = num_of_details;
        let amount_field = document.createElement("input");
        amount_field.setAttribute("type", "text");
        amount_field.setAttribute("value", all_products[i][4]);
        amount_field.setAttribute("readonly", "true");
        amount_field.classList.add("form-control");
        new_cell.appendChild(amount_field);
    }
    
    document.getElementById("table-of-products").querySelectorAll('td[rowspan]').forEach(cell => {
        cell.style.verticalAlign = "middle";
    })
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

const next_page_arrow = document.getElementById('next-page');
const prev_page_arrow = document.getElementById('prev-page');

next_page_arrow.addEventListener("click", e => {
    e.preventDefault();
    if(++page === number_of_pages_on_table - 1){
        next_page_arrow.hidden = true;
    }
    else{
        next_page_arrow.hidden = false;
        prev_page_arrow.hidden = false;
    }

    add_products_to_table();
});

prev_page_arrow.addEventListener("click", e => {
    e.preventDefault();

    if(--page === 0){
        prev_page_arrow.hidden = true;
    }
    else{
        prev_page_arrow.hidden = false;
        next_page_arrow.hidden = false;
    }

    add_products_to_table();
});

