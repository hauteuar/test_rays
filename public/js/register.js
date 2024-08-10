function registerUser() {
    const termsChecked = document.getElementById("terms").checked;
    if (!termsChecked) {
      alert("You must agree to the terms and conditions before registering.");
      return;
    }
  
    const name = document.querySelector('input[name="Firstname Input"]').value + " " + document.querySelector('input[name="Lastname Input"]').value;
    const email = document.querySelector('input[name="Email Input"]').value;
    const phone_number = document.querySelector('input[name="Contact Input"]').value;
    const flat_no = document.querySelector('input[name="Street Input"]').value;
    const street = document.querySelector('input[name="Street Input"]').value;
    const state = document.querySelector('select[name="State Dropdown"]').value;
    const city = document.querySelector('input[name="City Input"]').value;
    const password = document.querySelector('input[name="Password Input"]').value;
    const password_confirmation = document.querySelector('input[name="Confirm Input"]').value;
  
    const requestBody = {
      name,
      email,
      phone_number,
      flat_no,
      street,
      state,
      city,
      password,
      password_confirmation
    };
  
    fetch("https://booking.hwzthat.com/api/user-registration", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    })
    .then(response => response.json())
    .then(data => {
      if (data.status === "Success") {
        alert(data.errormessage);
        window.location.href = "login.html";
      } else {
        alert("Registration failed: " + data.errormessage);
      }
    })
    .catch(error => {
      alert("An error occurred: " + error.message);
    });
  }
  
  document.addEventListener("DOMContentLoaded", () => {
    const registerButton = document.querySelector(".big-red-button");
    registerButton.addEventListener("click", registerUser);
  });
  