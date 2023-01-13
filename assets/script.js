// Get the table cells
const squares = document.querySelectorAll(".square");

// Keep track of the current player
let currentPlayer = "X";

// Keep track of the game state
let gameOver = false;

// Add click event listeners to the cells
squares.forEach((square) => {
  square.addEventListener("click", handleClick);
});

// Add click event listener to the reset button
document.querySelector("#reset").addEventListener("click", reset);

function handleClick(e) {
  // Check if the cell is already filled or if the game is over
  if (e.target.textContent || gameOver) {
    return;
  }
  
  // Switch players
  currentPlayer = currentPlayer === "X" ? "O" : "X";

  // Fill the cell with the current player's symbol
  e.target.textContent = currentPlayer;

  // Check for a winner
  checkForWinner();
}

function checkForWinner() {
  // Check the rows
  for (let i = 0; i < 9; i += 3) {
    if (
      squares[i].textContent &&
      squares[i].textContent === squares[i + 1].textContent &&
      squares[i].textContent === squares[i + 2].textContent
    ) {
      gameOver = true;
      alert(`Player ${currentPlayer} wins!`);
      return;
    }
  }

  // Check the columns
  for (let i = 0; i < 3; i++) {
    if (
      squares[i].textContent &&
      squares[i].textContent === squares[i + 3].textContent &&
      squares[i].textContent === squares[i + 6].textContent
    ) {
      gameOver = true;
      alert(`Player ${currentPlayer} wins!`);
      return;
    }
  }

  // Check the diagonals
  if (
    squares[0].textContent &&
    squares[0].textContent === squares[4].textContent &&
    squares[0].textContent === squares[8].textContent
  ) {
    gameOver = true;
    alert(`Player ${currentPlayer} wins!`);
    return;
  }
  if (
    squares[2].textContent &&
    squares[2].textContent === squares[4].textContent &&
    squares[2].textContent === squares[6].textContent
  ) {
    gameOver = true;
    alert(`Player ${currentPlayer} wins!`);
    return;
  }

  // Check for a draw
  if (!squares.some((square) => square.textContent === "")) {
    gameOver = true;
    alert("It's a draw!");
  }
}

function reset() {
  // Clear the cells
  squares.forEach((square) => {
    square.textContent = "";
  });

  // Reset the game state
  currentPlayer = "X";
  gameOver = false;
}
