// ============= USER REGISTRATION & DUPLICATE CHECK =============

// Get all registered users from localStorage
function getUsersFromStorage() {
    const usersData = localStorage.getItem("registeredUsers");
    return usersData ? JSON.parse(usersData) : [];
}

// Check if a user with this email already exists
function isDuplicateUser(email) {
    const users = getUsersFromStorage();
    return users.some(user => user.email.toLowerCase() === email.toLowerCase());
}

// Add a new user to localStorage
function addUserToStorage(user) {
    const users = getUsersFromStorage();
    users.push(user);
    localStorage.setItem("registeredUsers", JSON.stringify(users));
}

// ============= VALIDATION FUNCTIONS =============

// names fields validation
function validateFirstname(firstname){
    const firstnameRegex = /^[A-Z][a-zA-Z]*$/;
    return firstnameRegex.test(firstname.trim());
}
function validateLastname(lastname){
    const lastnameRegex = /^[A-Z][a-zA-Z]*$/;
    return lastnameRegex.test(lastname.trim());
}
// email address validation
function validateEmail(email){
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.trim());
}
// Phone number validation
function validatePhone(phone){
    const phoneRegex = /^\+\d{1,3}\d{10}$/;
    return phoneRegex.test(phone.trim());
}
// Data submission
const contactForm = document.getElementById("contactForm");
if (contactForm) {
    contactForm.addEventListener("submit", function(event) {
        event.preventDefault(); // Prevents page refresh

        const firstname = document.getElementById("firstname").value;
        const lastname = document.getElementById("lastname").value;
        const email = document.getElementById("email").value;
        const phone = document.getElementById("phone").value;

        const errors = [];
        if (!validateFirstname(firstname)) {
            errors.push("First name must start with a capital letter and contain only letters.");
        }
        if (!validateLastname(lastname)) {
            errors.push("Last name must start with a capital letter and contain only letters.");
        }
        if (!validateEmail(email)) {
            errors.push("Email must be a valid address, for example user@example.com.");
        }
        if (!validatePhone(phone)) {
            errors.push("Phone number must start with +countrycode and include 10 digits, for example +1230123456789.");
        }

        if (errors.length) {
            alert(errors.join("\n"));
            return;
        }

        localStorage.setItem("firstname", firstname.trim());
        localStorage.setItem("lastname", lastname.trim());
        localStorage.setItem("email", email.trim());
        localStorage.setItem("phone", phone.trim());

        document.getElementById("contactForm").reset();

        alert("Form submitted successfully.");
        console.log(contactForm);

    });
} else {
    console.error("contactForm element not found in the page.");
}

// ============= REGISTRATION FORM HANDLER =============
const registrationForm = document.getElementById("registrationForm");
if (registrationForm) {
    // Real-time duplicate email check
    const emailInput = document.getElementById("email");
    if (emailInput) {
        emailInput.addEventListener("blur", function() {
            const email = this.value.trim();
            const emailError = document.getElementById("emailError");

            if (email && validateEmail(email)) {
                if (isDuplicateUser(email)) {
                    emailError.textContent = "This email is already registered. Please use a different email.";
                    emailError.classList.add("show");
                    emailInput.classList.add("error");
                } else {
                    emailError.classList.remove("show");
                    emailInput.classList.remove("error");
                }
            }
        });

        emailInput.addEventListener("input", function() {
            const emailError = document.getElementById("emailError");
            emailError.classList.remove("show");
            this.classList.remove("error");
        });
    }

    // Clear errors on input for all fields
    ["firstName", "surname", "email", "phone", "password"].forEach(fieldId => {
        const inputElement = document.getElementById(fieldId);
        if (inputElement) {
            inputElement.addEventListener("input", function() {
                clearFieldError(fieldId);
            });
        }
    });
}


// ============= FIELD ERROR HELPER FUNCTIONS =============
function showFieldError(fieldId, message) {
    const inputElement = document.getElementById(fieldId);
    const errorElement = document.getElementById(fieldId + "Error");
    
    if (inputElement && errorElement) {
        inputElement.classList.add("error");
        errorElement.textContent = message;
        errorElement.classList.add("show");
    }
}

function clearFieldError(fieldId) {
    const inputElement = document.getElementById(fieldId);
    const errorElement = document.getElementById(fieldId + "Error");
    
    if (inputElement && errorElement) {
        inputElement.classList.remove("error");
        errorElement.textContent = "";
        errorElement.classList.remove("show");
    }
}

// ============= PASSWORD VISIBILITY TOGGLE =============
const togglePasswordBtn = document.getElementById("togglePassword");
if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener("click", function() {
        const passwordInput = document.getElementById("password");
        const icon = togglePasswordBtn.querySelector("i");

        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            icon.classList.remove("fa-eye");
            icon.classList.add("fa-eye-slash");
        } else {
            passwordInput.type = "password";
            icon.classList.remove("fa-eye-slash");
            icon.classList.add("fa-eye");
        }
    });
}