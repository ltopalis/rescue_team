"use strict"

const time_until_a_message_fade_out = 1000 * 60; // 15 seconds
const number_of_products_per_page = 10;

const PORT = 3000;

function init_user() {
    fetch("./PHP/get_warehouse_location.php", {
        method: "POST"
    }).then(response => response.json())
        .then(
            data => {
                user.warehouse_location = {};
                user.warehouse_location.lat = parseFloat(data.lat);
                user.warehouse_location.lng = parseFloat(data.lng);
            }
        )
        .catch(error => console.error("Error:", error));
}

function clean_forms() {
    let signup_form = document.getElementsByClassName("form-control");

    for (let elem of signup_form) {
        elem.value = "";
    }
}

function addUser(data) {
    const response = fetch(`http://localhost:${PORT}/signup`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }).then(response => response.json())
        .then(
            FetchData => {
                document.getElementById("signup-alert").classList.remove("alert-danger");
                document.getElementById("signup-alert").classList.remove("alert-success");
                switch (FetchData.status) {
                    case "SUCCESS":
                        document.getElementById("signup-alert").classList.add("alert-success");
                        document.getElementById("signup-alert").innerHTML = "Η εγγραφή πραγματοποιήθηκε με επιτυχία!";
                        for (let elem of signup_form.elements)
                            elem.value = "";
                        break;
                    case "ER_DUP_ENTRY":
                        document.getElementById("signup-alert").classList.add("alert-danger");
                        document.getElementById("signup-alert").innerHTML = "Ο χρήστης υπάρχει ήδη! Πραγματοποιήστε σύνδεση";
                        break;
                    case "UNEXPECTED_ERROR":
                        document.getElementById("signup-alert").classList.add("alert-danger");
                        document.getElementById("signup-alert").innerHTML = "Συνέβη κάποιο σφάλμα. Προσπαθήστε ξανά";
                        break;
                    default:
                        console.log("I HAVE NO IDEA!" + FetchData.status);
                }

                setTimeout(function () {
                    document.getElementById("signup-alert").classList.remove("alert-danger");
                    document.getElementById("signup-alert").classList.remove("alert-success");
                    document.getElementById("signup-alert").innerHTML = "";
                }, time_until_a_message_fade_out);
            }
        )
}

async function logout() {
    const response = await fetch(`http://localhost:${PORT}/logout`, {
        method: "GET"
    });

    if(response.ok)
        window.location.replace("/");
}

