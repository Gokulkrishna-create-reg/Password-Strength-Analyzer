
const passwordInput = document.getElementById("password");
const toggleBtn = document.getElementById("toggleBtn");
const strengthBar = document.getElementById("strengthBar");
const strengthText = document.getElementById("strengthText");
const feedback = document.getElementById("feedback");
const generateBtn = document.getElementById("generateBtn");

// Checklist elements
const lengthCheck = document.getElementById("length");
const lowercaseCheck = document.getElementById("lowercase");
const uppercaseCheck = document.getElementById("uppercase");
const numberCheck = document.getElementById("number");
const symbolCheck = document.getElementById("symbol");

// Update checklist status
function updateCheck(element, passed) {
    element.classList.toggle("valid", passed);
}

// Analyze password whenever user types
function analyzePassword() {
    const password = passwordInput.value;

    const hasLength = Array.from(password).length >= 12;
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);

    // Update checklist
    updateCheck(lengthCheck, hasLength);
    updateCheck(lowercaseCheck, hasLowercase);
    updateCheck(uppercaseCheck, hasUppercase);
    updateCheck(numberCheck, hasNumber);
    updateCheck(symbolCheck, hasSymbol);

    // Empty password handling
    if (password.length === 0) {
        strengthBar.style.width = "0%";
        strengthBar.style.backgroundColor = "#64748b";
        strengthText.textContent = "Strength: Not checked";
        feedback.textContent =
            "Enter a sample password to begin.";
        return;
    }

    // Check for common patterns
const hasCommonPattern =
    /password|qwerty|123456|letmein|admin/i.test(password);

const hasSequentialPattern =
    /(?:0123|1234|2345|3456|4567|5678|6789|abcd|bcde|cdef|qwer)/i
        .test(password);
const hasCommonWeakWord =
    /welcome|iloveyou|monkey|dragon/i.test(password);

    const hasRepeatedCharacters =
        /(.)\1{3,}/.test(password);

    // Calculate a simple educational score
    let score = 0;

    if (hasLength) score++;
    if (hasLowercase) score++;
    if (hasUppercase) score++;
    if (hasNumber) score++;
    if (hasSymbol) score++;

  // Penalize obvious weaknesses
if (hasCommonPattern || hasCommonWeakWord) {
    score -= 2;
}

if (hasSequentialPattern) {
    score -= 1;
}

if (hasRepeatedCharacters) {
    score -= 1;
}

score = Math.max(0, Math.min(5, score));

// Display strength result
let strength;
let color;
let width;
let message;

if (
    hasCommonPattern ||
    hasCommonWeakWord ||
    hasSequentialPattern ||
    password.length < 8 ||
    score <= 2
) {
    strength = "Weak";
    color = "#ff5c5c";
    width = "20%";
    message =
        "Weak password. Try a longer, less predictable password.";
} else if (score === 3) {
    strength = "Fair";
    color = "#f2bc58";
    width = "45%";
    message =
        "Fair password. Improve its length and unpredictability.";
} else if (score === 4) {
    strength = "Strong";
    color = "#55d6be";
    width = "75%";
    message =
        "Good progress! A unique, randomly generated password is preferable.";
} else {
    strength = "Very Strong";
    color = "#63e6a4";
    width = "100%";
    message =
        "All basic checks passed. This score does not guarantee security.";
}

    if (hasRepeatedCharacters) {
        message += " Avoid long runs of repeated characters.";
    }

    strengthBar.style.width = width;
    strengthBar.style.backgroundColor = color;
    strengthText.textContent = "Strength: " + strength;
    strengthText.style.color = color;
    feedback.textContent = message;
}

// Show or hide password
toggleBtn.addEventListener("click", function () {
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        toggleBtn.textContent = "Hide";
    } else {
        passwordInput.type = "password";
        toggleBtn.textContent = "Show";
    }
});

// Listen while the user types
passwordInput.addEventListener("input", analyzePassword);

// Generate a random password using the browser's
// cryptographically secure random number generator.
function generatePassword() {
    const lowercase = "abcdefghijkmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const numbers = "23456789";
    const symbols = "!@#$%^&*_-+=";

    const groups = [lowercase, uppercase, numbers, symbols];
    const allCharacters = groups.join("");
    const passwordLength = 18;
    const randomValues = new Uint32Array(passwordLength);

    crypto.getRandomValues(randomValues);

    // Ensure at least one character from each group
    const result = groups.map(function (group, index) {
        const randomValue = new Uint32Array(1);
        crypto.getRandomValues(randomValue);
        return group[randomValue[0] % group.length];
    });

    // Fill the remaining positions
    for (let i = result.length; i < passwordLength; i++) {
        result.push(
            allCharacters[randomValues[i] % allCharacters.length]
        );
    }

    // Shuffle the characters using secure random values
    for (let i = result.length - 1; i > 0; i--) {
        const randomValue = new Uint32Array(1);
        crypto.getRandomValues(randomValue);
        const j = randomValue[0] % (i + 1);

        [result[i], result[j]] = [result[j], result[i]];
    }

    return result.join("");
}

// Generate button action
generateBtn.addEventListener("click", function () {
    passwordInput.value = generatePassword();

    // Keep the password hidden initially
    passwordInput.type = "password";
    toggleBtn.textContent = "Show";

    analyzePassword();
});

const breachBtn = document.getElementById("breachBtn");
const breachResult = document.getElementById("breachResult");

breachBtn.addEventListener("click", async function () {
    const password = passwordInput.value;

    if (!password) {
        breachResult.textContent = "Please enter a sample password first.";
        return;
    }

    if (!window.crypto || !window.crypto.subtle) {
        breachResult.textContent =
            "Secure browser context required. Open the site using localhost or HTTPS.";
        return;
    }

    breachBtn.disabled = true;
    breachResult.textContent = "Checking password safety...";

    try {
        // Create a SHA-1 hash locally for the breach lookup.
        const data = new TextEncoder().encode(password);
        const hashBuffer = await crypto.subtle.digest("SHA-1", data);

        const hash = Array.from(new Uint8Array(hashBuffer))
            .map(byte => byte.toString(16).padStart(2, "0"))
            .join("")
            .toUpperCase();

        // Send only the first five hash characters to the service.
        const prefix = hash.slice(0, 5);
        const suffix = hash.slice(5);

        const response = await fetch(
            `https://api.pwnedpasswords.com/range/${prefix}`,
            {
                headers: {
                    "Add-Padding": "true"
                }
            }
        );

        if (!response.ok) {
            throw new Error("Password check service unavailable.");
        }

        const results = await response.text();

        const match = results.split(/\r?\n/).find(line => {
            const parts = line.trim().split(":");
            return parts[0] === suffix;
        });

        if (match) {
            const count = Number(match.split(":")[1]);

            breachResult.textContent =
                `Warning: This password hash appears in known breach data. ` +
                `Reported occurrences: ${count.toLocaleString()}. Choose a different password.`;

            breachResult.style.color = "#ff7777";
        } else {
            breachResult.textContent =
                "No match found in this database. This does not guarantee that the password is safe.";

            breachResult.style.color = "#63e6a4";
        }
    } catch (error) {
        breachResult.textContent =
            "Unable to complete the check. Verify your internet connection and try again.";

        breachResult.style.color = "#f2bc58";
    } finally {
        breachBtn.disabled = false;
    }
});