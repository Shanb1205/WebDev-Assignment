document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('patientForm');
    const patientList = document.getElementById('patientList');
    const successMessageDiv = document.getElementById('successMessage'); 
    let patients = JSON.parse(localStorage.getItem('patients')) || []; 
    const dobInput = document.getElementById('DOB');
    const patientSearchInput = document.getElementById('patientSearchInput');

    // New validation function specifically for the DOB field
    function validateDOB() {
        const dob = dobInput.value;
        if (!validateInput(dobInput)) return false;

        const selectedDate = new Date(dob);
        const today = new Date();
        // Set time to 00:00:00 for accurate day comparison
        today.setHours(0, 0, 0, 0); 
        selectedDate.setHours(0, 0, 0, 0);

        if (selectedDate > today) {
            displayError('DOB', "Date of Birth cannot be in the future.");
            return false;
        }
        return true;
    }

    function validateLastNameCustom() {
        const lastnameInput = document.getElementById('lastname');
        const lastname = lastnameInput.value.trim();
        if (!validateInput(lastnameInput)) { return false; }
        if (lastname.charAt(0) === '-' || lastname.charAt(0) === "'" || lastname.charAt(lastname.length - 1) === '-' || lastname.charAt(lastname.length - 1) === "'") {
            displayError('lastname', "Last name cannot start or end with a hyphen or quote.");
            return false;
        }
        if (lastname.includes("--") || lastname.includes("''") || lastname.includes("'-") || lastname.includes("-'")) {
            displayError('lastname', "Hyphens and quotes cannot be adjacent.");
            return false;
        }
        const hyphenCount = (lastname.match(/-/g) || []).length;
        const quoteCount = (lastname.match(/'/g) || []).length;
        if (hyphenCount > 1) {
            displayError('lastname', "Last name can contain a maximum of one hyphen.");
            return false;
        }
        if (quoteCount > 2) {
            displayError('lastname', "Last name can contain a maximum of two single quotes.");
            return false;
        }
        return true; 
    }

    // Set the HTML max attribute to today's date
    const todayString = new Date().toISOString().split('T')[0];
    if (dobInput) {
        dobInput.setAttribute('max', todayString);
    }

    function displaySuccessMessage() {
        successMessageDiv.style.display = 'block'; 
        setTimeout(() => {
            successMessageDiv.style.display = 'none';
        }, 3000); 
    }

    function renderPatients() {
        patientList.innerHTML = ''; 
        patients.forEach(patient => {
            const row = document.createElement('tr');
            const bmiDisplay = patient.bmi || calculateBMI(patient.weight, patient.height);

            row.innerHTML = `
                <td>${patient.id}</td><td>${patient.firstname}</td>
                <td>${patient.lastname}</td><td>${patient.age}</td>
                <td>${patient.DOB}</td><td>${patient.gender}</td>
                <td>${patient.height}cm</td><td>${patient.weight}kg</td>
                <td>${patient.contact}</td><td>${patient.email}</td>
            `;
            patientList.appendChild(row);
        }); 
    }
    
    // Main Form Submission Handler

    form.addEventListener('submit', (e) => {
        e.preventDefault(); 
        let allValid = true;
        
        inputs.forEach(input => {
             if (input.id === 'lastname') { if (!validateLastNameCustom()) allValid = false; } 
             else if (input.id === 'DOB') { if (!validateDOB()) allValid = false; }
             else { if (!validateInput(input)) allValid = false; }
        });

        if (allValid) {
            const formData = {
                firstname: document.getElementById('firstname').value,
                lastname: document.getElementById('lastname').value,
                age: document.getElementById('age').value,
                DOB: document.getElementById('DOB').value,
                gender: document.getElementById('gender').value,
                height: document.getElementById('height').value,
                weight: document.getElementById('weight').value,
                contact: document.getElementById('contact').value,
                email: document.getElementById('email').value,
            };

            localStorage.setItem('patients', JSON.stringify(patients));
            renderPatients();
            form.reset();
            displaySuccessMessage();
        }
    });

    renderPatients(); 
});