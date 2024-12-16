// Complete JavaScript for quiz game
let players = [];
const playerColors = ["#FF0000", "#00FF00", "#0000FF", "#FFFF00"];
let questionBank = {};
let currentSubject = null;
let currentDifficulty = null;
let currentPlayerIndex = 0;
let currentQuestions = [];
let answeredQuestions = [];
let timer = null;
let remainingTime = 15;

document.addEventListener("DOMContentLoaded", () => {
    const screens = document.querySelectorAll(".screen");
    const playerList = document.getElementById("player-list");
    const nextButton = document.getElementById("next-to-subjects");
    const startGameButton = document.getElementById("start-game");
    const questionContainer = document.getElementById("question-container");
    const answersContainer = document.getElementById("answers");
    const submitAnswerButton = document.getElementById("submit-answer");
    const timerDisplay = document.getElementById("timer");
    const playerTurnDisplay = document.getElementById("player-turn");

    // Load questions from JSON
    fetch("questions.json")
        .then(response => response.json())
        .then(data => {
            questionBank = data;
        })
        .catch(error => console.error("Error loading questions.json:", error));

    // Helper functions
    function showScreen(screenId) {
        screens.forEach(screen => {
            screen.classList.remove("active");
            screen.classList.add("hidden");
        });
        document.getElementById(screenId).classList.remove("hidden");
        document.getElementById(screenId).classList.add("active");
    }

    function shuffleArray(array) {
        return array.sort(() => Math.random() - 0.5);
    }

    function startGame() {
        if (currentSubject === "Mixed") {
            const allQuestions = [
                ...questionBank.HTML,
                ...questionBank.CSS,
                ...questionBank.JavaScript
            ];
            currentQuestions = shuffleArray(allQuestions).slice(0, players.length * currentDifficulty);
        } else {
            currentQuestions = shuffleArray(questionBank[currentSubject]).slice(
                0,
                players.length * currentDifficulty
            );
        }
        answeredQuestions = [];
        currentPlayerIndex = 0;
        showScreen("game-screen");
        loadQuestion();
    }

    function loadQuestion() {
        if (answeredQuestions.length === currentQuestions.length) {
            endGame();
            return;
        }

        const player = players[currentPlayerIndex];
        const question = currentQuestions[answeredQuestions.length];

        playerTurnDisplay.textContent = `${player.name}'s Turn`;
        playerTurnDisplay.style.color = player.color;

        questionContainer.textContent = question.question;

        answersContainer.innerHTML = question.options
            .map((option, index) => `<button class="answer" data-index="${index}">${option}</button>`)
            .join("");

        answersContainer.querySelectorAll(".answer").forEach(button => {
            button.addEventListener("click", () => {
                answersContainer.querySelectorAll(".answer").forEach(btn => btn.style.backgroundColor = "");
                button.style.backgroundColor = player.color;
                submitAnswerButton.disabled = false;
            });
        });

        startTimer();
        submitAnswerButton.disabled = true;
    }

    function startTimer() {
        remainingTime = 15;
        timerDisplay.textContent = `Time: ${remainingTime}`;
        clearInterval(timer);

        timer = setInterval(() => {
            remainingTime--;
            timerDisplay.textContent = `Time: ${remainingTime}`;
            if (remainingTime === 0) {
                clearInterval(timer);
                submitAnswer();
            }
        }, 1000);
    }

    submitAnswerButton.addEventListener("click", submitAnswer);

    function submitAnswer() {
        clearInterval(timer);

        const selectedAnswer = answersContainer.querySelector(".answer[style*='background-color']");
        const question = currentQuestions[answeredQuestions.length];
        const player = players[currentPlayerIndex];

        const playerAnswerIndex = selectedAnswer ? parseInt(selectedAnswer.dataset.index, 10) : null;

        if (playerAnswerIndex !== null && playerAnswerIndex === question.correct) {
            player.score += 10;
        }

        answeredQuestions.push({
            player: player.name,
            color: player.color,
            answerIndex: playerAnswerIndex
        });

        currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
        loadQuestion();
    }

    function endGame() {
        showScreen("game-end");
        const resultsContainer = document.getElementById("results");

        const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
        const highestScore = sortedPlayers[0].score;
        const winners = sortedPlayers.filter(player => player.score === highestScore);

        resultsContainer.innerHTML = `
            <h2>Game Results</h2>
            ${sortedPlayers.map((player, index) => {
                const isWinner = winners.includes(player);
                return `<div style="color: ${player.color}; font-weight: ${isWinner ? "bold" : "normal"}">
                    ${index + 1}. ${player.name}: ${player.score} points ${isWinner ? "🏆" : ""}
                </div>`;
            }).join("")}
            <button id="restart-game">Start New Game</button>
            <button id="review-answers">Review Questions</button>
        `;

        document.getElementById("restart-game").addEventListener("click", () => {
            resetGame();
            showScreen("player-selection");
        });

        document.getElementById("review-answers").addEventListener("click", () => {
            reviewAnswers();
        });
    }

    function reviewAnswers() {
        showScreen("review-screen");
        const reviewContainer = document.getElementById("review-container");

        reviewContainer.innerHTML = `
            <h2>Question Review</h2>
            ${currentQuestions.map((question, index) => {
                const correctAnswer = question.options[question.correct];
                const playerAnswerData = answeredQuestions[index] || {};
                const playerAnswer = playerAnswerData.answerIndex !== null
                    ? question.options[playerAnswerData.answerIndex]
                    : "No Answer";
                const answerColor = playerAnswerData.color || "gray";
                const isCorrect = playerAnswer === correctAnswer;

                return `<div class="review-item">
                    <p><strong>Q${index + 1}:</strong> ${question.question}</p>
                    <p><strong>Correct Answer:</strong> ${correctAnswer}</p>
                    <p><strong>Player's Answer:</strong> 
                        <span style="color: ${answerColor}">
                            ${playerAnswer} ${isCorrect ? "✅" : "❌"}
                        </span>
                    </p>
                </div>`;
            }).join("")}
            <button id="back-to-results">Back to Results</button>
        `;

        document.getElementById("back-to-results").addEventListener("click", () => {
            showScreen("game-end");
        });
    }

    function resetGame() {
        players.forEach(player => player.score = 0);
        currentQuestions = [];
        answeredQuestions = [];
        currentPlayerIndex = 0;
    }

    // Event listeners for adding/removing players and starting the game
    document.getElementById("add-player").addEventListener("click", () => {
        if (players.length < 4) {
            const playerName = `Player ${players.length + 1}`;
            const playerColor = playerColors[players.length];
            players.push({ name: playerName, color: playerColor, score: 0 });
            renderPlayers();
        }
        toggleNextButton();
    });

    document.getElementById("remove-player").addEventListener("click", () => {
        if (players.length > 0) {
            players.pop();
            renderPlayers();
        }
        toggleNextButton();
    });

    function toggleNextButton() {
        nextButton.disabled = players.length === 0;
    }

    function renderPlayers() {
        playerList.innerHTML = players
            .map(player => `<div style="color: ${player.color}">${player.name}</div>`)
            .join("");
    }

    nextButton.addEventListener("click", () => {
        showScreen("subject-selection");
    });

    document.querySelectorAll(".subject").forEach(button => {
        button.addEventListener("click", () => {
            currentSubject = button.dataset.subject;
            document.querySelectorAll(".subject").forEach(btn => btn.classList.remove("selected"));
            button.classList.add("selected");
            toggleStartGameButton();
        });
    });

    document.querySelectorAll(".difficulty").forEach(button => {
        button.addEventListener("click", () => {
            currentDifficulty = parseInt(button.dataset.difficulty, 10);
            document.querySelectorAll(".difficulty").forEach(btn => btn.classList.remove("selected"));
            button.classList.add("selected");
            toggleStartGameButton();
        });
    });

    function toggleStartGameButton() {
        startGameButton.disabled = !(currentSubject && currentDifficulty);
    }

    startGameButton.addEventListener("click", () => {
        startGame();
    });
});
