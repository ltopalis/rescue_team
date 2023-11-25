"use strict"

if(user.role === null || user.role === undefined)
    window.location.replace('http://localhost/Project/');

if(user.role !== "ADMIN")
    alert("Δεν έχετε πρόσβαση σε αυτήν την σελίδα!");

function logout(){
    delete user.name;
    delete user.role;
    localStorage.setItem("user", JSON.stringify(user));
    window.location.replace("http://localhost/Project/");
}