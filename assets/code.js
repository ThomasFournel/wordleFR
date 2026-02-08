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

async function correctWordCheck(word) {
    const demand = await fetch(`https://freedictionaryapi.com/api/v1/entries/fr/${word}`);
    const response = await demand.json();
    return response;
}

function checkWord(word, row) {
    //transforme les inputs en div
    row.querySelector(".loadingIcon").querySelector("span").remove();
    gameData.loading = false;

    const tiles = [...row.querySelectorAll(".tile")];
    word = toNormalForm(word.toLowerCase());

    //check du mot
    if (word == gameData.word) {
        tiles.forEach((tile) => {
            tile.className = "tile green";
        });
        row.querySelector("input").remove();
        setTimeout(() => {
            alert("Victoire :D");
            location.reload()
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
                const keyElem = keyBoardElem.querySelector(`#${letter.toUpperCase()}`);
                if (!keyElem.classList.contains("green")) {
                    keyElem.classList = "key green";
                }
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
                const keyElem = keyBoardElem.querySelector(`#${letter.toUpperCase()}`);
                if (!(keyElem.classList.contains("yellow") || keyElem.classList.contains("green"))) {
                    keyElem.classList = "key yellow";
                }
                correctWord.splice(
                    correctWord.findIndex((test) => {
                        return test == letter;
                    }),
                    1,
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
        row.querySelector("input").remove();
        createRow();
    }
}

function enterWord(elem) {
    console.log("Envoyé");
    gameData.loading = true;

    const row = elem.parentElement;
    let word = elem.value;

    if (word.length == gameData.letterCount) {
        row.querySelector("span").className = "loadingIcon";

        correctWordCheck(word).then((response) => {
            if (response.entries && response.entries.length > 0) {
                //correct
                checkWord(word, row);
            } else {
                //incorrect
                row.querySelector("span").className = "";
                gameData.loading = false;
                row.className = "row error";
                setTimeout(() => {
                    row.className = "row";
                }, 400);
            }
        });
    } else {
        console.warn("pas bonne taille");
        gameData.loading = false;
        row.className = "row error";
        setTimeout(() => {
            row.className = "row";
        }, 400);
    }
}

function updateRowTiles(row) {
    const tileList = [...row.querySelectorAll(".tile")];
    const input = row.querySelector("input");
    const entry = input.value.split("");
    for (let i = 0; i < tileList.length; i++) {
        tileList[i].innerText = i < entry.length ? entry[i] : "";
    }
}

function createRow() {
    const row = document.createElement("div");
    row.className = "row";

    boardElem.appendChild(row);

    const input = document.createElement("input");
    input.type = "text";
    // input.style.display = "none";
    input.inputMode = "text";
    input.maxLength = `${gameData.letterCount}`;

    input.addEventListener("keyup", (e) => {
        if (e.key == "Enter") {
            enterWord(input);
        } else {
            updateRowTiles(row);
        }
    });
    row.appendChild(input);
    row.addEventListener("click", () => {
        console.log("click");
        input.focus();
    });

    for (x = 0; x < gameData.letterCount; x++) {
        const tile = document.createElement("div");
        tile.className = "tile";
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
        document.getElementById("help").innerHTML = `Catégories du mot : <i>${help}</i>`;
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
            const input = boardElem.querySelector("input");
            input.value = input.value.slice(0, -1);
            updateRowTiles(input.parentElement);
        });
    } else {
        key.addEventListener("click", () => {
            const input = boardElem.querySelector("input");
            input.value += key.id;
            updateRowTiles(input.parentElement);
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
