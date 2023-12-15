import { secretValue } from "./secret";

function checkInput() {
  var inputValue = document.getElementById("inputField").value;

  if (inputValue === secretValue) {
    document.getElementById("result").innerHTML =
      "<h4>6435129085648913644873748</h4>";
  } else {
    document.getElementById("result").innerHTML = "<p>WRONG PASSWORD</p>";
  }
}
