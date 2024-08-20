"use strict"

pageAccess("CITIZEN");

const products = [];
const resultsBox = document.querySelector(".result-box");
const inputBox = document.getElementById('input-box');
const productCardContainer = document.getElementById('product-card');

fetch(`http://localhost:${PORT}/citizen/initRequestPage`, {
    method: "GET",
    headers: {
        'Content-type': 'application/json'
    }

}).then(response => response.json())
    .then(data => {

        for (let prod of data)
            products.push({
                id: prod.ID,
                category: prod.CATEGORY,
                name: prod.PRODUCT_NAME,
                details: prod.details
            });

        products.sort((a, b) => a.name.localeCompare(b.name));
    });

function initSearchReasultBox() {
    console.log(products);
}

inputBox.onkeyup = function () {
    let result = [];
    let input = inputBox.value;

    if (input.length) {
        result = products.filter(keyword => {
            return keyword.name.toLowerCase().includes(input.toLowerCase()) || keyword.category.toLowerCase().includes(input.toLowerCase());
        });
    }
    display(result);
}

function display(result) {

    resultsBox.innerHTML = '';
    productCardContainer.innerHTML = '';

    if (!result.length) return;

    const ulElement = document.createElement("ul");

    result.forEach(element => {
        const liElement = document.createElement('li');
        liElement.textContent = `${element.name}, ${element.category}`;
        liElement.addEventListener("click", () => selectProduct(element))
        ulElement.appendChild(liElement);
    });

    resultsBox.appendChild(ulElement);

}

function selectProduct(prod) {
    inputBox.value = `${prod.name}, ${prod.category}`;
    resultsBox.innerHTML = '';
    productCardContainer.innerHTML = '';

    const productCard = document.createElement('div');
    productCard.classList.add('card');

    if (prod) {
        const cardBody = document.createElement('div');
        cardBody.classList.add('card-body');

        const cardTitle = document.createElement('h5');
        cardTitle.classList.add('card-title');
        cardTitle.innerText = prod.name;

        const cardSubtitle = document.createElement('h6');
        cardSubtitle.classList.add('card-subtitle');
        cardSubtitle.classList.add('mb-2');
        cardSubtitle.classList.add('text-muted');
        cardSubtitle.innerText = prod.category;

        cardBody.appendChild(cardTitle);
        cardBody.appendChild(cardSubtitle);

        productCard.appendChild(cardBody);

        const ulElement = document.createElement('ul');
        ulElement.classList.add('list-group');
        ulElement.classList.add('list-group-flush');

        for (let detail of prod.details) {
            const liElement = document.createElement("li");
            liElement.classList.add('list-group-item');
            liElement.innerText = `${detail.name}: ${detail.value}`;

            ulElement.appendChild(liElement);
        }

        productCard.appendChild(ulElement);


        const numberOfPeopleDiv = document.createElement('div');
        numberOfPeopleDiv.classList.add("input-group");
        numberOfPeopleDiv.classList.add('mb-3');

        const numberOfPeopleTF = document.createElement('input');
        numberOfPeopleTF.type = 'number';
        numberOfPeopleTF.min = 0;
        numberOfPeopleTF.placeholder = 'Πλήθος ατόμων';
        numberOfPeopleTF.id = 'numberOfPeopleTF';

        const addRequestButton = document.createElement('button');
        addRequestButton.classList.add("btn");
        addRequestButton.classList.add('btn-info');
        addRequestButton.type = 'button';
        addRequestButton.innerText = 'Ζητήστε';
        addRequestButton.addEventListener('click', async () => {
            if (document.getElementById("numberOfPeopleTF").value)
                await fetch(`http://localhost:${PORT}/citizen/createTask`, {
                    method: "POST",
                    headers: {
                        'Content-type': 'application/json'
                    },
                    body: JSON.stringify({
                        type: 'request',
                        products: [{
                            product: prod.id,
                            amount: document.getElementById("numberOfPeopleTF").value
                        }]
                    })
                }).then(response => {
                    if (response.status == 200) {
                        resultsBox.innerHTML = '';
                        productCardContainer.innerHTML = '';
                        inputBox.value = '';

                        alert('Επιτυχής προσθήκη αίτησης');
                    }
                });
        });

        numberOfPeopleDiv.appendChild(numberOfPeopleTF);
        numberOfPeopleDiv.appendChild(addRequestButton);

        productCard.appendChild(numberOfPeopleDiv);

        productCardContainer.appendChild(productCard);
    }

}