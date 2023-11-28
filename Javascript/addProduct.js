"use strict"

let user = JSON.parse(localStorage.getItem("user")) || { };
if(user.role === null || user.role === undefined)
    window.location.replace('http://localhost/Project/');
else if(user.role !== "ADMIN")
    alert("Δεν έχετε πρόσβαση σε αυτήν την σελίδα!");

function add_product(link) {
    fetch(link)
            .then(response => response.json())
            .then(data => {
                let categories = [];
                let products = [];
                let queries = [];

                for (let cat of data.categories) {
                    categories[cat.id] = cat.category_name;
                }

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

                let data_to_be_sent = new FormData();

                data_to_be_sent.append("queries", queries.join("\n"));

                fetch("/Project/PHP/call_add_new_product.php", {
                    method: "POST",
                    body: data_to_be_sent,
                }).then(response => response.json())
                    .then(
                        data => {
                            console.log(data);
                        }
                    ).catch(error => console.error("Error:", error))

            })
            .catch(error => {
                return `Error reading JSON file: ${error} `;
            })
}

const add_product_from_url = document.getElementById("add-product-from-url");
const add_product_from_file = document.getElementById("add-product-from-file");

// NOT WORKING

add_product_from_url.addEventListener("click", ( ) => {
    const url = document.getElementById("txtUrl").value;

    document.getElementById("txtUrl").value = "";

    let r_value = add_product(url);

    console.log(r_value);
});

// NOT WORKING

add_product_from_file.addEventListener("click", ( ) => {
    const file = document.getElementById("file_to_add_products").value;

    document.getElementById("file_to_add_products").value = "";

    let r_value = add_product(file);

    console.log(r_value);
});