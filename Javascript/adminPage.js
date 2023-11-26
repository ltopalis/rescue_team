"use strict"

let user = JSON.parse(localStorage.getItem("user")) | { };
if(user.role === null || user.role === undefined)
    window.location.replace('http://localhost/Project/');
else if(user.role !== "ADMIN")
    alert("Δεν έχετε πρόσβαση σε αυτήν την σελίδα!");

const add_rescuer_form = document.getElementById("add-rescuer-form");

add_rescuer_form.addEventListener("submit", (e) => {
    e.preventDefault();

    console.log("INSIDE");

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
    }
    else{
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
                document.getElementById("add-rescuer-alert").classList.add("alert-danger");
                document.getElementById("add-rescuer-alert").classList.remove("alert-success");
                switch(data){
                    case "SUCCESS":
                        document.getElementById("add-rescuer-alert").classList.add("alert-success");
                        document.getElementById("add-rescuer-alert").innerHTML = "Η εγγραφή πραγματοποιήθηκε με επιτυχία!";
                        
                        for(let elem of signup_form.elements)
                            elem.value = "";
                        break;
                    case "DUPLICATE_ENTRY":
                        document.getElementById("add-rescuer-alert").classList.add("alert-danger");
                        document.getElementById("add-rescuer-alert").innerHTML = "Ο χρήστης υπάρχει ήδη! Πραγματοποιήστε σύνδεση";
                        break;
                    case "UNEXPECTED_ERROR":
                        document.getElementById("add-rescuer-alert").classList.add("alert-danger");
                        document.getElementById("add-rescuer-alert").innerHTML = "Συνέβη κάποιο σφάλμα. Προσπαθήστε ξανά";
                        break;
                }
            }
        )
        .catch(error => console.error("Error:", error));
    }
});

function logout(){
    delete user.name;
    delete user.role;
    localStorage.setItem("user", JSON.stringify(user));
    window.location.replace("http://localhost/Project/");
}