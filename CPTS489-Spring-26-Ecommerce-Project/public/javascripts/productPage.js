const review_submit = document.getElementById("review_submit");
const input_review = document.getElementById("input_review");
const btnReview = document.getElementById("btnReview");
const stars = document.querySelectorAll('.star');
var rating = 0;

var email = "";

if (document.cookie != "")
{
    let details = decodeURIComponent(document.cookie);
    details = details.split(',');
    details = details[0].split(':');
    details = details[2];
    email = details.split("\"")[1];
}

const url = window.location.href;
const split_url = url.split('/');
const id = split_url[4];

const body_object = {
    id
};

const body_json = JSON.stringify(body_object);

fetch("/productPage/getReviews", { method: "POST", body: body_json, headers: { "Content-Type": "application/json" }})
.then(function(response) {
    return response.json();
})
.then(function(data) {
    for(let i = 0; i < data.length; i++)
    {
        const reviewList = document.getElementById('productReviews')
        const review = document.createElement('div');
        review.classList.add('review');

        review.innerHTML += `
        <div class="revTitle">
        <div>
        <h2>${data[i].revTitle}</h1>`;

        if(data[i].revRating > 0)
            review.innerHTML += `<span class="star selected">★</span>`;
        else
            review.innerHTML += `<span class="star">★</span>`;
        if(data[i].revRating > 1)
            review.innerHTML += `<span class="star selected">★</span>`;
        else
            review.innerHTML += `<span class="star">★</span>`;
        if(data[i].revRating > 2)
            review.innerHTML += `<span class="star selected">★</span>`;
        else
            review.innerHTML += `<span class="star">★</span>`;
        if(data[i].revRating > 3)
            review.innerHTML += `<span class="star selected">★</span>`;
        else
            review.innerHTML += `<span class="star">★</span>`;
        if(data[i].revRating > 4)
            review.innerHTML += `<span class="star selected">★</span>`;
        else
            review.innerHTML += `<span class="star">★</span>`;

        review.innerHTML += `
        </div>
        <p>${data[i].revDesc}</p>`;

        reviewList.append(review)
    }
});

stars.forEach((star, index) => {
    star.addEventListener('click', () => {
        stars.forEach((s, i) => {
            s.classList.toggle('selected', i <= index);
            rating = index + 1;
        });
    });
});

btnReview.addEventListener("click", function (event) {
    input_review.classList.add("visible");
});

review_submit.addEventListener("click", async function (event) {
    var title = document.getElementById('review_header').value.trim();
    var desc = document.getElementById('review_body').value.trim();
    const error = document.getElementById('error');
    error.classList.remove('visible');

    if(title === ""){
        error.classList.add('visible');
        return;
    }
    if(desc === ""){
        error.classList.add('visible');
        return;
    }
    if(rating === 0){
        error.classList.add('visible');
        return;
    }

    const body_object = {
        rating,
        title,
        desc,
        email,
        id
    };

    const body_json = JSON.stringify(body_object);

    const response = await fetch("/productPage/review",{ method: "POST", body: body_json, headers: { "Content-Type": "application/json" } });

    input_review.classList.remove("visible");
});
