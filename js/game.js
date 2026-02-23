const colors = ["red", "blue", "green", "yellow"];
const colorNames = {
    red: "🔴 Rojo",
    blue: "🔵 Azul", 
    green: "🟢 Verde",
    yellow: "🟡 Amarillo"
};
const specialValues = ["Skip", "Reverse", "Draw Two"];
const wildValues = ["Wild", "Wild Draw Four"];

let playerHand = [];
let opponentHand = [];
let discardPile = [];
let drawPile = [];
let currentTurn = "player";
let gameDirection = 1;
let gameOver = false;
let playerScore = 0;
let opponentScore = 0;
let skipNext = false;
let colorSelectionPending = false;
let pendingDrawCards = 0;
let playerCardsDrawnThisTurn = 0;
let opponentCardsDrawnThisTurn = 0;
const MAX_DRAWS_PER_TURN = 3;

// Elementos del DOM
const handContainer = document.getElementById("handCards");
const opponentContainer = document.getElementById("opponentCards");
const discardContainer = document.getElementById("discardPile");
const drawPileElement = document.getElementById("drawPile");
const opponentCount = document.getElementById("opponentCardCount");
const handCount = document.getElementById("handCount");
const turnIndicator = document.getElementById("turnIndicator");
const scoreDisplay = document.getElementById("scoreDisplay");
const messageArea = document.getElementById("message");
const iaMessage = document.getElementById("iaMessage");
const iaStatus = document.getElementById("iaStatus");
const playerStatus = document.getElementById("playerStatus");
const unoBtn = document.getElementById("unoBtn");
const passBtn = document.getElementById("passBtn");
const resetBtn = document.getElementById("resetBtn");

// Inicialización
function initGame() {
    console.log("🎮 Iniciando juego...");
    createDeck();
    dealInitialCards();
    updateUI();
    updateTurnDisplay();
    messageArea.textContent = "🎮 ¡Nuevo juego!";
}

function createDeck() {
    drawPile = [];
    
    // Crear cartas normales (0-9)
    colors.forEach(color => {
        // Un 0 por color
        drawPile.push({ color, value: "0", type: "number" });
        
        // Dos de cada número del 1-9 por color
        for (let i = 1; i <= 9; i++) {
            drawPile.push({ color, value: i.toString(), type: "number" });
            drawPile.push({ color, value: i.toString(), type: "number" });
        }
        
        // Dos cartas especiales por color (Skip, Reverse, Draw Two)
        drawPile.push({ color, value: "Skip", type: "special" });
        drawPile.push({ color, value: "Skip", type: "special" });
        drawPile.push({ color, value: "Reverse", type: "special" });
        drawPile.push({ color, value: "Reverse", type: "special" });
        drawPile.push({ color, value: "Draw Two", type: "special" });
        drawPile.push({ color, value: "Draw Two", type: "special" });
    });
    
    // Cartas comodín (4 de cada)
    for (let i = 0; i < 4; i++) {
        drawPile.push({ color: "wild", value: "Wild", type: "wild" });
        drawPile.push({ color: "wild", value: "Wild Draw Four", type: "wild" });
    }
    
    shuffleDeck();
    console.log("📦 Mazo creado con", drawPile.length, "cartas");
}

function shuffleDeck() {
    for (let i = drawPile.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [drawPile[i], drawPile[j]] = [drawPile[j], drawPile[i]];
    }
}

function dealInitialCards() {
    playerHand = [];
    opponentHand = [];
    
    // Repartir 7 cartas a cada jugador
    for (let i = 0; i < 7; i++) {
        if (drawPile.length > 0) playerHand.push(drawPile.pop());
        if (drawPile.length > 0) opponentHand.push(drawPile.pop());
    }
    
    // Colocar primera carta en el mazo de descarte
    if (drawPile.length > 0) {
        let firstCard = drawPile.pop();
        
        // Asegurar que la primera carta no sea comodín
        while (firstCard.type === "wild") {
            drawPile.unshift(firstCard);
            shuffleDeck();
            firstCard = drawPile.pop();
        }
        
        discardPile = [firstCard];
        
        // Resetear contadores
        playerCardsDrawnThisTurn = 0;
        opponentCardsDrawnThisTurn = 0;
        
        // Aplicar efecto de la primera carta
        if (firstCard.value === "Skip") {
            currentTurn = "opponent";
            messageArea.textContent = "🚫 Carta Skip! Empieza la IA";
        } 
        else if (firstCard.value === "Reverse") {
            currentTurn = "opponent";
            messageArea.textContent = "↻ Carta Reverse! Empieza la IA";
        } 
        else if (firstCard.value === "Draw Two") {
            currentTurn = "player";
            animateDrawCards("opponent", 2);
            setTimeout(() => {
                for (let i = 0; i < 2; i++) {
                    if (drawPile.length > 0) {
                        opponentHand.push(drawPile.pop());
                    } else {
                        reshuffleDiscardPile();
                        opponentHand.push(drawPile.pop());
                    }
                }
                updateUI();
                messageArea.textContent = "🤖 IA roba 2 cartas. Tu turno";
            }, 500);
        }
        else {
            currentTurn = "player";
            messageArea.textContent = "🎯 Tu turno";
        }
    }
}

// ANIMACIONES
function animateDrawCards(target, count) {
    const targetElement = target === "player" ? handContainer : opponentContainer;
    if (!targetElement || !drawPileElement) return;
    
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const flyingCard = document.createElement('div');
            flyingCard.className = 'flying-card';
            flyingCard.style.background = 'var(--card-bg)';
            flyingCard.style.position = 'fixed';
            flyingCard.style.width = '80px';
            flyingCard.style.height = '120px';
            flyingCard.style.borderRadius = '15px';
            flyingCard.style.zIndex = '1000';
            flyingCard.style.transition = 'all 0.5s ease';
            flyingCard.style.boxShadow = '0 10px 20px rgba(0,0,0,0.3)';
            flyingCard.style.pointerEvents = 'none';
            flyingCard.style.border = '2px solid rgba(255,255,255,0.2)';
            
            const drawPileRect = drawPileElement.getBoundingClientRect();
            flyingCard.style.left = drawPileRect.left + 'px';
            flyingCard.style.top = drawPileRect.top + 'px';
            
            document.body.appendChild(flyingCard);
            
            setTimeout(() => {
                const targetRect = targetElement.getBoundingClientRect();
                flyingCard.style.left = targetRect.left + (targetRect.width / 2) + 'px';
                flyingCard.style.top = targetRect.top + 'px';
                flyingCard.style.transform = 'scale(0.5) rotate(360deg)';
                flyingCard.style.opacity = '0';
                
                setTimeout(() => {
                    flyingCard.remove();
                }, 500);
            }, 50);
        }, i * 200);
    }
}

function animatePlayCard(card, fromElement) {
    if (!fromElement || !discardContainer) return;
    
    const flyingCard = document.createElement('div');
    flyingCard.className = 'flying-card';
    
    if (card.type === 'wild') {
        flyingCard.style.background = 'linear-gradient(45deg, #f38ba8, #89b4fa, #a6e3a1, #f9e2af)';
        flyingCard.style.backgroundSize = '300% 300%';
    } else {
        flyingCard.style.background = `var(--${card.color})`;
    }
    
    flyingCard.style.position = 'fixed';
    flyingCard.style.width = '80px';
    flyingCard.style.height = '120px';
    flyingCard.style.borderRadius = '15px';
    flyingCard.style.zIndex = '1000';
    flyingCard.style.transition = 'all 0.4s ease';
    flyingCard.style.boxShadow = '0 10px 20px rgba(0,0,0,0.3)';
    flyingCard.style.display = 'flex';
    flyingCard.style.alignItems = 'center';
    flyingCard.style.justifyContent = 'center';
    flyingCard.style.color = 'white';
    flyingCard.style.fontWeight = 'bold';
    flyingCard.style.fontSize = '2rem';
    flyingCard.style.pointerEvents = 'none';
    flyingCard.style.border = '2px solid rgba(255,255,255,0.2)';
    
    let displayValue = card.value;
    if (card.value === "Skip") displayValue = "🚫";
    else if (card.value === "Reverse") displayValue = "↻";
    else if (card.value === "Draw Two") displayValue = "+2";
    else if (card.value === "Wild") displayValue = "🌈";
    else if (card.value === "Wild Draw Four") displayValue = "+4";
    flyingCard.textContent = displayValue;
    
    const innerBorder = document.createElement('div');
    innerBorder.style.position = 'absolute';
    innerBorder.style.top = '5px';
    innerBorder.style.left = '5px';
    innerBorder.style.right = '5px';
    innerBorder.style.bottom = '5px';
    innerBorder.style.border = '2px dashed rgba(255,255,255,0.3)';
    innerBorder.style.borderRadius = '10px';
    innerBorder.style.pointerEvents = 'none';
    flyingCard.appendChild(innerBorder);
    
    const cardRect = fromElement.getBoundingClientRect();
    flyingCard.style.left = cardRect.left + 'px';
    flyingCard.style.top = cardRect.top + 'px';
    
    document.body.appendChild(flyingCard);
    
    setTimeout(() => {
        const discardRect = discardContainer.getBoundingClientRect();
        flyingCard.style.left = discardRect.left + 'px';
        flyingCard.style.top = discardRect.top + 'px';
        flyingCard.style.transform = 'scale(0.8)';
        
        setTimeout(() => {
            flyingCard.remove();
        }, 400);
    }, 50);
}

// SELECTOR DE COLOR
function showColorSelector(callback) {
    colorSelectionPending = true;
    enablePlayerActions(false);
    
    const overlay = document.createElement('div');
    overlay.className = 'color-selector-overlay';
    
    const selector = document.createElement('div');
    selector.className = 'color-selector';
    
    selector.innerHTML = `
        <h3 style="color: white; margin-bottom: 20px; text-align: center; font-size: 1.5rem;">🎨 ELIGE UN COLOR</h3>
        <div style="display: flex; gap: 20px; justify-content: center; flex-wrap: wrap;">
            <button class="color-option red" style="background: #f38ba8; width: 90px; height: 90px; border-radius: 50%; border: none; cursor: pointer; transition: all 0.2s; box-shadow: 0 5px 15px rgba(0,0,0,0.3);"></button>
            <button class="color-option blue" style="background: #89b4fa; width: 90px; height: 90px; border-radius: 50%; border: none; cursor: pointer; transition: all 0.2s; box-shadow: 0 5px 15px rgba(0,0,0,0.3);"></button>
            <button class="color-option green" style="background: #a6e3a1; width: 90px; height: 90px; border-radius: 50%; border: none; cursor: pointer; transition: all 0.2s; box-shadow: 0 5px 15px rgba(0,0,0,0.3);"></button>
            <button class="color-option yellow" style="background: #f9e2af; width: 90px; height: 90px; border-radius: 50%; border: none; cursor: pointer; transition: all 0.2s; box-shadow: 0 5px 15px rgba(0,0,0,0.3);"></button>
        </div>
        <p style="color: rgba(255,255,255,0.7); text-align: center; margin-top: 20px; font-size: 1.1rem;">Haz clic en un color</p>
    `;
    
    overlay.appendChild(selector);
    document.body.appendChild(overlay);
    
    document.querySelectorAll('.color-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const color = e.target.classList[1];
            document.body.removeChild(overlay);
            colorSelectionPending = false;
            callback(color);
        });
        
        btn.addEventListener('mouseenter', (e) => {
            e.target.style.transform = 'scale(1.15)';
            e.target.style.boxShadow = '0 15px 30px rgba(203,166,247,0.9)';
        });
        
        btn.addEventListener('mouseleave', (e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
        });
    });
}

// Renderizado
function updateUI() {
    renderPlayerHand();
    renderOpponentHand();
    renderDiscardPile();
    updateCounters();
    updateDrawCounter();
}

function renderPlayerHand() {
    if (!handContainer) return;
    
    handContainer.innerHTML = "";
    
    playerHand.forEach((card, index) => {
        const cardElement = createCardElement(card);
        cardElement.setAttribute('data-index', index);
        cardElement.onclick = () => playCard(index);
        handContainer.appendChild(cardElement);
    });
}

function renderOpponentHand() {
    if (!opponentContainer) return;
    
    opponentContainer.innerHTML = "";
    
    for (let i = 0; i < opponentHand.length; i++) {
        const cardBack = document.createElement("div");
        cardBack.className = "opponent-card-back";
        opponentContainer.appendChild(cardBack);
    }
}

function renderDiscardPile() {
    if (!discardContainer) return;
    
    discardContainer.innerHTML = "";
    if (discardPile.length > 0) {
        const topCard = discardPile[discardPile.length - 1];
        const cardElement = createCardElement(topCard);
        cardElement.style.cursor = "default";
        cardElement.onclick = null;
        discardContainer.appendChild(cardElement);
    }
}

function createCardElement(card) {
    const div = document.createElement("div");
    div.classList.add("game-card");
    
    if (card.type === "wild") {
        div.classList.add("wild");
    } else {
        div.classList.add(card.color);
    }
    
    if (card.selectedColor) {
        div.setAttribute('title', `Color elegido: ${colorNames[card.selectedColor]}`);
    }
    
    let displayValue = card.value;
    if (card.value === "Skip") displayValue = "🚫";
    else if (card.value === "Reverse") displayValue = "↻";
    else if (card.value === "Draw Two") displayValue = "+2";
    else if (card.value === "Wild") displayValue = "🌈";
    else if (card.value === "Wild Draw Four") displayValue = "+4";
    
    div.textContent = displayValue;
    return div;
}

function updateCounters() {
    if (opponentCount) opponentCount.textContent = opponentHand.length;
    if (handCount) handCount.textContent = playerHand.length;
}

function updateDrawCounter() {
    const drawCounter = document.getElementById('drawCounter');
    if (drawCounter) {
        let currentDraws = currentTurn === "player" ? playerCardsDrawnThisTurn : opponentCardsDrawnThisTurn;
        if (currentDraws > 0) {
            drawCounter.textContent = `${currentDraws}/${MAX_DRAWS_PER_TURN}`;
            drawCounter.classList.add('active');
        } else {
            drawCounter.classList.remove('active');
        }
    }
}

function updateTurnDisplay() {
    if (!turnIndicator || !playerStatus || !iaStatus) return;
    
    if (gameOver) {
        turnIndicator.textContent = "Juego Terminado";
        playerStatus.textContent = "Juego terminado";
        iaStatus.textContent = "Juego terminado";
        return;
    }
    
    if (currentTurn === "player") {
        turnIndicator.textContent = `🎯 Tu turno ${playerCardsDrawnThisTurn > 0 ? `(${playerCardsDrawnThisTurn}/${MAX_DRAWS_PER_TURN})` : ''}`;
        playerStatus.textContent = "🎯 Tu turno";
        iaStatus.textContent = "Esperando...";
        if (iaMessage) iaMessage.textContent = "🤖 Esperando tu turno...";
        enablePlayerActions(true);
    } else {
        turnIndicator.textContent = "🤖 Turno de la IA";
        playerStatus.textContent = "Esperando...";
        iaStatus.textContent = "🤔 Pensando...";
        enablePlayerActions(false);
        
        // Iniciar turno de IA
        if (!colorSelectionPending && !gameOver) {
            setTimeout(() => opponentTurn(), 1500);
        }
    }
}

function enablePlayerActions(enable) {
    const cards = document.querySelectorAll('.hand-cards .game-card');
    cards.forEach(card => {
        if (enable && !colorSelectionPending) {
            card.style.pointerEvents = "auto";
            card.style.opacity = "1";
        } else {
            card.style.pointerEvents = "none";
            card.style.opacity = "0.7";
        }
    });
    
    if (drawPileElement) {
        drawPileElement.style.pointerEvents = (enable && !colorSelectionPending && playerCardsDrawnThisTurn < MAX_DRAWS_PER_TURN) ? "auto" : "none";
    }
    if (unoBtn) unoBtn.disabled = !enable || colorSelectionPending;
    if (passBtn) {
        passBtn.disabled = !enable || colorSelectionPending || playerCardsDrawnThisTurn === 0;
    }
}

// CORREGIDO: Función para jugar carta
function playCard(index) {
    if (currentTurn !== "player" || gameOver || colorSelectionPending) return;
    
    const card = playerHand[index];
    const topCard = discardPile[discardPile.length - 1];
    const cardElement = document.querySelector(`.hand-cards .game-card[data-index="${index}"]`);
    
    if (isValidPlay(card, topCard)) {
        if (cardElement) animatePlayCard(card, cardElement);
        
        setTimeout(() => {
            const playedCard = playerHand.splice(index, 1)[0];
            discardPile.push(playedCard);
            
            // Resetear contador de robos
            playerCardsDrawnThisTurn = 0;
            
            // Aplicar efecto según tipo de carta
            if (playedCard.type === "wild") {
                if (playedCard.value === "Wild") {
                    showColorSelector((color) => {
                        playedCard.selectedColor = color;
                        messageArea.textContent = `🎨 Color cambiado a ${colorNames[color]}`;
                        changeTurnAfterPlay("player");
                    });
                } else if (playedCard.value === "Wild Draw Four") {
                    showColorSelector((color) => {
                        playedCard.selectedColor = color;
                        messageArea.textContent = `🎨 Color cambiado a ${colorNames[color]} y IA roba +4`;
                        animateDrawCards("opponent", 4);
                        
                        setTimeout(() => {
                            for (let i = 0; i < 4; i++) {
                                if (drawPile.length > 0) {
                                    opponentHand.push(drawPile.pop());
                                } else {
                                    reshuffleDiscardPile();
                                    opponentHand.push(drawPile.pop());
                                }
                            }
                            updateUI();
                            changeTurnAfterPlay("player");
                        }, 500);
                    });
                }
            } else {
                // Aplicar efecto de carta especial
                applyCardEffect(playedCard, "player");
                
                // Cambiar turno después de aplicar efecto
                setTimeout(() => {
                    changeTurnAfterPlay("player");
                }, 600);
            }
        }, 400);
        
    } else {
        messageArea.textContent = "❌ No puedes jugar esa carta";
        if (cardElement) {
            cardElement.style.animation = "shake 0.3s ease";
            setTimeout(() => {
                cardElement.style.animation = "";
            }, 300);
        }
    }
}

// CORREGIDO: Función para cambiar turno
function changeTurnAfterPlay(currentPlayer) {
    // Verificar si alguien ganó
    if (playerHand.length === 0) {
        endGame("player");
        return;
    }
    if (opponentHand.length === 0) {
        endGame("opponent");
        return;
    }
    
    console.log("Cambiando turno. SkipNext:", skipNext, "Dirección:", gameDirection);
    
    // Determinar próximo turno
    if (skipNext) {
        // Saltar al siguiente jugador
        skipNext = false;
        if (gameDirection === 1) {
            currentTurn = currentPlayer === "player" ? "opponent" : "player";
        } else {
            currentTurn = currentPlayer === "player" ? "player" : "opponent";
        }
    } else {
        // Turno normal según dirección
        if (gameDirection === 1) {
            currentTurn = currentPlayer === "player" ? "opponent" : "player";
        } else {
            currentTurn = currentPlayer === "player" ? "player" : "opponent";
        }
    }
    
    // Resetear contadores para el nuevo turno
    if (currentTurn === "player") {
        playerCardsDrawnThisTurn = 0;
    } else {
        opponentCardsDrawnThisTurn = 0;
    }
    
    console.log("Nuevo turno:", currentTurn);
    updateUI();
    updateTurnDisplay();
}

function isValidPlay(card, topCard) {
    // Si hay cartas pendientes por robar, solo se pueden jugar cartas del mismo tipo
    if (pendingDrawCards > 0) {
        return (card.value === "Draw Two" && topCard.value === "Draw Two") ||
               (card.value === "Wild Draw Four" && topCard.value === "Wild Draw Four");
    }
    
    // Cartas comodín siempre válidas
    if (card.type === "wild") return true;
    
    // Si la carta superior tiene color seleccionado (por comodín)
    if (topCard.selectedColor) {
        return card.color === topCard.selectedColor;
    }
    
    // Coincidencia normal
    return card.color === topCard.color || card.value === topCard.value;
}

function applyCardEffect(card, player) {
    const opponent = player === "player" ? "opponent" : "player";
    
    switch(card.value) {
        case "Skip":
            messageArea.textContent = `🚫 ${opponent === "player" ? "Tú" : "IA"} bloqueado!`;
            skipNext = true;
            break;
            
        case "Reverse":
            gameDirection *= -1;
            messageArea.textContent = "↻ Dirección cambiada!";
            // Con 2 jugadores, Reverse funciona como Skip
            skipNext = true;
            break;
            
        case "Draw Two":
            pendingDrawCards = 2;
            messageArea.textContent = `➕2 ${opponent === "player" ? "Tú" : "IA"} roba 2 cartas!`;
            animateDrawCards(opponent, 2);
            
            setTimeout(() => {
                if (player === "player") {
                    for (let i = 0; i < 2; i++) {
                        if (drawPile.length > 0) {
                            opponentHand.push(drawPile.pop());
                        } else {
                            reshuffleDiscardPile();
                            opponentHand.push(drawPile.pop());
                        }
                    }
                } else {
                    for (let i = 0; i < 2; i++) {
                        if (drawPile.length > 0) {
                            playerHand.push(drawPile.pop());
                        } else {
                            reshuffleDiscardPile();
                            playerHand.push(drawPile.pop());
                        }
                    }
                }
                pendingDrawCards = 0;
                updateUI();
            }, 600);
            break;
    }
}

// CORREGIDO: Turno de la IA
function opponentTurn() {
    if (currentTurn !== "opponent" || gameOver || colorSelectionPending) return;
    
    console.log("🎯 Turno de IA");
    iaMessage.textContent = "🤔 IA está pensando...";
    
    setTimeout(() => {
        const topCard = discardPile[discardPile.length - 1];
        console.log("Carta superior:", topCard);
        
        // Buscar cartas jugables
        const playableCards = opponentHand.filter(card => {
            const valid = isValidPlay(card, topCard);
            console.log(`Carta ${card.value} de ${card.color} es jugable?`, valid);
            return valid;
        });
        
        console.log(`IA tiene ${opponentHand.length} cartas, ${playableCards.length} jugables`);
        
        if (playableCards.length > 0) {
            // IA juega una carta aleatoria
            const cardToPlay = playableCards[Math.floor(Math.random() * playableCards.length)];
            const index = opponentHand.indexOf(cardToPlay);
            
            console.log("IA juega:", cardToPlay);
            
            const iaCardElements = document.querySelectorAll('.opponent-card-back');
            if (iaCardElements[index]) {
                animatePlayCard(cardToPlay, iaCardElements[index]);
            }
            
            setTimeout(() => {
                const playedCard = opponentHand.splice(index, 1)[0];
                discardPile.push(playedCard);
                
                opponentCardsDrawnThisTurn = 0;
                
                let displayValue = playedCard.value;
                if (playedCard.value === "Skip") displayValue = "🚫 Bloqueo";
                else if (playedCard.value === "Reverse") displayValue = "↻ Reversa";
                else if (playedCard.value === "Draw Two") displayValue = "+2";
                else if (playedCard.value === "Wild") displayValue = "🌈 Comodín";
                else if (playedCard.value === "Wild Draw Four") displayValue = "+4";
                
                iaMessage.textContent = `🤖 IA juega ${displayValue}`;
                
                if (playedCard.type === "wild") {
                    const randomColor = colors[Math.floor(Math.random() * colors.length)];
                    playedCard.selectedColor = randomColor;
                    iaMessage.textContent = `🤖 IA juega ${playedCard.value} y elige ${colorNames[randomColor]}`;
                    
                    if (playedCard.value === "Wild Draw Four") {
                        animateDrawCards("player", 4);
                        setTimeout(() => {
                            for (let i = 0; i < 4; i++) {
                                if (drawPile.length > 0) {
                                    playerHand.push(drawPile.pop());
                                } else {
                                    reshuffleDiscardPile();
                                    playerHand.push(drawPile.pop());
                                }
                            }
                            updateUI();
                            changeTurnAfterPlay("opponent");
                        }, 500);
                    } else {
                        changeTurnAfterPlay("opponent");
                    }
                } else {
                    applyCardEffect(playedCard, "opponent");
                    setTimeout(() => {
                        changeTurnAfterPlay("opponent");
                    }, 600);
                }
            }, 400);
            
        } else {
            // IA no tiene cartas jugables, roba
            console.log("IA no tiene cartas jugables, robando...");
            
            if (opponentCardsDrawnThisTurn < MAX_DRAWS_PER_TURN) {
                iaMessage.textContent = `🤖 IA roba carta (${opponentCardsDrawnThisTurn + 1}/${MAX_DRAWS_PER_TURN})`;
                
                if (drawPile.length > 0) {
                    animateDrawCards("opponent", 1);
                    setTimeout(() => {
                        const newCard = drawPile.pop();
                        opponentHand.push(newCard);
                        opponentCardsDrawnThisTurn++;
                        console.log("IA robó:", newCard);
                        updateUI();
                        
                        // Verificar si la nueva carta se puede jugar
                        if (isValidPlay(newCard, topCard)) {
                            console.log("IA puede jugar la carta robada");
                            setTimeout(() => {
                                opponentTurn();
                            }, 500);
                        } else if (opponentCardsDrawnThisTurn >= MAX_DRAWS_PER_TURN) {
                            console.log("IA alcanzó máximo de robos, pasa turno");
                            iaMessage.textContent = "🤖 IA pasa el turno";
                            setTimeout(() => {
                                currentTurn = "player";
                                playerCardsDrawnThisTurn = 0;
                                updateTurnDisplay();
                            }, 1000);
                        } else {
                            console.log("IA sigue robando");
                            opponentTurn();
                        }
                    }, 500);
                } else {
                    reshuffleDiscardPile();
                    opponentTurn();
                }
            } else {
                console.log("IA ya robó máximo, pasa turno");
                iaMessage.textContent = "🤖 IA pasa el turno";
                setTimeout(() => {
                    currentTurn = "player";
                    playerCardsDrawnThisTurn = 0;
                    updateTurnDisplay();
                }, 1000);
            }
        }
    }, 1500);
}

function drawCard() {
    if (currentTurn !== "player" || gameOver || colorSelectionPending) return;
    
    if (playerCardsDrawnThisTurn >= MAX_DRAWS_PER_TURN) {
        messageArea.textContent = `⚠️ Ya robaste ${MAX_DRAWS_PER_TURN} cartas este turno`;
        return;
    }
    
    if (drawPile.length > 0) {
        animateDrawCards("player", 1);
        
        setTimeout(() => {
            const newCard = drawPile.pop();
            playerHand.push(newCard);
            playerCardsDrawnThisTurn++;
            
            let cardName = newCard.value;
            if (newCard.value === "Skip") cardName = "Bloqueo";
            else if (newCard.value === "Reverse") cardName = "Reversa";
            else if (newCard.value === "Draw Two") cardName = "+2";
            else if (newCard.value === "Wild") cardName = "Comodín";
            else if (newCard.value === "Wild Draw Four") cardName = "+4";
            
            messageArea.textContent = `🃏 Robaste ${cardName} (${playerCardsDrawnThisTurn}/${MAX_DRAWS_PER_TURN})`;
            updateUI();
            
            const topCard = discardPile[discardPile.length - 1];
            if (isValidPlay(newCard, topCard)) {
                messageArea.textContent = `🎯 Puedes jugar el ${cardName} (${playerCardsDrawnThisTurn}/${MAX_DRAWS_PER_TURN})`;
            }
            
            if (playerCardsDrawnThisTurn >= MAX_DRAWS_PER_TURN) {
                messageArea.textContent = `📢 Máximo de ${MAX_DRAWS_PER_TURN} cartas. Juega o pasa`;
            }
            
            enablePlayerActions(true);
            
        }, 500);
        
    } else {
        reshuffleDiscardPile();
        drawCard();
    }
}

function passTurn() {
    if (currentTurn !== "player" || gameOver || colorSelectionPending) return;
    
    if (playerCardsDrawnThisTurn === 0) {
        messageArea.textContent = "⚠️ Debes robar al menos una carta antes de pasar";
        return;
    }
    
    currentTurn = "opponent";
    opponentCardsDrawnThisTurn = 0;
    
    messageArea.textContent = "👋 Pasaste el turno";
    updateTurnDisplay();
}

function callUno() {
    if (playerHand.length === 1) {
        messageArea.textContent = "✅ ¡UNO!";
        unoBtn.style.background = "linear-gradient(145deg, #a6e3a1, #87c77d)";
        setTimeout(() => {
            unoBtn.style.background = "linear-gradient(145deg, var(--primary), #b184e0)";
        }, 500);
    } else {
        messageArea.textContent = "❌ No tienes UNO";
    }
}

function reshuffleDiscardPile() {
    if (discardPile.length > 1) {
        const topCard = discardPile.pop();
        drawPile = [...discardPile];
        discardPile = [topCard];
        shuffleDeck();
        messageArea.textContent = "🔄 Mazo rebarajado";
    }
}

function endGame(winner) {
    gameOver = true;
    
    if (winner === "player") {
        playerScore += calculateScore(opponentHand);
        messageArea.textContent = "🎉 ¡Felicidades! Has ganado!";
        turnIndicator.textContent = "🏆 VICTORIA!";
    } else {
        opponentScore += calculateScore(playerHand);
        messageArea.textContent = "😢 La IA ha ganado";
        turnIndicator.textContent = "💔 DERROTA";
    }
    
    if (scoreDisplay) {
        scoreDisplay.textContent = `${playerScore} : ${opponentScore}`;
    }
    
    enablePlayerActions(false);
    if (iaMessage) iaMessage.textContent = "🤖 Juego terminado";
}

function calculateScore(hand) {
    return hand.reduce((total, card) => {
        if (card.type === "number") return total + parseInt(card.value);
        if (card.value === "Skip" || card.value === "Reverse") return total + 20;
        if (card.value === "Draw Two") return total + 20;
        if (card.value === "Wild") return total + 50;
        if (card.value === "Wild Draw Four") return total + 50;
        return total;
    }, 0);
}

function resetGame() {
    playerHand = [];
    opponentHand = [];
    discardPile = [];
    drawPile = [];
    currentTurn = "player";
    gameDirection = 1;
    gameOver = false;
    skipNext = false;
    colorSelectionPending = false;
    pendingDrawCards = 0;
    playerCardsDrawnThisTurn = 0;
    opponentCardsDrawnThisTurn = 0;
    
    initGame();
    messageArea.textContent = "🔄 Nuevo juego!";
}

// Event Listeners
if (drawPileElement) drawPileElement.onclick = drawCard;
if (unoBtn) unoBtn.onclick = callUno;
if (passBtn) passBtn.onclick = passTurn;
if (resetBtn) resetBtn.onclick = resetGame;

// Iniciar juego
document.addEventListener('DOMContentLoaded', function() {
    console.log("✅ DOM cargado, iniciando juego...");
    initGame();
});

console.log("🚀 Script cargado");