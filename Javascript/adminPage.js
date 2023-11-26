"use strict"

let user = JSON.parse(localStorage.getItem("user"));
if(user.role === null || user.role === undefined)
    window.location.replace('http://localhost/Project/');
else if(user.role !== "ADMIN")
    alert("Δεν έχετε πρόσβαση σε αυτήν την σελίδα!");

function addRescuer(){
    const phone = document.getElementById("rescuer_telephone").value;
    const password = document.getElementById("rescuer_password").value;
    const name = document.getElementById("rescuer_name").value;

    let data = new FormData();
    data.append("phone", phone);
    data.append("password", password);
    data.append("name", name);

    fetch("/Project/PHP/addRescuer.php", {
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



    console.log(phone, password, name);
}

function logout(){
    delete user.name;
    delete user.role;
    localStorage.setItem("user", JSON.stringify(user));
    window.location.replace("http://localhost/Project/");
}