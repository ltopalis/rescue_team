"use strict"

const time_until_a_message_fade_out = 1000 * 60 * 2; // 2 minutes

function init_user(){
    fetch("/Project/PHP/get_warehouse_location.php", {
        method: "POST"
    }).then(response => response.json())
    .then(
        data => {
            user.warehouse_location = { };
            user.warehouse_location.lat = parseFloat(data.lat);
            user.warehouse_location.lng = parseFloat(data.lng);
        }
    )
    .catch(error => console.error("Error:", error));
}

function clean_forms() {
    let signup_form = document.getElementsByClassName("form-control");

    for(let elem of signup_form){
        elem.value = "";
    }
}

function calculate_the_position() {

    // Latitude (North-South):
    // Latitude represents how far north or south a point is from the equator.
    // The Earth's circumference is approximately 40,075 km.
    // Therefore, 1 degree of latitude is approximately 40,075 km / 360 = 111.32km.

    // Longitude (East-West):

    // Longitude represents how far east or west a point is from the prime meridian.
    // The length of a degree of longitude varies with latitude. To account for this, we use cos(latitude) as a correction factor.
    // The formula for converting kilometers to degrees of longitude at a given latitude is radius / (111.32 * cos(latitude))

    // Math.random() generates a random number between 0 and 1.
    // (Math.random() - 0.5) gives a random number between -0.5 and 0.5, providing a random direction.
    // (radius / 111.32) converts the desired radius from kilometers to degrees for latitude.
    // (radius / (111.32 * Math.cos((Math.PI / 180) * center.lat))) converts the desired radius from kilometers to degrees for longitude, considering the latitude of the center point.

    const radius = 50; // in kilometers

    let latitude = user.warehouse_location.lat + (Math.random() - 0.5) * 2 * (radius / 111.32);
    let longtitude = user.warehouse_location.lng + (Math.random() - 0.5) * 2 * (radius / (111.32 * Math.cos((Math.PI / 180) * user.warehouse_location.lat)));

    localStorage.setItem("current_location", JSON.stringify([latitude, longtitude]));
}

function logout(){
    delete user.name;
    delete user.role;
    delete user.warehouse_location;
    delete user.location;

    localStorage.setItem("user", JSON.stringify(user));
    window.location.replace("http://localhost/Project/");
}

