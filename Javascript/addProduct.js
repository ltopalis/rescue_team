"use strict"

let user = JSON.parse(localStorage.getItem("user")) || { };
if(user.role === null || user.role === undefined)
    window.location.replace('http://localhost/Project/');
else if(user.role !== "ADMIN")
    alert("Δεν έχετε πρόσβαση σε αυτήν την σελίδα!");

let status = "before";

function add_product(data) {

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
                        data => { alert("Τα δεδομένα εισήχθησαν επιτυχώς!"); }
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