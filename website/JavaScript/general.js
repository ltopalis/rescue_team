"use strict"


const time_until_a_message_fade_out = 1000 * 60; // 15 seconds

const PORT = 3000;

async function pageAccess(page) {
    const response = await fetch(`http://localhost:${PORT}/validatePage`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ "page": page })
    });

    if (response.status == 500) {
        alert("Δεν έχετε πρόσβαση σε αυτήν την σελίδα");
        window.location.replace("/");
    }
}

function clean_forms() {
    let signup_form = document.getElementsByClassName("form-control");

    for (let elem of signup_form) {
        elem.value = "";
    }
}

function addUser(data) {
    const signup_form = document.getElementById("signup-form");

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
                        document.getElementById("signup-alert").innerHTML = "Ο χρήστης υπάρχει ήδη!";
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

    if (response.ok)
        window.location.replace("/");
}

