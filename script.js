function checkInput() {
  var inputValue = document.getElementById("inputField").value;

  if (inputValue === "5kKXX") {
    document.getElementById("result").innerHTML =
      "<h4>EGva76XFr5fjCt4qKSebPpHd</h4>";
  } else {
    document.getElementById("result").innerHTML = "<p>WRONG PASSWORD</p>";
  }
}
