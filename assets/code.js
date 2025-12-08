let gameData = {
    word: "",
    letterCount: 0,
    usedLetters: [],
    loading: false,
};

const menuElem = document.getElementById("menu");
const subTitle = document.querySelector("h2");
const boardElem = document.getElementById("board");
const keyBoardElem = document.getElementById("keyBoard");

function toNormalForm(word) {
    return word.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

async function randomWord(letterCount = 0) {
    const demand =
        letterCount > 0
            ? await fetch(`https://trouve-mot.fr/api/size/${letterCount}`)
            : await fetch(`https://trouve-mot.fr/api/random`);

    const response = await demand.json();
    return response[0];
}

async function dailyWord() {
    const demand = await fetch("https://trouve-mot.fr/api/daily");
    const response = await demand.json();
    return response;
}

async function laRousseCheck(word) {
    const response = await fetch(
        `https://www.larousse.fr/dictionnaires/francais/${word}`
    );
    return response;
}

function rowClick() {
    //find lastChild with text
    const childrenList = [...this.children];
    const emptyList = childrenList.filter((elem) => {
        return elem.value == "";
    });
    if (emptyList.length > 0) {
        emptyList[0].focus();
    } else {
        childrenList[childrenList.length - 1].focus();
    }
}

function checkWord(word, elem) {
    //transforme les inputs en div
    const row = elem.parentElement;
    row.querySelector(".loadingIcon").querySelector("span").remove();
    gameData.loading = false;
    let html = row.innerHTML;
    html = html.replaceAll("<input", "<div");
    html = html.replaceAll(">", "></div>");
    row.innerHTML = html;

    const tiles = [...row.children];
    tiles.pop();
    tiles.forEach((tile, i) => {
        tile.innerText = word[i];
    });

    word = toNormalForm(word.toLowerCase());

    //check du mot
    if (word == gameData.word) {
        tiles.forEach((tile) => {
            tile.className = "tile green";
        });
        setTimeout(() => {
            alert("Victoire :D");
        }, 500);
    } else {
        let correctWord = gameData.word.split("");
        let correctIndexes = [];
        let guess = word.split("");
        //calcul si les lettres sont correctes ou non

        // lettres verte
        guess.forEach((letter, i) => {
            if (correctWord[i] == letter) {
                correctIndexes.push(i);
                tiles[i].className = "tile green";
            }
        });

        // retire les lettres vert du correctWord et guess
        let amountSpliced = 0;
        correctIndexes.forEach((i) => {
            correctWord.splice(i - amountSpliced, 1);
            guess.splice(i - amountSpliced, 1);
            tiles.splice(i - amountSpliced, 1);
            amountSpliced++;
        });

        // lettres Jaune et grise
        guess.forEach((letter) => {
            if (correctWord.includes(letter)) {
                console.log("yellow");
                // retire les lettres jaune du correctWord
                tiles[
                    guess.findIndex((test) => {
                        return test == letter;
                    })
                ].className = "tile yellow";
                correctWord.splice(
                    correctWord.findIndex((test) => {
                        return test == letter;
                    }),
                    1
                );
            }
        });

        //mettre les tile restantes en gray
        tiles.forEach((tile) => {
            if (tile.className == "tile") {
                tile.className = "tile gray";
                const letter = tile.innerText.toLowerCase();
                if (
                    gameData.word.split("").find((test) => {
                        return test == letter;
                    }) === undefined &&
                    gameData.usedLetters.find((test) => {
                        return test == letter;
                    }) === undefined
                ) {
                    gameData.usedLetters.push(letter);
                    const elem = keyBoardElem.querySelector("#" + letter.toUpperCase());
                    elem.classList.add("black");
                }
            }
        });

        //nouvelle ligne
        createRow();
    }
}

function enterWord(elem) {
    console.log("Envoyé");
    gameData.loading = true;

    const parent = elem.parentElement;
    const childrenList = [...parent.children];
    childrenList.pop();

    let word = "";
    childrenList.forEach((elem) => {
        word += elem.value;
    });

    if (word.length == gameData.letterCount) {
        parent.querySelector("span").className = "loadingIcon";
        // check avec larousse.fr, si l'url de la page se termine par un chiffre c bon
        laRousseCheck(word).then((response) => {
            if (!isNaN(response.url[response.url.length - 1])) {
                //correct
                checkWord(word, elem);
            } else {
                //incorrect
                parent.querySelector("span").className = "";
                gameData.loading = false;
                console.warn(response);
                parent.className = "row error";
                setTimeout(() => {
                    parent.className = "row";
                }, 400);
            }
        });
    } else {
        console.warn("pas bonne taille");
        gameData.loading = false;
        parent.className = "row error";
        setTimeout(() => {
            parent.className = "row";
        }, 400);
    }
}

function tileKeyUp(userInput) {
    //keycode des lettres = 49-90
    if (49 <= userInput.keyCode && userInput.keyCode <= 90) {
        const parent = this.parentElement;
        const childrenList = [...parent.children];
        childrenList.pop();
        const emptyList = childrenList.filter((elem) => {
            return elem.value == "";
        });
        if (emptyList.length > 0) {
            emptyList[0].focus();
        }
    } else if (userInput.key == "Enter" && !gameData.loading) {
        enterWord(this);
    }
}

function suppr(elem) {
    if (elem.value == "") {
        const fullList = [...elem.parentElement.children].filter((elem) => {
            return elem.value != "";
        });
        if (fullList.length > 0) {
            fullList[fullList.length - 1].value = "";
            fullList[fullList.length - 1].focus();
        }
    } else {
        elem.value = ""
    }
}

function createRow() {
    const row = document.createElement("div");
    row.className = "row";
    row.addEventListener("click", rowClick);

    boardElem.appendChild(row);

    for (x = 0; x < gameData.letterCount; x++) {
        const tile = document.createElement("input");
        tile.className = "tile";
        tile.type = "text";
        tile.inputMode = "text";
        tile.maxLength = "1";

        tile.addEventListener("keydown", function(userInput) {
            if (userInput.key == "Backspace") {
                suppr(this)
            }
        });
        tile.addEventListener("keyup", tileKeyUp);

        row.appendChild(tile);
    }

    const load = document.createElement("span");
    load.appendChild(document.createElement("span"));
    row.appendChild(load);

    window.scrollTo(0, window.scrollY + window.screenY);
}

async function newGame(letterCount = 0, isDaily = false) {
    let answer;
    if (letterCount > 0) {
        answer = await randomWord(letterCount);
    } else if (isDaily) {
        answer = await dailyWord();
    } else {
        return;
    }
    gameData.word = toNormalForm(answer.name);
    gameData.letterCount = gameData.word.length;
    gameData.usedLetters = [];
    gameData.loading = false;

    if (menuElem.querySelector("#showInfo").checked) {
        const help = answer.categorie.toLowerCase().replaceAll(" –", ",");
        document.getElementById(
            "help"
        ).innerHTML = `Catégories du mot : <i>${help}</i>`;
    }
    keyBoardElem.style.display = "flex";
    boardElem.style.display = "flex";

    //console.log(gameData);
    createRow();
}
//newGame(5);

// visual Keyboard Interaction
keyBoardElem.querySelectorAll(".key").forEach((key) => {
    if (key.id == "enter") {
        key.addEventListener("click", () => {
            enterWord(boardElem.querySelector("input"));
        });
    } else if (key.id == "suppr") {
        key.addEventListener("click", () => {
            const list = boardElem.querySelectorAll("input");
            suppr(list[list.length - 1]);
        });
    } else {
        key.addEventListener("click", function () {
            const row = boardElem.querySelector("input").parentElement;
            const emptyList = [...row.children].filter((elem) => {
                return elem.value == "";
            });
            if (emptyList.length > 0) {
                emptyList[0].value = this.id;
            }
        });
    }
});

menuElem.querySelector("#start").onclick = function () {
    menuElem.style.display = "none";
    newGame(menuElem.querySelector("#letterCount").value);
    subTitle.innerText = "Mot aléatoire";
};

menuElem.querySelector("#daily").onclick = function () {
    menuElem.style.display = "none";
    newGame(0, true);
    subTitle.innerText = "Mot journalier";
};
