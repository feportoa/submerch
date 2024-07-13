const div = document.querySelector('#division');

window.addEventListener('load', () => {
    loadAjax();
    setInterval(loadAjax, 3000);
});

function loadAjax() {
    const xhr = new XMLHttpRequest();

    xhr.open('GET', '/api/allUsers', true);

    xhr.onload = function() {
        if (this.status === 200) {
            let users = JSON.parse(this.responseText);

            div.textContent = '';
            users.forEach(element => {
                var card = document.createElement("h1");
                card.setAttribute('class', 'display-4');
                const bold = document.createElement("b");
                bold.textContent = element.name + " ";

                card.append(bold);

                const email = document.createElement("small");
                email.setAttribute('class', 'text-muted');
                email.textContent = element.email;

                card.append(email);
                card.append(document.createElement("hr"));
                div.append(card);
            });
        }
    }

    xhr.send();
};