"use strict"

let user = JSON.parse(localStorage.getItem("user")) || { };
if(user.role === null || user.role === undefined)
    window.location.replace('../index.html');
else if(user.role !== "ADMIN")
    alert("Δεν έχετε πρόσβαση σε αυτήν την σελίδα!");

// Ανανέωση λίστας με τις κατηγορίες προϊόντων
let all_categories = [];

fetch("../PHP/show_categories.php", {
    method: "POST"
}).then(response => response.json())
    .then(
        data => { 
            for(let category of data){
                all_categories = [...all_categories, category];
            } 
            update_category_dropdown_menu();
        }
    ).catch(error => alert("Error: " +  error));

function update_category_dropdown_menu(){
    const categories_dropdown_menu = document.getElementById("category_dropdown_menu");
    for ( let i = categories_dropdown_menu.options.length; i>=0; i--){
        categories_dropdown_menu.remove(i);
    }

    for(let category of all_categories){
        let option = document.createElement("option");
        option.value = category;
        option.text = category;
        categories_dropdown_menu.appendChild(option);
    }
}

function add_product(data) {

    let categories = [];
    let products = [];
    let queries = [];

    for (let cat of data.categories) {
        if(cat !== undefined){
            categories[cat.id] = cat.category_name;
            let query = `CALL ADD_CATEGORIES('${categories[cat.id]}');`;
            queries.push(query);
            all_categories.push(categories[cat.id]);
        }
    }

    all_categories.sort();

    console.log(queries);

    // Send categories
    let data_to_be_sent = new FormData();
    data_to_be_sent.append("queries", queries.join("\n"));

    fetch("../PHP/call_add_new_product.php", {
        method: "POST",
        body: data_to_be_sent,
    }).then(response => response.json())
        .then(data => {
            
            document.getElementById("add-from-file-alert").classList.remove("alert-danger");
            document.getElementById("add-from-file-alert").classList.remove("alert-success");
            document.getElementById("add-from-file-alert").innerHTML = "";

            if(data === "SUCCESS"){
                document.getElementById("add-from-file-alert").classList.add("alert-success");
                document.getElementById("add-from-file-alert").innerHTML = "Η κατηγορία προϊόντος προστέθηκε με επιτυχία!";

                all_categories = [];
                fetch("../PHP/show_categories.php", {
                    method: "POST"
                }).then(response => response.json())
                .then(
                    data => { 
                        for(let category of data){
                        all_categories.push(category);
                    } 
                    all_categories.sort();
                    update_category_dropdown_menu();
                    }
                ).catch(error => alert("Error: " +  error));
            }
            else if(RegExp(".*DUPLICATE_ENTRY.*", 'g').test(data)){
                console.error(data);
                document.getElementById("add-from-file-alert").classList.add("alert-danger");
                document.getElementById("add-from-file-alert").innerHTML = "Η κατηγορία υπάρχει ήδη!";
            }
            else if(RegExp(".*UNEXPECTED_ERROR.*", 'g').test(data)){
                console.error(data);
                document.getElementById("add-from-file-alert").classList.add("alert-danger");
                document.getElementById("add-from-file-alert").innerHTML = "Συνέβη κάποιο σφάλμα. Προσπαθήστε ξανά";
            }

            setTimeout( () => {
                document.getElementById("add-from-file-alert").classList.remove("alert-danger");
                document.getElementById("add-from-file-alert").classList.remove("alert-success");
                document.getElementById("add-from-file-alert").innerHTML = "";
            }, time_until_a_message_fade_out)
        }).catch(error => alert("Error: " +  error));

    queries = [];

    for (let item of data.items) {
        let details = [];

        for (let detail of item.details) {
            details = [...details, detail]
        }

        let new_item = [item.name, categories[item.category], details];
            products = [...products, new_item];
        }

        for (let item of products) {
            for (let detail of item[2]) {
                let query = `CALL ADD_NEW_PRODUCT('${item[1]}', '${item[0]}', '${detail["detail_name"]}', '${detail["detail_value"]}');`;
                queries = [...queries, query];
            }
    }

                // console.log(queries);

                data_to_be_sent = new FormData();

                data_to_be_sent.append("queries", queries.join("\n"));

                fetch("../PHP/call_add_new_product.php", {
                    method: "POST",
                    body: data_to_be_sent,
                }).then(response => response.json())
                    .then(
                        () => { alert("Τα δεδομένα εισήχθησαν επιτυχώς!"); }
                    ).catch(error => alert("Error: " +  error));

                
}

const add_product_from_url = document.getElementById("add-product-from-url");
const add_product_from_file = document.getElementById("add-product-from-file");

// NOT WORKING

add_product_from_url.addEventListener("click", ( ) => {
    const url = document.getElementById("txtUrl").value;

    fetch(url)
        .then(response => {
            if(!response.ok){
                throw new Error("Network response was not ok");
            }
            // return response.json();
        })
        .then(data => {
            console.log(data);
        })
        .catch(error => {
            console.error(`Error fetching the JSON: ${error}`);
        });

    // document.getElementById("txtUrl").value = "";

    // let r_value = add_product(url);

    // console.log(r_value);
});

add_product_from_file.addEventListener("click", ( ) => {

    const fileInput = document.getElementById("file_to_add_products");

    if(fileInput.files.length > 0){
        const file = fileInput.files[0];

        if(file.type === "application/json"){
            fetch(URL.createObjectURL(file))
                .then(response => response.json())
                .then(data => {
                    add_product(data);
                })
                .catch(error => console.error("Error reading json file: " + error));
        }
        else
            console.log("The file you've provided isn't a json file");
    }

    fileInput.value = "";
});

const add_category_btn = document.getElementById("add-category-manually");
add_category_btn.addEventListener("click", () => {
    const new_category = document.getElementById("category_name");
    
    if(new_category.value === "") return;

    let data = new FormData();
    data.append("new_category", new_category.value);

    fetch("../PHP/add_category.php", {
        method: "POST",
        body: data
    })
        .then(response => response.json())
        .then(data => {
            document.getElementById("add-category-alert").classList.remove("alert-danger");
            document.getElementById("add-category-alert").classList.remove("alert-success");
            document.getElementById("add-category-alert").innerHTML = "";
            switch(data){
                case "SUCCESS":
                    document.getElementById("add-category-alert").classList.add("alert-success");
                    document.getElementById("add-category-alert").innerHTML = "Η κατηγορία προϊόντος προστέθηκε με επιτυχία!";

                    all_categories.push(new_category.value);
                    all_categories.sort();
                    update_category_dropdown_menu();

                    new_category.value = "";
                    break;
                case "DUPLICATE_ENTRY":
                    document.getElementById("add-category-alert").classList.add("alert-danger");
                    document.getElementById("add-category-alert").innerHTML = "Η κατηγορία υπάρχει ήδη!";
                    break;
                case "UNEXPECTED_ERROR":
                    document.getElementById("add-category-alert").classList.add("alert-danger");
                    document.getElementById("add-category-alert").innerHTML = "Συνέβη κάποιο σφάλμα. Προσπαθήστε ξανά";
                    break;
            }
            setTimeout( function() {
                document.getElementById("add-category-alert").classList.remove("alert-danger");
                document.getElementById("add-category-alert").classList.remove("alert-success");
                document.getElementById("add-category-alert").innerHTML = "";
            }, time_until_a_message_fade_out);
        })
        .catch(error => console.error("Error:", error));
});

const add_details_btn = document.getElementById("add_details");

add_details_btn.addEventListener("click", () => {
    const table = document.getElementById("details_table").getElementsByTagName("tbody")[0];

    const newRow = table.insertRow();

    const detail_name_txt = document.createElement("input");
    detail_name_txt.setAttribute("type", "text");
    detail_name_txt.setAttribute("name", "detail_name");
    detail_name_txt.setAttribute("id", "detail_name");
    detail_name_txt.classList.add("form-control");
    
    const detail_value_txt = document.createElement("input");
    detail_value_txt.setAttribute("type", "text");
    detail_value_txt.setAttribute("name", "detail_value");
    detail_value_txt.setAttribute("id", "detail_value");
    detail_value_txt.classList.add("form-control");
    
    newRow.insertCell().appendChild(detail_name_txt);
    newRow.insertCell().appendChild(detail_value_txt);
});

const add_products = document.getElementById("add_product");
add_products.addEventListener("click", () => {
    const name = document.getElementById("item_name").value;
    const category = document.getElementById("category_dropdown_menu").value;
    const detail_table = document.getElementById("details_table").getElementsByTagName("tbody")[0];
    let queries = [];

    if(name === "") return;

    for(let row of detail_table.rows){
        let detail_name = row.getElementsByTagName("td")[0].getElementsByTagName("input")[0].value;
        let detail_value = row.getElementsByTagName("td")[1].getElementsByTagName("input")[0].value;

        if(detail_name === "" | detail_value === "") continue;

        let query = `CALL ADD_NEW_PRODUCT('${category}', '${name}', '${detail_name}', '${detail_value}');`;

        queries = [...queries, query];

    }

    let data_to_be_sent = new FormData();

    data_to_be_sent.append("queries", queries.join("\n"));

    fetch("../PHP/call_add_new_product.php", {
        method: "POST",
        body: data_to_be_sent,
    }).then(response => response.json())
        .then(
            data => { alert("Τα δεδομένα εισήχθησαν επιτυχώς!"); }
            ).catch(error => alert("Error: " +  error));

    // clean table

    document.getElementById("item_name").value = "";
    for(let row of detail_table.rows){
        row.getElementsByTagName("td")[0].getElementsByTagName("input")[0].value = "";
        row.getElementsByTagName("td")[1].getElementsByTagName("input")[0].value = "";
    }
});