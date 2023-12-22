"use strict"

let user = JSON.parse(localStorage.getItem("user")) || { };
if(user.role === null || user.role === undefined)
    window.location.replace('../index.html');
else if(user.role !== "ADMIN")
    alert("Δεν έχετε πρόσβαση σε αυτήν την σελίδα!");

const add_rescuer_form = document.getElementById("add-rescuer-form");

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
        
        const location = calculate_the_position();

        let data = new FormData();
        data.append("phone", phone);
        data.append("password", password);
        data.append("name", name);
        data.append("longtitude", location[1]);
        data.append("latitude", location[0]);

        fetch("/Project/PHP/addRescuer.php", {
            method: "POST",
            body: data
        }).then(response => response.json())
        .then(
            data => {
                document.getElementById("add-rescuer-alert").classList.remove("alert-danger");
                document.getElementById("add-rescuer-alert").classList.remove("alert-success");
                switch(data){
                    case "SUCCESS":
                        document.getElementById("add-rescuer-alert").classList.add("alert-success");
                        document.getElementById("add-rescuer-alert").innerHTML = "Η εγγραφή πραγματοποιήθηκε με επιτυχία!";
                        
                        for(let elem of add_rescuer_form.elements)
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
                setTimeout( function() {
                    document.getElementById("add-rescuer-alert").classList.remove("alert-danger");
                    document.getElementById("add-rescuer-alert").classList.remove("alert-success");
                    document.getElementById("add-rescuer-alert").innerHTML = "";
                }, time_until_a_message_fade_out);
            }
        )
        .catch(error => console.error("Error:", error));
    }
});