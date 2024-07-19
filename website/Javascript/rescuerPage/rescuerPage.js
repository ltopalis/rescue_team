"use strict"

let user = JSON.parse(localStorage.getItem("user")) || { };
if(user.role === null || user.role === undefined)
    window.location.replace('../index.html');
else if(user.role !== "RESCUER")
    alert("Δεν έχετε πρόσβαση σε αυτήν την σελίδα!");