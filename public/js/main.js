/*----- MENU -----*/
const showMenu = (toggleId,navId) =>{
    const toggle = document.getElementById(toggleId),
    nav = document.getElementById(navId)

    if(toggle && nav){
        toggle.addEventListener('click', ()=>{
            nav.classList.toggle('show')
        })
    }
}
showMenu('nav-toggle','nav-menu')

/*----- CAMBIO COLORS -----*/
const sizes = document.querySelectorAll('.size_size');
const colors = document.querySelectorAll('.sneaker_color');
const sneaker = document.querySelectorAll('.sneaker_img');

function changeSize(){
    sizes.forEach(size => size.classList.remove('active'));
    this.classList.add('active');
}

function changeColor(){
    let primary = this.getAttribute('primary');
    let color = this.getAttribute('color');
    let sneakerColor = document.querySelector(`.sneaker_img[color="${color}"]`);

    colors.forEach(c => c.classList.remove('active'));
    
    this.classList.add('active');

    document.documentElement.style.setProperty('--primary', primary);

    sneaker.forEach(s => s.classList.remove('shows'));
    sneakerColor.classList.add('shows')
}

sizes.forEach(size => size.addEventListener('click', changeSize));
colors.forEach(c => c.addEventListener('click', changeColor));


 // Função para carregar o header
 function loadHeader() {
    fetch('header.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('header-container').innerHTML = data;
        })
        .catch(error => console.log('Erro ao carregar o header:', error));
}

// Chame a função para carregar o header
loadHeader();


document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav_link');
    const currentPath = window.location.pathname;
  
    navLinks.forEach(link => {
      if (link.getAttribute('href') === currentPath) {
        link.classList.add('active');
      }
    });
  });

