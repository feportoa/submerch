
const div = document.querySelector('#division');

window.addEventListener('load', () => {
    loadAjax();
    setInterval(loadAjax, 3000);
});

function loadAjax() {
    const xhr = new XMLHttpRequest();

    xhr.open('GET', '/products/', true);

    xhr.onload = function() {
        if (this.status === 200) {
            let products = JSON.parse(this.responseText);

            div.textContent = '';
            products.forEach(element => {
                const card = document.createElement("h1");
                card.setAttribute('class', 'display-4');
                card.style = "display: inline;";
                
                const bold = document.createElement("b");
                bold.textContent = element.name + " ";

                const thumb = document.createElement("img");
                thumb.src = element.url;
                thumb.alt = element.alt_text;
                thumb.style = "display: inline;";
                
                const email = document.createElement("small");
                email.setAttribute('class', 'text-muted');
                email.textContent = element.description;

                const deleteBtn = document.createElement("button");
                
                // Bootstrap style 
                deleteBtn.setAttribute('class', `delete-btn btn btn-danger`);
                deleteBtn.setAttribute('id', element.product_id);

                // Adding functionality
                deleteBtn.onclick = async () => await deleteItem(element.product_id);
                deleteBtn.textContent = "Delete user";
                
                // Append and show everything
                card.append(bold);
                card.append(email);
                card.append(deleteBtn);
                card.append(document.createElement("hr"));
                div.append(thumb);
                div.append(card);
            });
        }
    }
    xhr.send();
};

async function deleteItem(productId) {
    try {
        let productCheck = window.prompt(`Deleting this user means deleting all its' children. Retype "product-${productId}" to continue.`);

        if (productCheck != `product-${productId}`) return;

        console.log("Product id checked successfully.")

        const response = await fetch('/products/removeProduct', {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: productId, forceDelete: true })
        });

        if (!response.ok) {
            const errorData = response.json();
            throw new Error(errorData.error);
        } else{
            console.log("Product delete successfully.");
            window.location.reload();
        } 
    } catch (err) {
        throw err;
    }
}