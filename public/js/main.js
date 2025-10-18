// js/main.js

let menuItems = [];
let cart = [];

// =================================================================
// I. CONFIGURATION & AUTHENTICATION FLOW
// =================================================================

const API_URL = "http://localhost:5000";
let users = loadUsers();

function loadUsers() {
    const storedUsers = localStorage.getItem('food3d_users');
    if (storedUsers) {
        try {
            return JSON.parse(storedUsers);
        } catch (e) {
            console.warn('Failed to parse stored users, resetting.', e);
            return { 'user@test.com': 'password123' };
        }
    }
    return { 'user@test.com': 'password123' };
}

function saveUsers() {
    try {
        localStorage.setItem('food3d_users', JSON.stringify(users));
    } catch (e) {
        console.warn('Failed to save users to localStorage', e);
    }
}

// --- DOM ELEMENTS FOR AUTH/FLOW ---
// These elements exist in index.html; guard in case script runs before DOM (it shouldn't)
const startupPage = document.getElementById('startup-page');
const mainOverlay = document.getElementById('overlay');

// NEW ELEMENTS ADDED FOR DYNAMIC STARTUP VIEW
const welcomeContent = document.getElementById('welcome-content');
const authContent = document.getElementById('auth-content');
const getStartedBtn = document.getElementById('get-started-btn');

// ELEMENTS FOR LOGIN FORM
const loginForm = document.getElementById('login-form');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const tabLogin = document.getElementById('tab-login');

// ELEMENTS FOR REGISTER FORM
const registerForm = document.getElementById('register-form');
const registerEmailInput = document.getElementById('register-email');
const registerPasswordInput = document.getElementById('register-password');
const tabRegister = document.getElementById('tab-register');

function showAuthTab(tabName) {
    if (!loginForm || !registerForm || !tabLogin || !tabRegister) return;
    if (tabName === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
    } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
    }
}

function registerUser() {
    const email = registerEmailInput?.value.trim() || '';
    const password = registerPasswordInput?.value || '';

    if (!email || !password) {
        alert("Please enter both email and password for registration.");
        return;
    }
    
    if (users.hasOwnProperty(email)) {
        alert(`User '${email}' already exists. Please log in or use a different email.`);
        return;
    }
    
    users[email] = password;
    saveUsers();
    
    if (registerEmailInput) registerEmailInput.value = '';
    if (registerPasswordInput) registerPasswordInput.value = '';

    alert("Registration successful! You are now logged in.");
    
    loginUser(email, password);
}

function loginUser(email, password) {
    if (!email) {
        email = loginEmailInput?.value.trim() || '';
        password = loginPasswordInput?.value || '';
    }
    
    if (!users.hasOwnProperty(email)) {
        alert("Login failed! User not found. Please register or check your email.");
        if (loginPasswordInput) loginPasswordInput.value = '';
        return;
    }
    
    if (users[email] === password) {
        localStorage.setItem('food3d_logged_in', 'true');
        localStorage.setItem('food3d_current_user', email);

        if (startupPage) startupPage.classList.add('hidden');
        if (mainOverlay) mainOverlay.classList.remove('hidden');

        loadMenu(); 
        
        document.body.style.overflowY = 'auto'; 
        
        if (loginEmailInput) loginEmailInput.value = '';
        if (loginPasswordInput) loginPasswordInput.value = '';

    } else {
        alert("Login failed! Incorrect password.");
        if (loginPasswordInput) loginPasswordInput.value = '';
    }
}

function logout() {
    localStorage.removeItem('food3d_logged_in');
    localStorage.removeItem('food3d_current_user');
    
    if (mainOverlay) mainOverlay.classList.add('hidden');
    if (startupPage) startupPage.classList.remove('hidden');
    
    // Reset startup view
    if (authContent) authContent.classList.add('hidden');
    if (welcomeContent) welcomeContent.classList.remove('hidden');
    showAuthTab('login'); 

    window.scrollTo(0, 0); 
    document.body.style.overflowY = 'hidden'; 
}

function scrollToMenu() {
    const menuSection = document.getElementById('menu-section');
    if (menuSection) {
        menuSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function showAuthForms() {
    if (welcomeContent) welcomeContent.classList.add('hidden');
    if (authContent) authContent.classList.remove('hidden');
    showAuthTab('login'); 
}


// =================================================================
// II. DOM ELEMENTS (Existing)
// =================================================================

const container = document.getElementById('container');
const cartSidebar = document.getElementById('cart-sidebar');
const cartList = document.getElementById('cart-list');
const cartTotalSpan = document.getElementById('cart-total');
const cartCountSpan = document.getElementById('cart-count');
const menuList = document.getElementById('menu-list');


// =================================================================
// III. 3D RENDER SETUP (Three.js)
// =================================================================

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

// size renderer to window
renderer.setSize(window.innerWidth, window.innerHeight);

// append canvas if container exists
if (container) {
    // ensure the canvas doesn't block pointer events on UI
    renderer.domElement.style.pointerEvents = 'auto'; // the canvas itself can receive pointer events if needed
    container.appendChild(renderer.domElement);
}

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 2; 
controls.maxDistance = 10;
controls.autoRotate = true; 
controls.autoRotateSpeed = 0.5;

const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1.5);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

// a stylized torus to represent a food item
const geometry = new THREE.TorusGeometry(1, 0.4, 16, 100);
const material = new THREE.MeshToonMaterial({ color: 0xff4500 });
const foodItem = new THREE.Mesh(geometry, material);
scene.add(foodItem);

camera.position.z = 5;

let scrollY = 0;
let targetX = 0;
let targetY = 0;

// listen for scroll and map to small rotation offsets
window.addEventListener('scroll', () => {
    scrollY = window.scrollY || window.pageYOffset;
    if (mainOverlay && !mainOverlay.classList.contains('hidden')) { 
        targetX = scrollY * 0.0007; 
        targetY = scrollY * 0.001;
    }
});

function animate() {
    requestAnimationFrame(animate);

    // subtle floating
    foodItem.position.y = Math.sin(Date.now() * 0.001) * 0.5; 
    // enable autoRotate only when at top (gives restful motion if user hasn't scrolled)
    controls.autoRotate = (scrollY === 0); 

    // smooth rotation interpolation
    foodItem.rotation.x += (targetX - foodItem.rotation.x) * 0.1;
    foodItem.rotation.y += (targetY - foodItem.rotation.y) * 0.1;
    
    controls.update();
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();


// =================================================================
// IV. CART LOGIC (Local Storage)
// =================================================================

function loadCart() {
    const storedCart = localStorage.getItem('food3d_cart');
    if (storedCart) {
        try {
            cart = JSON.parse(storedCart);
        } catch (e) {
            console.warn('Failed to parse cart from localStorage', e);
            cart = [];
        }
    } else {
        cart = [];
    }
    updateCartDisplay();
}

function saveCart() {
    try {
        localStorage.setItem('food3d_cart', JSON.stringify(cart));
    } catch (e) {
        console.warn('Failed to save cart to localStorage', e);
    }
}

function changeItemQuantity(itemId, change) {
    const itemIndex = cart.findIndex(item => item.id === itemId);

    if (itemIndex > -1) {
        cart[itemIndex].quantity += change;
        if (cart[itemIndex].quantity <= 0) {
            cart.splice(itemIndex, 1);
        }

        saveCart();
        updateCartDisplay();
    }
}

function updateCartDisplay() {
    let total = 0;
    let totalItems = 0;
    let listHTML = '';

    if (!cartList) return;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        totalItems += item.quantity;

        listHTML += `
            <div class="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                <div class="flex flex-col">
                    <span class="font-semibold">${item.name}</span>
                    <span class="text-sm text-orange-400">$${item.price.toFixed(2)} each</span>
                </div>
                <div class="flex items-center space-x-2">
                    <button class="qty-minus text-white bg-gray-600 hover:bg-red-500 rounded-full w-6 h-6 leading-none" data-item-id="${item.id}">-</button>
                    <span class="text-lg">${item.quantity}</span>
                    <button class="qty-plus text-white bg-gray-600 hover:bg-green-500 rounded-full w-6 h-6 leading-none" data-item-id="${item.id}">+</button>
                </div>
                <span class="text-lg font-bold text-orange-400">$${itemTotal.toFixed(2)}</span>
            </div>
        `;
    });

    cartList.innerHTML = listHTML || '<p class="text-gray-400 text-center py-4">Your cart is empty.</p>';

    // ensure cart total has consistent $ format
    if (cartTotalSpan) cartTotalSpan.textContent = `$${total.toFixed(2)}`;
    if (cartCountSpan) cartCountSpan.textContent = totalItems;
}

function addToCart(itemId) {
    const selectedItem = menuItems.find(item => item.id === itemId);

    if (selectedItem) {
        const existingItem = cart.find(item => item.id === itemId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            // shallow copy: also ensure price is number
            cart.push({ ...selectedItem, quantity: 1, price: Number(selectedItem.price) });
        }

        saveCart();
        updateCartDisplay();
        console.log(`${selectedItem.name} added to cart!`);
    } else {
        console.warn('Tried to add item not found in menu:', itemId);
    }
}


// =================================================================
// V. MENU & DATA LOADING
// =================================================================

async function loadMenu() {
    if (!menuList) return;
    try {
        menuList.innerHTML = '<p class="col-span-full text-center text-orange-400">Fetching Menu from Server...</p>';
        
        const response = await fetch(`${API_URL}/api/menu`); 
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        menuItems = await response.json(); 
        
        // ensure numeric prices
        menuItems = menuItems.map(it => ({ ...it, price: Number(it.price) }));

        renderMenu(menuItems); 
        loadCart(); 
        
        const allItemsButton = document.querySelector('.filter-btn[data-category="all"]');
        if (allItemsButton) {
            allItemsButton.classList.add('bg-orange-600');
            allItemsButton.classList.remove('bg-gray-700/50');
        }

    } catch (error) {
        console.error('Failed to load menu:', error);
        menuList.innerHTML = `<p class="col-span-full text-center text-red-500">
            Error loading menu. Please check your <strong>Network Tab (F12)</strong> and ensure your server is running at <strong>http://localhost:5000</strong>.
        </p>`;
    }
}

function renderMenu(items) {
    if (!menuList) return;
    let htmlContent = '';

    items.forEach(item => {
        const imageSrc = item.image || 'food1.png';
        const description = item.description || '';
        const price = typeof item.price === 'number' ? item.price.toFixed(2) : Number(item.price || 0).toFixed(2);

        htmlContent += `
            <div class="bg-gray-800 p-5 rounded-xl shadow-2xl border-2 border-transparent hover:border-orange-500 transition duration-300 transform hover:scale-[1.02]">
                
                <img src="${imageSrc}" alt="${item.name}" 
                    class="h-32 w-full object-cover rounded-lg mb-4">
                
                <h3 class="text-2xl font-bold mb-1">${item.name}</h3>
                <p class="text-gray-400 mb-4">${description}</p>
                
                <div class="flex justify-between items-center mt-auto pt-3 border-t border-gray-700">
                    <span class="text-3xl font-extrabold text-orange-400">$${price}</span>
                    <button class="add-to-cart-btn bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-5 rounded-full shadow-md transition transform hover:scale-105" 
                            data-item-id="${item.id}">
                        Add to Cart
                    </button>
                </div>
            </div>
        `;
    });

    menuList.innerHTML = htmlContent || '<p class="col-span-full text-center text-gray-400">No menu items found.</p>';
}


// =================================================================
// VI. EVENT LISTENERS
// =================================================================

// Use event delegation for dynamic buttons
document.addEventListener('click', (e) => {
    const target = e.target;
    if (!target) return;

    // filter button (closest handles clicking inner spans)
    const filterButton = target.closest ? target.closest('.filter-btn') : null;
    if (filterButton) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('bg-orange-600', 'border-orange-600');
            btn.classList.add('bg-gray-700/50', 'border-transparent');
        });
        filterButton.classList.add('bg-orange-600', 'border-orange-600');
        filterButton.classList.remove('bg-gray-700/50', 'border-transparent');
        
        const category = filterButton.dataset.category;
        const filteredItems = category === 'all' 
            ? menuItems 
            : menuItems.filter(item => item.category === category);
            
        renderMenu(filteredItems);
        return;
    }
    
    // Add to cart
    const addBtn = target.closest ? target.closest('.add-to-cart-btn') : null;
    if (addBtn) {
        const itemId = parseInt(addBtn.dataset.itemId);
        if (!Number.isNaN(itemId)) addToCart(itemId);
        return;
    }

    // Qty minus/plus (cart)
    const minusBtn = target.closest ? target.closest('.qty-minus') : null;
    if (minusBtn) {
        const itemId = parseInt(minusBtn.dataset.itemId);
        if (!Number.isNaN(itemId)) changeItemQuantity(itemId, -1);
        return;
    }
    const plusBtn = target.closest ? target.closest('.qty-plus') : null;
    if (plusBtn) {
        const itemId = parseInt(plusBtn.dataset.itemId);
        if (!Number.isNaN(itemId)) changeItemQuantity(itemId, 1);
        return;
    }
});

// Static UI listeners with guards
const cartButton = document.getElementById('cart-button');
if (cartButton) {
    cartButton.addEventListener('click', () => {
        if (cartSidebar) cartSidebar.classList.remove('hidden');
    });
}

const closeCartBtn = document.getElementById('close-cart-btn');
if (closeCartBtn) {
    closeCartBtn.addEventListener('click', () => {
        if (cartSidebar) cartSidebar.classList.add('hidden');
    });
}

const placeOrderBtn = document.getElementById('place-order-btn');
if (placeOrderBtn) {
    placeOrderBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            alert("Your cart is empty. Please add some food items!");
            return;
        }
        // cartTotalSpan now includes the $ prefix, so read it directly
        const totalAmountText = cartTotalSpan ? cartTotalSpan.textContent : `$0.00`;
        alert(`Order Placed Successfully!\nTotal Amount: ${totalAmountText}\nThank you!`);
        
        cart = [];
        saveCart();
        updateCartDisplay();
        if (cartSidebar) cartSidebar.classList.add('hidden');
    });
}

// GET STARTED button -> show auth forms
if (getStartedBtn) {
    getStartedBtn.addEventListener('click', showAuthForms);
}


// =================================================================
// VII. INITIALIZATION
// =================================================================

function initializeApp() {
    // make sure UI overflow is correct
    if (localStorage.getItem('food3d_logged_in') === 'true') {
        if (startupPage) startupPage.classList.add('hidden');
        if (mainOverlay) mainOverlay.classList.remove('hidden');
        loadMenu(); 
    } else {
        if (startupPage) startupPage.classList.remove('hidden');
        if (mainOverlay) mainOverlay.classList.add('hidden');
        document.body.style.overflowY = 'hidden'; 
        
        if (welcomeContent) welcomeContent.classList.remove('hidden');
        if (authContent) authContent.classList.add('hidden');
    }
}

initializeApp();
