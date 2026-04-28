var email = "";
if (document.cookie != "")
{
    let details = decodeURIComponent(document.cookie);
    details = details.split(',');
    details = details[0].split(':');
    details = details[2];
    email = details.split("\"")[1];
}

const body_object = {
    email
};

const body_json = JSON.stringify(body_object);

fetch("/users/get_user", { method: "POST", body: body_json, headers: { "Content-Type": "application/json" }})
.then(function(response) {
    return response.json();
})
.then(function(data) {
    var profile = document.getElementById('name');

    profile.innerHTML = `<h1>${data.actFname} ${data.actLname}</h1>`;
});

fetch("/users/get_cards", { method: "POST", body: body_json, headers: { "Content-Type": "application/json" }})
.then(function(response) {
    return response.json();
})
.then(function(data) {
    for(let i = 0; i < data.length; i++)
    {
        var card_list = document.getElementById('payment_info');
        const card = document.createElement('div');
        card.classList.add('saved_card');

        card.innerHTML += `
        <table>
        <tr>
        <th>Card name</th>
        <td>${ data[i].cardName }</td>
        <tr>
        <th>Card Type</th>
        <td>${ data[i].cardType }<td>
        </tr>
        <tr>
        <th>Card Number</th>
        <td>${ data[i].cardNo }</td>
        </tr>
        </table>
        <form action="/users/delete_card/${ data[i].cardName }/${ email }" method="POST">
        <button type="submit" class="btn btn-primary">Delete</button>
        </form>`;

        card_list.append(card);
    }
});

changePass = document.getElementById('changePass');
updatePass = document.getElementById('updatePass');

changePass.addEventListener("click", function (event) {
    passReset.classList.add("visible");
});

updatePass.addEventListener("click", async function (event) {
    var newPass = document.getElementById('newPass').value.trim();

    const error = document.getElementById('error1');
    error.classList.remove('visible');

    if(newPass === ""){
        error.classList.add('visible');
        return;
    }

    const body_object = {
        newPass,
        email
    };

    const body_json = JSON.stringify(body_object);

    const response = await fetch("/users/update_pass",{ method: "POST", body: body_json, headers: { "Content-Type": "application/json" } });

    passReset.classList.remove("visible");
});

add_card = document.getElementById('add_card');
cardSubmit = document.getElementById('cardSubmit');

add_card.addEventListener("click", function (event) {
    inputCard.classList.add("visible");
});

cardSubmit.addEventListener("click", async function (event) {
    var cardName = document.getElementById('cardName').value.trim();
    var cardType = document.getElementById('cardType').value.trim();
    var cardNo = document.getElementById('cardNo').value.trim();
    var cardExp = document.getElementById('cardExp').value.trim();

    const error = document.getElementById('error2');
    error.classList.remove('visible');

    if(cardName === ""){
        error.classList.add('visible');
        return;
    }
    if(cardType === ""){
        error.classList.add('visible');
        return;
    }
    if(cardNo === ""){
        error.classList.add('visible');
        return;
    }
    if(cardExp === ""){
        error.classList.add('visible');
        return;
    }

    const body_object = {
        cardName,
        cardType,
        cardNo,
        cardExp,
        email
    };

    const body_json = JSON.stringify(body_object);

    const response = await fetch("/users/add_card",{ method: "POST", body: body_json, headers: { "Content-Type": "application/json" } });

    inputCard.classList.remove("visible");
});
