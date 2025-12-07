document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('patientForm');
    const patientList = document.getElementById('patientList');
    let patients = JSON.parse(localStorage.getItem('patients')) || [];

    function renderPatients() {
        patientList.innerHTML = ''; 
        patients.forEach(patient => {

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