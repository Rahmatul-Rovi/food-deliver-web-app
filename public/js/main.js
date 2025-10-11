
let menuItems = [];
let cart = [];

// =================================================================
// I. CONFIGURATION
// =================================================================

// 1. API URL: Use http://localhost:5000 for local testing
const API_URL = "http://localhost:5000"; 

// public/js/main.js: (Add this to the very top)

// --- Authentication Check ---
if (localStorage.getItem('food3d_logged_in') !== 'true') {
    // If not logged in, redirect to the login page (auth.html)
    window.location.href = '/auth.html'; 
}

// Optional: Add a logout button function to the global scope or a button listener
function logout() {
    localStorage.removeItem('food3d_logged_in');
    window.location.href = '/auth.html';
}

// You need to add an actual <button onclick="logout()">Logout</button> 
// to your index.html header for this to work.


// =================================================================
// II. DOM ELEMENTS
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

// 3D Model: Torus (Donut)
const geometry = new THREE.TorusGeometry(1, 0.4, 16, 100);
const material = new THREE.MeshToonMaterial({ color: 0xff4500 });
const foodItem = new THREE.Mesh(geometry, material);
scene.add(foodItem);

camera.position.z = 5;

// --- D. Scroll and Camera Logic ---
let scrollY = 0;
let targetX = 0;
let targetY = 0;

window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
    targetX = scrollY * 0.0007; 
    targetY = scrollY * 0.001;
});

function animate() {
    requestAnimationFrame(animate);

    foodItem.position.y = Math.sin(Date.now() * 0.001) * 0.5; 
    controls.autoRotate = scrollY === 0; 

    // Apply scroll-based rotation
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
            cart.splice(itemIndex, 1); // Remove item if quantity is 0
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
// V. MENU & DATA LOADING
// =================================================================

async function loadMenu() {
    try {
        menuList.innerHTML = '<p class="col-span-full text-center text-orange-400">Fetching Menu from Server...</p>';
        
        // Use the defined API_URL
        const response = await fetch(`${API_URL}/api/menu`); 
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        menuItems = await response.json(); 
        
        renderMenu(menuItems); 
        loadCart(); 
        // Set 'All Items' button as active
        document.querySelector('.filter-btn[data-category="all"]').classList.add('bg-orange-600');
        document.querySelector('.filter-btn[data-category="all"]').classList.remove('bg-gray-700/50');

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
                <div class="h-32 bg-gray-700 rounded-lg mb-4 flex items-center justify-center text-gray-500">
                    <span class="text-xl">Image/3D View Placeholder</span>
                </div>
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
// VI. EVENT LISTENERS
// =================================================================

// 1. 'Add to Cart' and Quantity Control buttons
document.addEventListener('click', (e) => {
    const target = e.target;
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

// 2. Cart button (Open)
document.getElementById('cart-button').addEventListener('click', () => {
    cartSidebar.classList.remove('hidden');
});

// 3. Cart button (Close)
document.getElementById('close-cart-btn').addEventListener('click', () => {
    cartSidebar.classList.add('hidden');
});

// 4. Place Order button (Mock Checkout)
document.getElementById('place-order-btn').addEventListener('click', () => {
    if (cart.length === 0) {
        alert("Your cart is empty. Please add some food items!");
        return;
    }
    const totalAmount = cartTotalSpan.textContent;
    alert(`Order Placed Successfully!\nTotal Amount: ${totalAmount}\nThank you!`);
    
    cart = [];
    saveCart();
    updateCartDisplay();
    cartSidebar.classList.add('hidden');
});

// 5. 'Start Exploring' Button Logic (Scroll to Menu)
const startExploringBtn = document.querySelector('.bg-orange-600.hover\\:bg-orange-700.text-xl');
if (startExploringBtn) {
    startExploringBtn.addEventListener('click', () => {
        const menuSection = document.getElementById('menu-section');
        if (menuSection) {
            menuSection.scrollIntoView({ behavior: 'smooth' });
        }
    });
}

// 6. Menu Filtering Logic
document.querySelectorAll('.filter-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        // Active class toggle logic
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('bg-orange-600', 'border-orange-600');
            btn.classList.add('bg-gray-700/50', 'border-transparent');
        });
        e.target.classList.add('bg-orange-600', 'border-orange-600');
        e.target.classList.remove('bg-gray-700/50', 'border-transparent');
        
        // Filtering logic
        const category = e.target.dataset.category;
        const filteredItems = category === 'all' 
            ? menuItems 
            : menuItems.filter(item => item.category === category);
            
        renderMenu(filteredItems);
    });
});


// =================================================================
// VII. INITIALIZATION
// =================================================================

loadMenu();