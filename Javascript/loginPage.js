"use strict"

let user = JSON.parse(localStorage.getItem("user"));
if(user.role !== null && user.role !== undefined)
window.location.replace('http://localhost/Project/map.html');

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
}

function submitLogin(){
    const username = document.getElementById("login_username").value;
    const password = document.getElementById("login_password").value;

    let data = new FormData();
    data.append("login_username", username);
    data.append("login_password", password);

    fetch("/Project/PHP/call_check_user.php", {
        method: "POST",
        body: data
    }).then(response => response.json())
    .then(
        data => {
            if(data.info === "UNKNOWN_USER"){
                console.log("UNKNOWN_USER");
            }else if(data.info === "WRONG_USERNAME"){
                console.log("WRONG_USERNAME");
            }else if(data.info === "SUCCESS"){
                user.name = data.name;
                user.role = data.role;
                localStorage.setItem("user", JSON.stringify(user));

                if(user.role === "ADMIN")
                    window.location.replace('http://localhost/Project/adminPage.html');
                else
                    window.location.replace('http://localhost/Project/map.html');
            }else{
                console.log(`Unexpected Error! - ${data.info}`);
            }
        }
    )
    .catch(error => console.error("Error:", error));
}

function submitSignup(){
    const name = document.getElementById("signup_name").value;
    const username = document.getElementById("signup_username").value;
    const password = document.getElementById("signup_password").value;
    const role = document.getElementById("selectedRole").value === "Πολίτης" ? "CITIZEN" : "RESCUER";

    let data = new FormData();
    data.append("signup_name", name);
    data.append("signup_username", username);
    data.append("signup_password", password);

    fetch("/Project/PHP/call_add_user.php", {
        method: "POST",
        body: data
    }).then(response => response.json())
    .then(
        data => {
            // TODO: Μήνυμα σφάλματος ανάλογα με το data
            console.log(data);
        }
    )
    .catch(error => console.error("Error:", error));
}