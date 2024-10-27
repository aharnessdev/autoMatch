// navbar.js

// Function to initialize mobile menu
function initMobileMenu() {
  const mobileMenuButton = document.getElementById('mobile-menu-button');
  const mobileMenu = document.getElementById('mobile-menu');
  const closeButton = document.getElementById('close-menu-button');
  
  if (mobileMenuButton && mobileMenu && closeButton) {
    mobileMenuButton.addEventListener('click', () => {
      mobileMenu.classList.add('active');
      document.body.classList.add('overflow-hidden');
    });
    
    closeButton.addEventListener('click', () => {
      mobileMenu.classList.remove('active');
      document.body.classList.remove('overflow-hidden');
    });
  }
}
