const enterCard = document.getElementById("enterCard");
const useCard = document.getElementById("useCard");
const useCardBtn = document.getElementById("useCardBtn");
const enterCardBtn = document.getElementById("enterCardBtn");

useCardBtn.addEventListener("click", function (event) {
    enterCard.classList.remove('visible');
    useCard.classList.add('visible');
})

enterCardBtn.addEventListener("click", function (event) {
    enterCard.classList.add('visible');
    useCard.classList.remove('visible');
})

const btnSubmit = document.getElementById("btnSubmit");

btnSubmit.addEventListener("click", async function (event) {

    const fname = document.getElementById("fname").value;
    const lname = document.getElementById("lname").value;
    const card = document.getElementById("card").value;
    const experation = document.getElementById("experation").value;
    const cvv = document.getElementById("cvv").value;

    const error = document.getElementById("error");

    error.classList.remove("visible");

    let isValid = true;

    if (fname === ""){
        isValid = false;
    }

    if (lname === ""){
        isValid = false;
    }

    if (card.length != 16){
        isVaid = false;
    }

    if (experation.length != 5){
        isVaid = false;
    }

    if (cvv.length != 3){
        isVaid = false;
    }

    if (!isValid){
        event.preventDefault();
        error.classList.add("visible");
        return;
    }
});

const btnSubmit2 = document.getElementById("btnSubmit2");

btnSubmit2.addEventListener("click", async function (event) {

    const card = document.getElementById("cardSelect").value;
    const cvv = document.getElementById("cvv2").value;

    const error = document.getElementById("error2");

    error.classList.remove("visible");

    if (card === ""){
        event.preventDefault();
        error.classList.add("visible");
        return;
    }
    if (cvv.length != 3){
        event.preventDefault();
        error.classList.add("visible");
        return;
    }
});
