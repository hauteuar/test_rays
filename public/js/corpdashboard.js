function showSection(sectionId) {
    // Hide all sections by setting their display to 'none'
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';  // Ensure all sections are hidden
    });

    // Find the section by ID
    const sectionToShow = document.getElementById(sectionId);

    // Check if the section exists
    if (sectionToShow) {
        // Show the selected section
        sectionToShow.classList.add('active');
        sectionToShow.style.display = 'block';  // Show the current section
    } else {
        console.error(`No section found with id: ${sectionId}`);
    }
}




document.getElementById('addOrgForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch('/api/orgcontrol', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (response.ok) {
            alert('Organization added successfully');
            location.reload();  // Refresh to show the new organization in the edit list
        } else {
            alert(result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    }
});

async function editOrganization(orgId) {
    if (orgId) {
        try {
            const response = await fetch(`/api/organizations/edit/get/${orgId}`);

            if (response.headers.get('content-type')?.includes('application/json')) {
                const organization = await response.json();
                console.log('Organization data:', organization);

                if (response.ok) {
                    // Populate the form fields with organization details
                    document.getElementById('orgId').value = orgId;  // Set the hidden input value
                    document.getElementById('orgName').value = organization.name || '';
                    document.getElementById('orgDomain').value = organization.domain || '';
                    document.getElementById('orgThemeColor').value = organization.theme_color || '';
                    document.getElementById('orgLogo').value = organization.logo || '';

                    // Show the edit organization modal
                    showModal('editOrganizationModal');
                } else {
                    console.error('Failed to fetch organization details:', response.statusText);
                }
            } else {
                const errorText = await response.text();
                console.error('Unexpected response format:', errorText);
            }
        } catch (error) {
            console.error('Error fetching organization details:', error);
        }
    } else {
        console.error('No orgId provided');
    }
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Handle form submission in the modal
document.getElementById('editOrgForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    
    const orgId = document.getElementById('orgId').value;  // Get the orgId from the hidden input
    
    // Extracting form data into variables
    const name = document.getElementById('orgName').value;
    const domain = document.getElementById('orgDomain').value;
    const theme_color = document.getElementById('orgThemeColor').value;
    const logo = document.getElementById('logoOrg').files[0]; // Assuming there's an input with id="orgLogo" for the file
    console.log(logo);
    // Creating a FormData object to handle file uploads
    const formData = new FormData();
    formData.append('name', name);
    formData.append('domain', domain);
    formData.append('theme_color', theme_color);
   // formData.append('logo', logo);
    if (logo) {
        formData.append('logo', logo);
    }

    // Logging for debugging
    console.log('Name:', name);
    console.log('Domain:', domain);
    console.log('Theme Color:', theme_color);
    if (logo) {
        console.log('Logo:', logo);
    }

    try {
        const response = await fetch(`/api/organizations/test/edit/${orgId}`, {
            method: 'POST',
            body: formData // FormData handles both text fields and files
        });
        
        const result = await response.json();
        if (response.ok) {
            alert('Organization updated successfully');
            closeModal('editOrganizationModal'); // Close the modal
            location.reload();  // Refresh the page to show updated details
        } else {
            alert(result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    }
});




async function saveControls(role) {
    const selectedOrg = document.getElementById(`${role}OrgSelect`).value;
    const controls = Array.from(document.querySelectorAll(`#${role}ControlsList input[name="controls"]:checked`))
        .map(input => input.value);

    try {
        const response = await fetch(`/api/orgcontrol/${selectedOrg}/controls`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ role, controls })
        });
        const result = await response.json();
        if (response.ok) {
            alert(`${role.charAt(0).toUpperCase() + role.slice(1)} controls saved successfully`);
        } else {
            alert(result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    }
}
