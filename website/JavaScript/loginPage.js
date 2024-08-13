"use strict"

function selectRole(role) {
    document.getElementById('selectedRole').value = role;
    document.getElementById('roleDropdown').innerText = role;
}

function showSection(sectionId) {
    var sections = document.querySelectorAll('section');
    sections.forEach(function (section) {
        section.classList.add('hidden');
    });

    var selectedSection = document.getElementById(sectionId);
    selectedSection.classList.remove('hidden');

    document.getElementById("signup-alert").classList.remove("alert-danger");
    document.getElementById("signup-alert").classList.remove("alert-success");
    document.getElementById("signup-alert").innerHTML = "";

    document.getElementById("login-alert").classList.remove("alert-danger");
    document.getElementById("login-alert").innerHTML = "";

    clean_forms();
}

const login_form = document.getElementById("login-form");
const signup_form = document.getElementById("signup-form");

login_form.addEventListener('submit', async (e) => {
    e.preventDefault();

    let messages = [];
    const username = document.getElementById("login_username").value;
    const password = document.getElementById("login_password").value;

    let check_value_of_user = function (str) {
        return /^\d+$/.test(str) || str === "admin";
    }

    if (!check_value_of_user(username))
        messages.push("Το τηλέφωνο πρέπει να αποτελείται μόνο από αριθμούς");

    if (messages.length > 0) {
        document.getElementById("login-alert").classList.remove("alert-danger");

        document.getElementById("login-alert").classList.add("alert-danger");
        document.getElementById("login-alert").innerHTML = messages.join(", ");

        setTimeout(function () {
            document.getElementById("login-alert").classList.remove("alert-danger");
            document.getElementById("login-alert").innerHTML = "";
        }, time_until_a_message_fade_out);
    }
    else {
        let data = {
            "login_username": username,
            "login_password": password
        };

        try {
            const response = await fetch(`http://localhost:${PORT}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            }).then(response => response.json())
                .then(
                    data => {
                        if (data.info == 'SUCCESS')
                            window.location.replace(data.path);
                        else if (data.info == 'FAIL') {
                            document.getElementById("login-alert").classList.add("alert-danger");
                            document.getElementById("login-alert").innerHTML = "Ελέγξτε τα στοιχεία που δώσατε ή κάντε εγγραφή";

                            setTimeout(function () {
                                document.getElementById("login-alert").classList.remove("alert-danger");
                                document.getElementById("login-alert").innerHTML = "";
                            }, time_until_a_message_fade_out);
                        }
                    }
                )
                .catch(error => console.error("Error:", error));

        } catch (error) {
            console.error("Error:" + error);
        }

        clean_forms();

    }
});

signup_form.addEventListener('submit', async (e) => {
    e.preventDefault();

    let messages = [];
    const name = document.getElementById("signup_name").value;
    const username = document.getElementById("signup_username").value;
    const password = document.getElementById("signup_password").value;

    let check_value_of_user = function (str) {
        return /^\d+$/.test(str);
    }

    if (!check_value_of_user(username))
        messages.push("Το τηλέφωνο πρέπει να αποτελείται μόνο από αριθμούς");

    if (messages.length > 0) {
        document.getElementById("signup-alert").classList.remove("alert-danger");
        document.getElementById("signup-alert").classList.remove("alert-success");

        document.getElementById("signup-alert").classList.add("alert-danger");
        document.getElementById("signup-alert").innerHTML = messages.join(", ");

        setTimeout(function () {
            document.getElementById("signup-alert").classList.remove("alert-danger");
            document.getElementById("signup-alert").classList.remove("alert-success");
            document.getElementById("signup-alert").innerHTML = "";
        }, time_until_a_message_fade_out);
    }
    else {

        let userData = {
            "signup_name": name,
            "signup_username": username,
            "signup_password": password,
            "signup_role": "CITIZEN",
            "longtitude": undefined,
            "latitude": undefined
        };

        if (document.getElementById("checkboxLocation").checked) {
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
        else {
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    position => {
                        userData.latitude = position.coords.latitude;
                        userData.longtitude = position.coords.longitude;

                        addUser(userData);
                    },
                    error => {
                        console.error(`Error getting location: ${error.message}`);
                    }
                );
            } else {
                console.error("Geolocation is not supported by your browser");
            }
        }

        clean_forms();
    }
})


