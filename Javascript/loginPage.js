"use strict"

// Κάτι σαν κλάση, αλλά δεν είναι κλάση. Είναι σαν-κλάση(-ει)
// let user = { };

const tooltips = document.querySelectorAll(".tt");
        tooltips.forEach(t => {
            new bootstrap.Tooltip(t);
        })

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

// document.getElementById("login-form").addEventListener('submit', (event) => {
//     event.preventDefault();

//     user.username = document.getElementById("name").value;
//     user.password = document.getElementById("password").value;

//     console.log(user.username, user.password);

// })


// $.ajax({
//     url: 'mysql.php',
//     success: function(data) {
//         user.name = data.name;
//         user.role = data.role;
//         let info = data.info;
//     }
// })
