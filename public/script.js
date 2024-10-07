document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('addContactForm');
    const searchInput = document.getElementById('searchQuery');
    const clearSearchButton = document.getElementById('clearSearch');
    const filterContacts = document.getElementById('filterContacts');
    const contactList = document.getElementById('contactList');
    const errorMessage = document.createElement('div');
    errorMessage.id = 'error-message';
    errorMessage.style.color = 'red';  
    form.appendChild(errorMessage);  

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const phone = document.getElementById('phone').value;
        addContact(name, phone);
    });

    searchInput.addEventListener('input', function() {
        const query = searchInput.value.trim();
        if (query) {
            searchContacts(query);  
        } else {
            fetchContacts();  
        }
    });

    clearSearchButton.addEventListener('click', function() {
        searchInput.value = '';  
        fetchContacts();        
    });

    filterContacts.addEventListener('change', function() {
        const filterValue = filterContacts.value;
        if (filterValue === 'asc' || filterValue === 'desc') {
            filterContactsByName(filterValue);
        } else {
            fetchContacts(); 
        }
    });

    fetchContacts();  
});

function fetchContacts() {
    fetch('/contacts')
        .then(response => response.json())
        .then(displayContacts)
        .catch(error => console.error('Error fetching contacts:', error));
}

function searchContacts(query) {
    fetch(`/search?name=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(displayContacts)
        .catch(error => console.error('Error searching contacts:', error));
}

function displayContacts(contacts) {
    const contactList = document.getElementById('contactList');
    contactList.innerHTML = ''; 
    if (contacts.length === 0) {
        const noResults = document.createElement('div');
        noResults.textContent = 'No contacts found';
        noResults.className = 'no-contact';
        contactList.appendChild(noResults);
    } else {
        contacts.forEach(contact => {
            const div = document.createElement('div');
            div.className = 'contact-item'; 

            const contactInfo = document.createElement('div');
            contactInfo.className = 'contact-info'; 
            contactInfo.innerHTML = `Name: ${contact.name}, Phone: ${contact.phone}`;
            div.appendChild(contactInfo);

            const buttonGroup = document.createElement('div');
            buttonGroup.className = 'button-group';

            const editBtn = document.createElement('button');
            editBtn.className = 'edit-btn';
            editBtn.textContent = 'Edit';
            editBtn.addEventListener('click', () => editContact(contact, contactInfo, div));
            buttonGroup.appendChild(editBtn);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', function() {
                deleteContact(contact.id);
            });
            buttonGroup.appendChild(deleteBtn);

            div.appendChild(buttonGroup);
            contactList.appendChild(div);
        });
    }
}

function editContact(contact, contactInfoDiv, contactDiv) {
    contactInfoDiv.innerHTML = `
        <input type="text" id="edit-name" value="${contact.name}">
        <input type="text" id="edit-phone" value="${contact.phone}">
    `;

    const saveBtn = document.createElement('button');
    saveBtn.className = 'save-btn';
    saveBtn.textContent = 'Save';
    contactDiv.querySelector('.edit-btn').replaceWith(saveBtn);

    saveBtn.addEventListener('click', () => {
        const updatedName = document.getElementById('edit-name').value;
        const updatedPhone = document.getElementById('edit-phone').value;
        saveContact(contact.id, updatedName, updatedPhone);
    });
}

function saveContact(id, name, phone) {
    const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = '';  

    fetch(`/contacts/${id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ name, phone })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(error => { throw new Error(error.error); });
        }
        return response.json();
    })
    .then(() => {
        fetchContacts(); 
    })
    .catch(error => {
        errorMessage.textContent = error.message;  
    });
}

function addContact(name, phone) {
    const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = '';  
    fetch('/contacts', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ name, phone })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(error => { throw new Error(error.error); });
        }
        return response.json();
    })
    .then(contact => {
        fetchContacts();  
    })
    .catch(error => {
        errorMessage.textContent = error.message; 
    });
}

function deleteContact(contactId) {
    fetch(`/contacts/${contactId}`, {
        method: 'DELETE'
    })
    .then(() => {
        fetchContacts(); 
    })
    .catch(error => console.error('Error deleting contact:', error));
}

function filterContactsByName(order) {
    fetch(`/contacts?order=${order}`)
        .then(response => response.json())
        .then(displayContacts)
        .catch(error => console.error('Error filtering contacts:', error));
}
