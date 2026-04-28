document.getElementById('item_image').addEventListener('change', function () {
    const file = this.files[0];
    if (!file) return;

    const container = document.getElementById('selectedImg');
    const reader = new FileReader();
    reader.onload = function (e) {
        container.innerHTML = `<img class="imgFit" src="${e.target.result}">`;
    };
    reader.readAsDataURL(file);
});

document.getElementById('productsubmit').addEventListener('click', async function (event) {
    var name = document.getElementById('item_name').value.trim();
    var price = document.getElementById('item_price').value.trim();
    var quantity = document.getElementById('item_quantity').value.trim();
    var desc = document.getElementById('item_desc').value.trim();
    var imageFile = document.getElementById('item_image').files[0];

    var email = "";
    if (document.cookie !== "") {
        let details = decodeURIComponent(document.cookie);
        details = details.split(',');
        details = details[0].split(':');
        details = details[2];
        email = details.split('"')[1];
    }

    const error = document.getElementById('error');
    error.classList.remove('visible');

    if (!name)     { error.classList.add('visible'); return; }
    if (!price)    { error.classList.add('visible'); return; }
    if (!quantity) { error.classList.add('visible'); return; }
    if (!desc)     { error.classList.add('visible'); return; }
    if (!imageFile){ error.classList.add('visible'); return; }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('price', price);
    formData.append('quantity', quantity);
    formData.append('desc', desc);
    formData.append('email', email);
    formData.append('image', imageFile);

    const response = await fetch('/createListing', {
        method: 'POST',
        body: formData
    });

    if (response.redirected) {
        window.location.href = response.url;
    }
});