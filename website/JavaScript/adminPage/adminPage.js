"use strict"

pageAccess("ADMIN");

const add_rescuer_form = document.getElementById("signup-form");

add_rescuer_form.addEventListener("submit", (e) => {
    e.preventDefault();

    const phone = document.getElementById("rescuer_telephone").value;
    const password = document.getElementById("rescuer_password").value;
    const name = document.getElementById("rescuer_name").value;

    let messages = [];
    
    let check_value_of_user = function (str) {
        return /^\d+$/.test(str);
    }

    if(!check_value_of_user(phone))
        messages.push("Το τηλέφωνο πρέπει να αποτελείται μόνο από αριθμούς");

    if(messages.length > 0){
        document.getElementById("add-rescuer-alert").classList.add("alert-danger");
        document.getElementById("add-rescuer-alert").classList.remove("alert-success");

        document.getElementById("add-rescuer-alert").innerHTML = messages.join(", ");

        setTimeout( function() {
            document.getElementById("add-rescuer-alert").classList.remove("alert-danger");
            document.getElementById("add-rescuer-alert").classList.remove("alert-success");
            document.getElementById("add-rescuer-alert").innerHTML = "";
        }, time_until_a_message_fade_out);
    }
    else{

        let userData = {
            "signup_name": name,
            "signup_username": phone,
            "signup_password": password,
            "signup_role": "RESCUER",
            "longtitude": undefined,
            "latitude": undefined
        }

        const response = fetch(`http://localhost:${PORT}/calculateCitizenPosition`, {
            method: "GET",
            headers: {
                'Content-Type': 'application/json'
            },
        }).then(responce => responce.json())
            .then(
                data => {
                    userData.longtitude = data.longtitude;
                    userData.latitude = data.latitude;

                    addUser(userData);
                }
            );
    }
});
