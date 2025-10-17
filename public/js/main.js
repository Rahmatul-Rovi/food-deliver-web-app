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
        return JSON.parse(storedUsers);
    }
    return { 'user@test.com': 'password123' }; 
}

function saveUsers() {
    localStorage.setItem('food3d_users', JSON.stringify(users));
}

// --- DOM ELEMENTS FOR AUTH/FLOW ---
const startupPage = document.getElementById('startup-page');
const mainOverlay = document.getElementById('overlay');

// --- ELEMENTS FOR LOGIN FORM ---
const loginForm = document.getElementById('login-form');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const tabLogin = document.getElementById('tab-login');

// --- ELEMENTS FOR REGISTER FORM ---
const registerForm = document.getElementById('register-form');
const registerEmailInput = document.getElementById('register-email');
const registerPasswordInput = document.getElementById('register-password');
const tabRegister = document.getElementById('tab-register');


function showAuthTab(tabName) {
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
    const email = registerEmailInput.value.trim();
    const password = registerPasswordInput.value;

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
    
    registerEmailInput.value = '';
    registerPasswordInput.value = '';

    alert("Registration successful! You are now logged in.");
    
    loginUser(email, password);
}


function loginUser(email, password) {
    if (!email) {
        email = loginEmailInput.value.trim();
        password = loginPasswordInput.value;
    }
    
    if (!users.hasOwnProperty(email)) {
        alert("Login failed! User not found. Please register or check your email.");
        loginPasswordInput.value = '';
        return;
    }
    
    if (users[email] === password) {
        localStorage.setItem('food3d_logged_in', 'true');
        localStorage.setItem('food3d_current_user', email);

        startupPage.classList.add('hidden');
        mainOverlay.classList.remove('hidden');

        loadMenu(); 
        
        document.body.style.overflowY = 'auto'; 
        
        if (loginEmailInput) loginEmailInput.value = '';
        if (loginPasswordInput) loginPasswordInput.value = '';

    } else {
        alert("Login failed! Incorrect password.");
        loginPasswordInput.value = '';
    }
}


function logout() {
    localStorage.removeItem('food3d_logged_in');
    localStorage.removeItem('food3d_current_user');
    
    mainOverlay.classList.add('hidden');
    
    startupPage.classList.remove('hidden');
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
// III. 3D RENDER SETUP (Three.js) - UNCHANGED
// =================================================================

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); 

renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

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

const geometry = new THREE.TorusGeometry(1, 0.4, 16, 100);
const material = new THREE.MeshToonMaterial({ color: 0xff4500 });
const foodItem = new THREE.Mesh(geometry, material);
scene.add(foodItem);

camera.position.z = 5;

let scrollY = 0;
let targetX = 0;
let targetY = 0;

window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
    if (!mainOverlay.classList.contains('hidden')) { 
        targetX = scrollY * 0.0007; 
        targetY = scrollY * 0.001;
    }
});

function animate() {
    requestAnimationFrame(animate);

    foodItem.position.y = Math.sin(Date.now() * 0.001) * 0.5; 
    controls.autoRotate = scrollY === 0; 

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
// IV. CART LOGIC (Local Storage) - UNCHANGED
// =================================================================

function loadCart() {
    const storedCart = localStorage.getItem('food3d_cart');
    if (storedCart) {
        cart = JSON.parse(storedCart);
    }
    updateCartDisplay();
}

function saveCart() {
    localStorage.setItem('food3d_cart', JSON.stringify(cart));
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
    cartTotalSpan.textContent = total.toFixed(2);
    cartCountSpan.textContent = totalItems;
}

function addToCart(itemId) {
    const selectedItem = menuItems.find(item => item.id === itemId);

    if (selectedItem) {
        const existingItem = cart.find(item => item.id === itemId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ ...selectedItem, quantity: 1 });
        }

        saveCart();
        updateCartDisplay();
        console.log(`${selectedItem.name} added to cart!`);
    }
}


// =================================================================
// V. MENU & DATA LOADING - UNCHANGED
// =================================================================

async function loadMenu() {
    try {
        menuList.innerHTML = '<p class="col-span-full text-center text-orange-400">Fetching Menu from Server...</p>';
        
        const response = await fetch(`${API_URL}/api/menu`); 
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        menuItems = await response.json(); 
        
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
            Error loading menu. Please check your **Network Tab (F12)** for details. <br>
            Ensure your Node.js server is running on **http://localhost:5000**.
        </p>`;
    }
}

function renderMenu(items) {
    let htmlContent = '';
    const menuSection = document.getElementById('menu-list');

    items.forEach(item => {
        htmlContent += `
            <div class="bg-gray-800 p-5 rounded-xl shadow-2xl border-2 border-transparent hover:border-orange-500 transition duration-300 transform hover:scale-[1.02]">
                
                <img src="${item.image}" alt="${item.name}" 
                    class="h-32 w-full object-cover rounded-lg mb-4">
                
                <h3 class="text-2xl font-bold mb-1">${item.name}</h3>
                <p class="text-gray-400 mb-4">${item.description}</p>
                
                <div class="flex justify-between items-center mt-auto pt-3 border-t border-gray-700">
                    <span class="text-3xl font-extrabold text-orange-400">$${item.price.toFixed(2)}</span>
                    <button class="add-to-cart-btn bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-5 rounded-full shadow-md transition transform hover:scale-105" 
                            data-item-id="${item.id}">
                        Add to Cart
                    </button>
                </div>
            </div>
        `;
    });
    menuSection.innerHTML = htmlContent;
}


// =================================================================
// VI. EVENT LISTENERS - FINAL ROBUST VERSION (uses .closest() for reliability)
// =================================================================

// Single Listener for ALL dynamically added content (Cart/Filter/Add buttons)
document.addEventListener('click', (e) => {
    const target = e.target;
    
    // 1. FILTER BUTTON LOGIC
    // Use closest() to find the correct button element even if we click on inner text/span
    const filterButton = target.closest('.filter-btn');
    if (filterButton) {
        // Active class toggle logic
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('bg-orange-600', 'border-orange-600');
            btn.classList.add('bg-gray-700/50', 'border-transparent');
        });
        filterButton.classList.add('bg-orange-600', 'border-orange-600');
        filterButton.classList.remove('bg-gray-700/50', 'border-transparent');
        
        // Filtering logic
        const category = filterButton.dataset.category;
        const filteredItems = category === 'all' 
            ? menuItems 
            : menuItems.filter(item => item.category === category);
            
        renderMenu(filteredItems);
        return; 
    }
    
    // 2. CART ACTIONS: Add to Cart, Quantity Minus/Plus
    if (target.classList.contains('add-to-cart-btn')) {
        const itemId = parseInt(target.dataset.itemId);
        addToCart(itemId);
    } else if (target.classList.contains('qty-minus')) {
        const itemId = parseInt(target.dataset.itemId);
        changeItemQuantity(itemId, -1);
    } else if (target.classList.contains('qty-plus')) {
        const itemId = parseInt(target.dataset.itemId);
        changeItemQuantity(itemId, 1);
    } 
});

// 3. Static Listeners (These should now work because the canvas is non-blocking)
document.getElementById('cart-button').addEventListener('click', () => {
    cartSidebar.classList.remove('hidden');
});

document.getElementById('close-cart-btn').addEventListener('click', () => {
    cartSidebar.classList.add('hidden');
});

document.getElementById('place-order-btn').addEventListener('click', () => {
    if (cart.length === 0) {
        alert("Your cart is empty. Please add some food items!");
        return;
    }
    const totalAmount = cartTotalSpan.textContent;
    alert(`Order Placed Successfully!\nTotal Amount: $${totalAmount}\nThank you!`);
    
    cart = [];
    saveCart();
    updateCartDisplay();
    cartSidebar.classList.add('hidden');
});


// =================================================================
// VII. INITIALIZATION - UNCHANGED
// =================================================================

function initializeApp() {
    if (localStorage.getItem('food3d_logged_in') === 'true') {
        startupPage.classList.add('hidden');
        mainOverlay.classList.remove('hidden');
        loadMenu(); 
    } else {
        startupPage.classList.remove('hidden');
        mainOverlay.classList.add('hidden');
        showAuthTab('login');
        document.body.style.overflowY = 'hidden'; 
    }
}

initializeApp();