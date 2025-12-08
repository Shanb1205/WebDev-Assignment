document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('patientForm');
    const patientList = document.getElementById('patientList');
    const successMessageDiv = document.getElementById('successMessage'); 
    let patients = JSON.parse(localStorage.getItem('patients')) || []; 
    const dobInput = document.getElementById('DOB');
    const tableHeaders = document.querySelectorAll('#patientTable th.sortable');
    const columnFilters = document.querySelectorAll('.column-filter');
    
    let editingPatientId = null; 
    let currentSortKey = 'id';
    let sortDirection = 'asc';

    // Utility and Validation Functions 
    function displayError(inputId, message) 
    { 
        const errorElement = document.getElementById(inputId + 'Error');
        if (errorElement) { errorElement.textContent = message; }
    }
    function validateInput(inputElement) 
    { 
        displayError(inputElement.id, '');
        if (!inputElement.validity.valid) { displayError(inputElement.id, inputElement.validationMessage); return false; } return true;
    }
    function validateDOB() 
    { 
        const selectedDate = new Date(dobInput.value); const today = new Date();
        today.setHours(0, 0, 0, 0); selectedDate.setHours(0, 0, 0, 0);
        if (selectedDate > today) { displayError('DOB', "Date of Birth cannot be in the future."); return false; } return true;
    }
    function validateLastNameCustom() 
    { 
        const lastnameInput = document.getElementById('lastname'); const lastname = lastnameInput.value.trim();
        if (!validateInput(lastnameInput)) { return false; }
        
        if (lastname.charAt(0) === '-' || lastname.charAt(0) === "'" || lastname.charAt(lastname.length - 1) === '-' || lastname.charAt(lastname.length - 1) === "'") 
        {
            displayError('lastname', "Last name cannot start or end with a hyphen or quote."); return false;
        } 
        if (lastname.includes("--") || lastname.includes("''") || lastname.includes("'-") || lastname.includes("-'")) 
        {
            displayError('lastname', "Hyphens and quotes cannot be adjacent."); return false;
        } 
        const hyphenCount = (lastname.match(/-/g) || []).length; const quoteCount = (lastname.match(/'/g) || []).length;
        if (hyphenCount > 1) { displayError('lastname', "Last name can contain a maximum of one hyphen."); return false; }
        if (quoteCount > 2) { displayError('lastname', "Last name can contain a maximum of two single quotes."); return false; } return true; 
    }
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach(input => 
    {
        input.addEventListener('input', () => 
        {
            if (input.id === 'lastname') { validateLastNameCustom(); } else if (input.id === 'DOB') { validateDOB(); } else if (input.value.trim() !== '') { validateInput(input); }
        });
        input.addEventListener('blur', () => 
        {
             if (input.id === 'lastname') { validateLastNameCustom(); } else if (input.id === 'DOB') { validateDOB(); } else { validateInput(input); }
        });
    });

    // Setup and Data Handling
    function generatePatientId() 
    { 
        let nextId = parseInt(localStorage.getItem('nextPatientId')) || 1000; const newId = nextId; localStorage.setItem('nextPatientId', nextId + 1); return 'P' + newId;
    }

    const todayString = new Date().toISOString().split('T');
    
    if (dobInput) { dobInput.setAttribute('max', todayString); }
    
    function calculateBMI(weightKg, heightCm) 
    { 
        const weight = parseFloat(weightKg); const heightInMeters = parseFloat(heightCm) / 100;
        if (isNaN(weight) || isNaN(heightInMeters) || heightInMeters === 0) { return "N/A"; } const bmi = weight / (heightInMeters * heightInMeters); return bmi.toFixed(1);
    }
    
    function displaySuccessMessage() 
    {
        successMessageDiv.style.display = 'block'; setTimeout(() => { successMessageDiv.style.display = 'none'; }, 3000); 
    }
    
    function highlightBmiCategory(bmi) 
    {
        document.querySelectorAll('#bmiLegendTable tr').forEach(row => { row.style.backgroundColor = ''; });
        if (bmi === "N/A") return;
        if (bmi < 18.5) { document.getElementById('underweightRow').style.backgroundColor = '#ffc0cb'; } 
        else if (bmi >= 18.5 && bmi <= 24.9) { document.getElementById('normalRow').style.backgroundColor = '#90ee90'; } 
        else if (bmi >= 25.0 && bmi <= 29.9) { document.getElementById('overweightRow').style.backgroundColor = '#ffffe0'; } 
        else if (bmi >= 30.0) { document.getElementById('obeseRow').style.backgroundColor = '#ffcccb'; }
    }

    // Search & Sort Functionality
    columnFilters.forEach(filterInput => 
    {
        filterInput.addEventListener('keyup', renderPatients);
    });
    tableHeaders.forEach(header => {
        header.addEventListener('click', () => 
        {
            const newSortKey = header.getAttribute('data-sort');
            if (newSortKey === currentSortKey) { sortDirection = (sortDirection === 'asc') ? 'desc' : 'asc'; } else { currentSortKey = newSortKey; sortDirection = 'asc'; }
            renderPatients(); 
        });
    });
    
    function filterAndSortPatients(patientsArray) 
    {
        let filtered = [...patientsArray];
        columnFilters.forEach(filterInput => {
            const filterValue = filterInput.value.toLowerCase().trim();
            if (filterValue) 
            {
                const filterKey = filterInput.id.replace('filter-', '');
                filtered = filtered.filter(patient => {
                    const patientValue = String(patient[filterKey]).toLowerCase(); return patientValue.includes(filterValue);
                });
            }
        });
        filtered.sort((a, b) => 
        {
            let valA = a[currentSortKey]; let valB = b[currentSortKey];
            if (currentSortKey === 'age' || currentSortKey === 'height' || currentSortKey === 'weight' || currentSortKey === 'bmi') {
                valA = parseFloat(valA) || 0; valB = parseFloat(valB) || 0;
            } else if (currentSortKey === 'DOB') {
                valA = new Date(valA); valB = new Date(valB);
            }
            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1; return 0;
        });
        return filtered;
    }

    // Statistics Generation Function
    function generateStatistics() 
    {
        // Average BMI grouped by sex
        const bmiBySex = patients.reduce((acc, patient) => 
        {
            const sex = patient.gender;
            const bmi = parseFloat(patient.bmi);
            if (!acc[sex]) { acc[sex] = { total: 0, count: 0 }; }
            if (!isNaN(bmi)) { acc[sex].total += bmi; acc[sex].count += 1; }
            return acc;
        }, {});

        document.getElementById('statBMIMaleAvg').textContent = bmiBySex.male?.count ? (bmiBySex.male.total / bmiBySex.male.count).toFixed(1) : 'N/A';
        document.getElementById('statBMIFemaleAvg').textContent = bmiBySex.female?.count ? (bmiBySex.female.total / bmiBySex.female.count).toFixed(1) : 'N/A';
        document.getElementById('statBMIOtherAvg').textContent = bmiBySex.other?.count ? (bmiBySex.other.total / bmiBySex.other.count).toFixed(1) : 'N/A';

        // Patient counts by BMI category
        const bmiCounts = patients.reduce((acc, patient) => {
            const bmi = parseFloat(patient.bmi);
            if (!isNaN(bmi)) {
                if (bmi < 18.5) acc.underweight++;
                else if (bmi < 25) acc.normal++;
                else if (bmi < 30) acc.overweight++;
                else acc.obese++;
            }
            return acc;
        }, { underweight: 0, normal: 0, overweight: 0, obese: 0 });

        document.getElementById('statBMIUnderweight').textContent = bmiCounts.underweight;
        document.getElementById('statBMINormal').textContent = bmiCounts.normal;
        document.getElementById('statBMIOverweight').textContent = bmiCounts.overweight;
        document.getElementById('statBMIObese').textContent = bmiCounts.obese;

        // Total Number of patients.
        document.getElementById('statTotalPatients').textContent = patients.length;

        // Total female patients aged >=50
        const femalesOver50 = patients.filter(patient => {
            const age = parseInt(patient.age);
            return patient.gender === 'female' && !isNaN(age) && age >= 50;
        }).length;

        document.getElementById('statFemaleOver50').textContent = femalesOver50;
    }

    // Edit and Delete Functionality
    window.editPatient = function(patientId) { /* ... same as before ... */
        const patientToEdit = patients.find(p => p.id === patientId);
        if (patientToEdit) {
            document.getElementById('firstname').value = patientToEdit.firstname; document.getElementById('lastname').value = patientToEdit.lastname; document.getElementById('age').value = patientToEdit.age; document.getElementById('DOB').value = patientToEdit.DOB; document.getElementById('gender').value = patientToEdit.gender; document.getElementById('height').value = patientToEdit.height; document.getElementById('weight').value = patientToEdit.weight; document.getElementById('contact').value = patientToEdit.contact; document.getElementById('email').value = patientToEdit.email;
            editingPatientId = patientId; document.querySelector('button[type="submit"]').textContent = 'Update Record'; window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
    window.deletePatient = function(patientId) {
        if (confirm(`Are you sure you want to delete Patient ID ${patientId}?`)) {
            patients = patients.filter(p => p.id !== patientId);
            localStorage.setItem('patients', JSON.stringify(patients));
            renderPatients();
            generateStatistics(); // Update stats after delete
            alert(`Patient ID ${patientId} has been successfully deleted.`);
        }
    }

    // Main Render Function
    function renderPatients() {
        patientList.innerHTML = ''; 
        const patientsToDisplay = filterAndSortPatients(patients);
        patientsToDisplay.forEach(patient => {
            const row = document.createElement('tr');
            const bmiDisplay = patient.bmi || calculateBMI(patient.weight, patient.height);
            row.innerHTML = `
                <td>${patient.id}</td>
                <td>${patient.firstname}</td>
                <td>${patient.lastname}</td>
                <td>${patient.age}</td>
                <td>${patient.DOB}</td>
                <td>${patient.gender}</td>
                <td>${patient.height}cm</td>
                <td>${patient.weight}kg</td>
                <td>${patient.contact}</td>
                <td>${patient.email}</td>
                <td>${bmiDisplay}</td>
                <td class="action-cell"><button onclick="editPatient('${patient.id}')">Edit</button></td>
                <td class="action-cell"><button onclick="deletePatient('${patient.id}')" class="delete-btn">Delete</button></td>
            `;
            patientList.appendChild(row);
            highlightBmiCategory(parseFloat(bmiDisplay)); 
        });
        generateStatistics(); // Update stats after rendering the table
    }
    
    // Main Form Submission Handler
    form.addEventListener('submit', (e) => {
        e.preventDefault(); let allValid = true;
        inputs.forEach(input => {
             if (input.id === 'lastname') { if (!validateLastNameCustom()) allValid = false; } else if (input.id === 'DOB') { if (!validateDOB()) allValid = false; } else { if (!validateInput(input)) allValid = false; }
        });
        if (allValid) {
            const formData = {
                firstname: document.getElementById('firstname').value, lastname: document.getElementById('lastname').value, age: document.getElementById('age').value, DOB: document.getElementById('DOB').value, gender: document.getElementById('gender').value, height: document.getElementById('height').value, weight: document.getElementById('weight').value, contact: document.getElementById('contact').value, email: document.getElementById('email').value,
            };
            formData.bmi = calculateBMI(formData.weight, formData.height);

            if (editingPatientId) {
                const index = patients.findIndex(p => p.id === editingPatientId); if (index !== -1) { patients[index] = { ...patients[index], ...formData }; } editingPatientId = null; document.querySelector('button[type="submit"]').textContent = 'Register Patient';
            } else { formData.id = generatePatientId(); patients.push(formData); }

            localStorage.setItem('patients', JSON.stringify(patients));
            renderPatients();
            form.reset();
            displaySuccessMessage();
        }
    });

    // Initial render when the page loads
    renderPatients(); // This calls generateStatistics the first time the page loads
});