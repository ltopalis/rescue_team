"use strict"

pageAccess("ADMIN");

// Ανανέωση λίστας με τις κατηγορίες προϊόντων
let all_categories = [];

const response = fetch(`http://localhost:${PORT}/admin/getCategories`, {
    method: "GET"
}).then(response => response.json())
    .then(
        data => {
            for (let category of data[0])
                all_categories = [...all_categories, category.CATEGORY_NAME];

            update_category_dropdown_menu();
        }
    ).catch(error => alert("Error: " + error));


function update_category_dropdown_menu() {
    const categories_dropdown_menu = document.getElementById("category_dropdown_menu");
    for (let i = categories_dropdown_menu.options.length; i >= 0; i--) {
        categories_dropdown_menu.remove(i);
    }

    for (let category of all_categories) {
        let option = document.createElement("option");
        option.value = category;
        option.text = category;
        categories_dropdown_menu.appendChild(option);
    }
}

async function add_product(data) {

    const response = await fetch(`http://localhost:${PORT}/admin/addProduct`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(response => response.json())
        .then(
            data => {
                if (data.status == "SUCCESS")
                    alert("Τα δεδομένα εισήχθησαν επιτυχώς");
                else
                    alert("Προέκυψε κάποιο πρόβλημα με την εισαγωγή των δεδομένων");
            }
        );

}

const add_product_from_url = document.getElementById("add-product-from-url");
const add_product_from_file = document.getElementById("add-product-from-file");

add_product_from_url.addEventListener("click", async () => {
    const url = document.getElementById("txtUrl").value;

    const response = await fetch(`http://localhost:${PORT}/admin/getDataFromURL`, {
        body: JSON.stringify({ url }),
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(response => response.json())
        .then(
            data => {
                if (data.error) {
                    if (data.error.code == "ERR_INVALID_URL")
                        alert("Ελέγξτε την μορφή του url και ξαναπροσπαθήστε");
                    else if (data.error.code == "ENOTFOUND")
                        alert("Tο url που δόθηκε δεν υπάρχει");
                }
                else {
                    alert("Επιτυχής εισαγωγή δεδομένων");
                    document.getElementById("txtUrl").value = '';
                }
            }

        );


});

add_product_from_file.addEventListener("click", () => {

    const fileInput = document.getElementById("file_to_add_products");

    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];

        if (file.type === "application/json") {
            fetch(URL.createObjectURL(file))
                .then(response => response.json())
                .then(file => {
                    let categories = [];
                    let data = [];

                    for (let category of file.categories)
                        categories[category.id] = category.category_name;

                    for (let item of file.items)
                        data.push({
                            name: item.name,
                            category: categories[item.category],
                            details: item.details
                        });

                    add_product(data);

                    let uniqueCategories = new Set(all_categories);
                    categories.forEach(category => uniqueCategories.add(category));
                    all_categories = Array.from(uniqueCategories).sort();
                    update_category_dropdown_menu();

                })
                .catch(error => console.error("Error reading json file: " + error));
        }
        else
            console.log("The file you've provided isn't a json file");
    }

    fileInput.value = "";
});

const add_category_btn = document.getElementById("add-category-manually");
add_category_btn.addEventListener("click", async () => {
    const new_category = document.getElementById("category_name");

    if (new_category.value === "") return;

    let data = { "category": new_category.value };

    const response = await fetch(`http://localhost:${PORT}/admin/addCategory`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(response => response.json())
        .then(
            data => {
                document.getElementById("add-category-alert").classList.remove("alert-danger");
                document.getElementById("add-category-alert").classList.remove("alert-success");
                document.getElementById("add-category-alert").innerHTML = "";

                switch (data.status) {
                    case "SUCCESS":
                        document.getElementById("add-category-alert").classList.add("alert-success");
                        document.getElementById("add-category-alert").innerHTML = "Η κατηγορία προϊόντος προστέθηκε με επιτυχία!";

                        all_categories.push(new_category.value);
                        all_categories.sort();
                        update_category_dropdown_menu();

                        new_category.value = "";
                        break;
                    case "ER_DUP_ENTRY":
                        document.getElementById("add-category-alert").classList.add("alert-danger");
                        document.getElementById("add-category-alert").innerHTML = "Η κατηγορία υπάρχει ήδη!";
                        break;
                    default:
                        document.getElementById("add-category-alert").classList.add("alert-danger");
                        document.getElementById("add-category-alert").innerHTML = "Συνέβη κάποιο σφάλμα. Προσπαθήστε ξανά";
                        break;
                }
                setTimeout(function () {
                    document.getElementById("add-category-alert").classList.remove("alert-danger");
                    document.getElementById("add-category-alert").classList.remove("alert-success");
                    document.getElementById("add-category-alert").innerHTML = "";
                }, time_until_a_message_fade_out);
            }
        );
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
add_products.addEventListener("click", async () => {
    const name = document.getElementById("item_name").value;
    const category = document.getElementById("category_dropdown_menu").value;
    const detail_table = document.getElementById("details_table").getElementsByTagName("tbody")[0];
    let queries = [];

    if (name === "") return;

    let data_to_be_sent = {
        name,
        category,
        "details": []
    };

    for (let row of detail_table.rows) {
        let detail_name = row.getElementsByTagName("td")[0].getElementsByTagName("input")[0].value;
        let detail_value = row.getElementsByTagName("td")[1].getElementsByTagName("input")[0].value;

        if (detail_name === "" | detail_value === "") continue;

        data_to_be_sent.details.push({ detail_name, detail_value });

    }

    const response = await fetch(`http://localhost:${PORT}/admin/addProduct`, {
        method: "POST",
        body: JSON.stringify([data_to_be_sent]),
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(response => response.json())
        .then(
            data => {
                switch (data.status) {
                    case "SUCCESS":
                        alert("Το προϊόν εισήχθη επιτυχώς");
                }
            }
        ).catch(error => alert("Error: " + error));


    // clean table

    document.getElementById("item_name").value = "";
    for (let row of detail_table.rows) {
        row.getElementsByTagName("td")[0].getElementsByTagName("input")[0].value = "";
        row.getElementsByTagName("td")[1].getElementsByTagName("input")[0].value = "";
    }

    const rows = detail_table.rows.length;

    for (let i = 0; i < rows - 1; i++)
        detail_table.deleteRow(0);
});