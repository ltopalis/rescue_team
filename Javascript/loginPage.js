"use strict"

let user = JSON.parse(localStorage.getItem("user")) || { };

init_user();

if(user.role === "ADMIN")
    window.location.replace('/Project/adminPage.html');
else if(user.role !== null && user.role !== undefined)
    window.location.replace('/Project/map.html');

function selectRole(role) {
    document.getElementById('selectedRole').value = role;
    document.getElementById('roleDropdown').innerText = role;
}

function showSection(sectionId) {
    var sections = document.querySelectorAll('section');
    sections.forEach(function(section) {
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

const login_form  = document.getElementById("login-form");
const signup_form  = document.getElementById("signup-form");

login_form.addEventListener('submit', (e) => {
    e.preventDefault();

    let messages = [];
    const username = document.getElementById("login_username").value; 
    const password = document.getElementById("login_password").value;

    let check_value_of_user = function (str) {
            return /^\d+$/.test(str) || str === "admin";
    }

    if(!check_value_of_user(username))
        messages.push("Το τηλέφωνο πρέπει να αποτελείται μόνο από αριθμούς");
    
    if(messages.length > 0){
        document.getElementById("login-alert").classList.remove("alert-danger");

        document.getElementById("login-alert").classList.add("alert-danger");
        document.getElementById("login-alert").innerHTML = messages.join(", ");

        setTimeout( function() {
            document.getElementById("login-alert").classList.remove("alert-danger");
            document.getElementById("login-alert").innerHTML = "";
        }, time_until_a_message_fade_out);
    }
    else{
        let data = new FormData();
        data.append("login_username", username);
        data.append("login_password", password);

        fetch("/Project/PHP/call_check_user.php", {
            method: "POST",
            body: data
        }).then(response => response.json())
        .then(
            data => {
                document.getElementById("login-alert").classList.remove("alert-danger");
                if(data.info === "UNKNOWN_USER"){
                    document.getElementById("login-alert").classList.add("alert-danger");
                    document.getElementById("login-alert").innerHTML = "Ο χρήστης δεν υπάρχει! Πραγματοποιήστε εγγραφή."
                }else if(data.info === "WRONG_USERNAME" || data.info === "WRONG_PASSWORD"){
                    document.getElementById("login-alert").classList.add("alert-danger");
                    document.getElementById("login-alert").innerHTML = "Τα στοιχεία που δώσατε είναι λανθασμένα"
                }else if(data.info === "SUCCESS"){
                    user.name = data.name;
                    user.role = data.role;
                    user.location = { };
                    user.location.lat = parseFloat(data.latitude);
                    user.location.lng = parseFloat(data.longtitude);
                    user.warehouse_location = { };
                    user.warehouse_location.lat = parseFloat(data.warehouse_lat);
                    user.warehouse_location.lng = parseFloat(data.warehouse_lng);
                    localStorage.setItem("user", JSON.stringify(user));

                    if(user.role === "ADMIN")
                        window.location.replace('http://localhost/Project/adminPage.html');
                    else
                        window.location.replace('http://localhost/Project/map.html');
                }else{
                    document.getElementById("login-alert").classList.add("alert-danger");
                    document.getElementById("login-alert").innerHTML = "Προκλήθηκε σφάλμα. Ξαναπροσπαθήστε."
                    console.log(`Unexpected Error! - ${data.info}`);
                }

                setTimeout( function() {
                    document.getElementById("login-alert").classList.remove("alert-danger");
                    document.getElementById("login-alert").innerHTML = "";
                }, time_until_a_message_fade_out);
            }
        )
        .catch(error => console.error("Error:", error));
        
        clean_forms();
        
    }
});

signup_form.addEventListener('submit', (e) => {
    e.preventDefault();

    let messages = [];
    const name = document.getElementById("signup_name").value;
    const username = document.getElementById("signup_username").value;
    const password = document.getElementById("signup_password").value;

    let check_value_of_user = function (str) {
        return /^\d+$/.test(str);
    }

    if(!check_value_of_user(username))
    messages.push("Το τηλέφωνο πρέπει να αποτελείται μόνο από αριθμούς");

    if(messages.length > 0){
        document.getElementById("signup-alert").classList.remove("alert-danger");
        document.getElementById("signup-alert").classList.remove("alert-success");
        
        document.getElementById("signup-alert").classList.add("alert-danger");
        document.getElementById("signup-alert").innerHTML = messages.join(", ");

        setTimeout( function() {
            document.getElementById("signup-alert").classList.remove("alert-danger");
        document.getElementById("signup-alert").classList.remove("alert-success");
            document.getElementById("signup-alert").innerHTML = "";
        }, time_until_a_message_fade_out);
    }
    else {
        const location = calculate_the_position();

        let data = new FormData();
        data.append("signup_name", name);
        data.append("signup_username", username);
        data.append("signup_password", password);
        data.append("longtitude", location[1]);
        data.append("latitude", location[0]);

        fetch("/Project/PHP/call_add_user.php", {
            method: "POST",
            body: data
        }).then(response => response.json())
        .then(
            data => {
                document.getElementById("signup-alert").classList.remove("alert-danger");
                document.getElementById("signup-alert").classList.remove("alert-success");
                switch(data){
                    case "SUCCESS":
                        document.getElementById("signup-alert").classList.add("alert-success");
                        document.getElementById("signup-alert").innerHTML = "Η εγγραφή πραγματοποιήθηκε με επιτυχία!";
                        for(let elem of signup_form.elements)
                            elem.value = "";
                        break;
                    case "DUPLICATE_ENTRY":
                        document.getElementById("signup-alert").classList.add("alert-danger");
                        document.getElementById("signup-alert").innerHTML = "Ο χρήστης υπάρχει ήδη! Πραγματοποιήστε σύνδεση";
                        break;
                    case "UNEXPECTED_ERROR":
                        document.getElementById("signup-alert").classList.add("alert-danger");
                        document.getElementById("signup-alert").innerHTML = "Συνέβη κάποιο σφάλμα. Προσπαθήστε ξανά";
                        break;
                }
                
                setTimeout( function() {
                    document.getElementById("signup-alert").classList.remove("alert-danger");
                    document.getElementById("signup-alert").classList.remove("alert-success");
                    document.getElementById("signup-alert").innerHTML = "";
                }, time_until_a_message_fade_out);
            }
        )
        .catch(error => console.error("Error:", error));

        clean_forms();
    }
})
