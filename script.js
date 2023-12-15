function checkInput() {
  var inputValue = document.getElementById("inputField").value;

  if (inputValue === "EGva76XFr5fjCt4qKSebPpHd") {
    document.getElementById("result").innerHTML =
      "<h4>Congratulations! You cracked the password.</h4>";
  } else {
    document.getElementById("result").innerHTML = "<p>WRONG PASSWORD</p>";
  }
}
