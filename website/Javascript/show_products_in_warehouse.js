"use strict"

let user = JSON.parse(localStorage.getItem("user")) || { };
if(user.role === null || user.role === undefined)
    window.location.replace('../index.html');
else if(user.role !== "ADMIN")
    alert("Δεν έχετε πρόσβαση σε αυτήν την σελίδα!");

let all_products = [];
const table_data = document.getElementById("table-of-products").getElementsByTagName("tbody")[0];
const checkbox = document.getElementById("editable-checkbox");

checkbox.checked = false;

fetch("../PHP/show_products_in_warehouse.php", { 
    method: "GET"
}).then(response => response.json())
    .then(
        data => {
            for(let product of data){
                product["edited"] = false;
                if(all_products[product.ID] === undefined){
                    let prod = [product.ID, product.PRODUCT_NAME, product.CATEGORY, [], {old: product.AMOUNT, new: undefined}, product.edited];
                    prod[3].push([product.DETAIL_NAME, product.DETAIL_VALUE]);
                    all_products[product.ID] = prod;
                }
                else{
                    all_products[product.ID][3].push([product.DETAIL_NAME, product.DETAIL_VALUE]);
                }
            }
            if(all_products.length > 1) all_products.sort((a, b) => a[1].localeCompare(b[1]));
            add_products_to_table();
        }
    ).catch(error => console.error(`HERE: ${error}`));

function add_products_to_table(){
    table_data.innerHTML = "";

    let i = 0;

    while(all_products[i] !== undefined) {
        let num_of_details = all_products[i][3].length;

        let new_row = table_data.insertRow();

        let new_cell = new_row.insertCell();
        new_cell.appendChild(document.createTextNode(all_products[i][0]));
        new_cell.setAttribute("hidden", "");
        new_cell.rowSpan = num_of_details;

        new_cell = new_row.insertCell();
        let deleteButton = document.createElement("button");
        deleteButton.setAttribute("id", `deleteButton_${all_products[i][0]}`);
        deleteButton.addEventListener("mouseenter", () => {
            deleteButton.style.display = "block";
        });
        deleteButton.addEventListener("mouseleave", () => {
            deleteButton.style.display = "none";
        });
        deleteButton.addEventListener("click", () => {
            console.log("deleted");
        });
        deleteButton.classList.add("deleteButton");
        new_cell.appendChild(deleteButton);
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
		const editable = document.getElementById("editable-checkbox").checked;
        let amount_field = document.createElement("input");
        amount_field.setAttribute("id", `textField_${all_products[i][0]}`);
        amount_field.setAttribute("type", "number");
		amount_field.setAttribute("min", "0");
        amount_field.setAttribute("value", all_products["edited"] ? all_products[i][4]["new"] : all_products[i][4]["old"]);
        if (editable === false) amount_field.setAttribute("readonly", "");
        amount_field.classList.add("form-control");

        amount_field.addEventListener("change", () => {
            const prod_id = amount_field.id.split("_")[1];
            const prod = all_products.filter(prod => prod[0] == prod_id);
            prod[0][4]["new"] = amount_field.value;
        });
        
		new_cell.appendChild(amount_field);

        i++;
    }
    
    document.getElementById("table-of-products").querySelectorAll('td[rowspan]').forEach(cell => {
        cell.style.verticalAlign = "middle";
    })
}

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


const save_btn = document.getElementById("save-new-values");
const cancel_btn = document.getElementById("cancel-new-values");

save_btn.addEventListener("click", e => {
	e.preventDefault();
	
	let dataToSend = [];
	
	if(window.confirm("Είσαι σίγουρος ότι θέλεις να αποθηκεύσεις τις αλλαγές;") == true){
		for(let prod of all_products){
			if(prod !== undefined && prod[4]["new"] !== undefined){
				dataToSend.push({"id": parseInt(prod[0], 10), "amount": parseInt(prod[4]["new"], 10)});
				prod[4]["old"] = parseInt(prod[4]["new"], 10).toString();
				prod[4]["new"] = undefined;
			}
		}
			
		if(dataToSend.length > 0){
			const jsonData = JSON.stringify(dataToSend);
			const xhr = new XMLHttpRequest();
			xhr.open("POST", "../PHP/update_amount_in_warehouse.php", true);
			xhr.setRequestHeader('Content-type', 'application/json');
			xhr.onreadystatechange = function () {
				if (xhr.readyState == 4 && xhr.status == 200) {
					
					if(xhr.responseText === "Success")
						alert("Επιτυχής ανανέωση ποσοτήτων");
					else{
						alert("Προέκυψε πρόβλημα. Ξαναπροσπαθήστε!");
						console.error(xhr.responseText);
					}
				}
			};
			
			xhr.send(jsonData);
		}
		checkbox.checked = false;
		add_products_to_table();
	}
});

cancel_btn.addEventListener("click", e => {
	e.preventDefault();
	
	for(let prod of all_products){
		if(prod !== undefined && prod[4]["new"] !== undefined)
			prod[4]["new"] = undefined;
	}
	checkbox.checked = false;
	add_products_to_table();
});