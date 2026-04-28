const enterCard = document.getElementById("enterCard");
const useCard   = document.getElementById("useCard");

// Toggle between panels
document.getElementById("useCardBtn").addEventListener("click", function () {
    enterCard.classList.remove("visible");
    useCard.classList.add("visible");
});

document.getElementById("enterCardBtn").addEventListener("click", function () {
    useCard.classList.remove("visible");
    enterCard.classList.add("visible");
});

// Validate new card form before submitting to reviewOrder
document.getElementById("newCardForm").addEventListener("submit", function (event) {
    const fname      = document.getElementById("fname").value.trim();
    const lname      = document.getElementById("lname").value.trim();
    const card       = document.getElementById("card").value.trim();
    const experation = document.getElementById("experation").value.trim();
    const cvv        = document.getElementById("cvv").value.trim();
    const error      = document.getElementById("error");

    error.classList.remove("visible");

    let isValid = true;
    if (!fname)                  isValid = false;
    if (!lname)                  isValid = false;
    if (card.length !== 16)      isValid = false;
    if (experation.length !== 5) isValid = false;
    if (cvv.length !== 3)        isValid = false;

    if (!isValid) {
        event.preventDefault();
        error.classList.add("visible");
    }
});

// Validate saved card form before submitting to reviewOrder
document.getElementById("savedCardForm").addEventListener("submit", function (event) {
    const cardSelect = document.getElementById("cardSelect").value;
    const cvv        = document.getElementById("cvv2").value.trim();
    const error      = document.getElementById("error2");

    error.classList.remove("visible");

    // Copy selected card into hidden field so server receives it
    document.getElementById("savedCardValue").value = cardSelect;

    if (!cardSelect || cvv.length !== 3) {
        event.preventDefault();
        error.classList.add("visible");
    }
});