const div = document.querySelector('#division');

window.addEventListener('load', () => {
    loadAjax();
    setInterval(loadAjax, 3000);
});

function loadAjax() {
    const xhr = new XMLHttpRequest();

    xhr.open('GET', '/users/', true);

    xhr.onload = function() {
        if (this.status === 200) {
            let users = JSON.parse(this.responseText);

            div.textContent = '';
            users.forEach(element => {
                const card = document.createElement("h1");
                card.setAttribute('class', 'display-4');
                const bold = document.createElement("b");
                bold.textContent = element.name + " ";

                card.append(bold);

                const email = document.createElement("small");
                email.setAttribute('class', 'text-muted');
                email.textContent = element.email;

                const deleteBtn = document.createElement("button");

                // Bootstrap style 
                deleteBtn.setAttribute('class', `delete-btn btn btn-danger`);
                deleteBtn.setAttribute('id', element.id);

                // Adding functionality
                deleteBtn.onclick = async () => await deleteItem(element.email);
                deleteBtn.textContent = "Delete user";

                // Append and show everything
                card.append(email);
                card.append(deleteBtn);
                card.append(document.createElement("hr"));
                div.append(card);
            });
        }
    }
    xhr.send();
};

async function deleteItem(userEmail) {
    try {
        let emailCheck = window.prompt(`Deleting this user means deleting all its' children. Retype ${userEmail} to continue.`);

        if (emailCheck != userEmail) return;

        console.log("Email checked successfully.")

        const response = await fetch('/users/removeUser', {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: userEmail, forceDelete: true })
        });

        if (!response.ok) {
            const errorData = response.json();
            throw new Error(errorData.error);
        } else{
            console.log("Delete user with email " + userEmail);
            window.location.reload();
        } 
    } catch (err) {
        throw err;
    }
}