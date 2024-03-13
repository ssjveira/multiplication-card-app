'use strict'

// Constants
const animationDuration = 400;
const synth = window.speechSynthesis;

/**
 * Randomly shuffles an array.
 * 
 * @param {*} array 
 * 
 * @note Taken from here: https://javascript.plainenglish.io/how-to-shuffle-a-javascript-array-1357eed1680f
 */
const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

const createMultiplicationTables = () => {
    let multiplicationTables = {};
    
    for(let i = 1; i <= 12; ++i) {
        let mulTable = [];
        for(let j = 0; j<= 12; ++j) {
            let tableItem = {};
            tableItem["label"] = i + " X " + j;
            tableItem["expression"] = i + " times " + j;
            tableItem["answer"] = (i * j).toString();
            mulTable.push(tableItem);
        }
        multiplicationTables[i.toString()] = mulTable;
    }

    return multiplicationTables;
}

const multiplicationTables = createMultiplicationTables();

/**
 * Class that handles the selection of the sight word group to display cards for.
 */
class GroupSelectionManager {
    #cardManager = null;

    constructor() {
        this.#cardManager = new SightWordCardManager();

        for (const [key, value] of Object.entries(multiplicationTables)) {
            console.log(`Adding menu item for multiplication table ${key}: ${value}`);

            const menuItemDiv = document.createElement("button");
            menuItemDiv.classList.add("menu-card");
            menuItemDiv.type = "button";
            menuItemDiv.appendChild(document.createTextNode(key));

            const mainMenuDiv = document.getElementById("main-menu-container");
            mainMenuDiv.appendChild(menuItemDiv);

            menuItemDiv.addEventListener('click', () => {
                this.showCards(key);
            });
        }

        // Welcome Message
        if(synth) {
            let voices = synth.getVoices();
            const utterThis = new SpeechSynthesisUtterance("Welcome to the Multiplication Tables App!");
            utterThis.voice = voices[82];
            synth.speak(utterThis);
        }
    }

    hideMenu() {
        const groupManager = this;
        const menuItemDivs = document.querySelectorAll(".menu-card");
        menuItemDivs.forEach(element => {
            element.style.opacity = "0";
            element.style.display = "none";
        });

        const backButtonElement = document.createElement("button");
        backButtonElement.type = "button";
        backButtonElement.id = "back-button";
        backButtonElement.appendChild(document.createTextNode("BACK"));

        document.body.appendChild(backButtonElement);
        backButtonElement.addEventListener("click", () => {
            anime({
                targets: backButtonElement,
                opacity: '0',
                easing: 'easeInOutSine',
                duration: animationDuration / 2,
                complete: function (prevAnim) {
                    groupManager.hideCards();
                }
            });
        });
    }

    showMenu() {
        document.getElementById("main-title").textContent = "Multiplication Tables";

        const menuItemDivs = document.querySelectorAll(".menu-card");
        menuItemDivs.forEach(element => {
            element.style.display = "flex";
            element.style.opacity = "1";
        });

        const backButtonElement = document.getElementById("back-button");
        if (backButtonElement) {
            backButtonElement.parentElement.removeChild(backButtonElement);
        }
    }

    showCards(wordGroup) {
        this.hideMenu();
        this.#cardManager.setWordGroup(wordGroup);
        this.#cardManager.nextCard(true);
        this.#cardManager.showCard();
    }

    hideCards() {
        this.#cardManager.hideCard(() => {
            this.showMenu();
        });
    }
}

/**
 * Class that handles displaying a particular sight word group.
 */
class SightWordCardManager {
    #groupName = "";
    #isAnimating = false;
    #currentIndex = -1;
    #cardContainerDiv = document.getElementById("index-card-container");
    #cardDiv = document.getElementById('index-card');
    #countTextDiv = document.getElementById('card-count');
    #wordArray = [];
    #onCardContainerClick = () => { this.nextCard(true); };
    #onKeyClick = (e) => {
        if (e.key == 'ArrowUp') {
            // up arrow
            this.nextCard(true);
        }
        else if (e.key == 'ArrowDown') {
            // down arrow
            this.nextCard(false);
        }
        else if (e.key == 'ArrowLeft') {
            // left arrow
            this.nextCard(false);
        }
        else if (e.key == 'ArrowRight') {
            // right arrow
            this.nextCard(true);
        }
    };

    setWordGroup(groupName) {
        this.#groupName = groupName;
        this.#wordArray = multiplicationTables[groupName];
        shuffleArray(this.#wordArray);
    }

    doAnimation(isOnShown, callback) {
        const cardManager = this;
        const cardDiv = this.#cardDiv;
        anime({
            targets: cardDiv,
            opacity: isOnShown ? '1' : '0',
            easing: 'easeInOutSine',
            duration: animationDuration,
            complete: function (prevAnim) {
                cardManager.setIsAnimating(false);
                if (callback) {
                    callback();
                }
            }
        });
    }

    hideCard(cbOnHidden) {
        if (this.#isAnimating) {
            return;
        }

        this.#cardContainerDiv.removeEventListener('click', this.#onCardContainerClick);
        document.removeEventListener('keydown', this.#onKeyClick);
        this.#isAnimating = true;

        this.doAnimation(false, () => {
            this.reset();
            this.#cardDiv.style.display = "none";
            cbOnHidden();
        });
    }

    showCard(cbOnShown) {
        if (this.#isAnimating) {
            return;
        }

        document.getElementById("main-title").textContent = this.#groupName;
        this.#cardContainerDiv.addEventListener('click', this.#onCardContainerClick);
        document.addEventListener('keydown', this.#onKeyClick);

        this.#cardDiv.style.display = "flex";
        this.doAnimation(true, cbOnShown);
    }

    nextCard(moveForward) {
        if (moveForward) {
            this.#currentIndex += 1;
        }
        else {
            this.#currentIndex -= 1;
        }

        // Wrap index around if we go outside range [0, wordArray.length - 1]
        if (this.#currentIndex < 0) {
            shuffleArray(this.#wordArray);
            this.#currentIndex = this.#wordArray.length - 1;
        }
        else if (this.#currentIndex >= this.#wordArray.length) {
            shuffleArray(this.#wordArray);
            this.#currentIndex = 0;
        }

        if(synth) {
            let currentWordObj = this.#wordArray[this.#currentIndex];
            let voices = synth.getVoices();
            const utterThis = new SpeechSynthesisUtterance(currentWordObj.expression + " is " + currentWordObj.answer);
            utterThis.voice = voices[82];
            synth.speak(utterThis);
        }

        this.updateText();
    }

    setIsAnimating(isAnimating) {
        this.#isAnimating = isAnimating;
    }

    reset() {
        this.#currentIndex = -1;
        this.#groupName = "";
        this.#cardDiv.textContent = "";
        this.#countTextDiv.textContent = "";
        this.#wordArray = [];
    }

    updateText() {
        this.#cardDiv.textContent = this.#wordArray[this.#currentIndex].label;
        this.#countTextDiv.textContent = `Card Count: ${this.#currentIndex + 1} out of ${this.#wordArray.length}`
    }
}

window.onload = function () {
    const groupManager = new GroupSelectionManager();
    groupManager.showMenu();
}
