const clickSound = new Audio('sounds/click.mp3');
let currentUser = null;
let tablesAvailable = 15;
const ADMIN_EMAIL = "symbat.salim@mail.ru".toLowerCase();

document.addEventListener('DOMContentLoaded', function() {
  initializeApplication();

  window.onload = function() {
    if (!sessionStorage.getItem('welcomeShown')) {
      alert("Welcome to La Dolce Vita!");
      sessionStorage.setItem('welcomeShown', 'true');
    }
  };
});

function initializeApplication() {
  checkLoginStatus();
  setupEventListeners();
  updateReservationCounter();
  updateAccountDropdown();
  loadReviews();
  renderMenu();

  document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('accountDropdown');
    if (!event.target.closest('.account-dropdown') && dropdown && dropdown.classList.contains('show')) {
      dropdown.classList.remove('show');
    }
  });
}

function checkLoginStatus() {
  const userEmail = localStorage.getItem('currentUser');
  if (userEmail) {
    const userData = localStorage.getItem(userEmail);
    if (userData) {
      currentUser = JSON.parse(userData);
      if (window.location.pathname.includes('account.html')) {
        loadAccountData();
      }
    }
  } else if (window.location.pathname.includes('account.html')) {
    window.location.href = 'rest.html';
  }
}

function toggleDropdown() {
  clickSound.currentTime = 0;
  clickSound.play();
  const dropdown = document.getElementById('accountDropdown');
  dropdown?.classList.toggle('show');
}

function updateAccountDropdown() {
  const dropdown = document.getElementById('accountDropdown');
  if (!dropdown) return;

  dropdown.innerHTML = currentUser ? `
    <li><a href="account.html">My Account</a></li>
    <li><a href="#" onclick="logout()">Logout</a></li>
  ` : `
    <li><a href="#" onclick="openModal('loginModal')">Login</a></li>
    <li><a href="#" onclick="openModal('registerModal')">Register</a></li>
  `;
}

function loadAccountData() {
  if (!currentUser) {
    window.location.href = 'rest.html';
    return;
  }

  document.getElementById('accountName').textContent = currentUser.name || 'Not set';
  document.getElementById('accountEmail').textContent = currentUser.email;

  const statusElement = document.getElementById('accountStatus');
  if (statusElement) {
    statusElement.textContent = currentUser.isAdmin ? 'Admin' : 'Member';
    statusElement.className = currentUser.isAdmin ? 'badge bg-danger' : 'badge bg-primary';
  }

  const editProfileBtn = document.getElementById('editProfileBtn');
  if (editProfileBtn) {
    editProfileBtn.addEventListener('click', function() {
      clickSound.currentTime = 0;
      clickSound.play();
      document.getElementById('editName').value = currentUser.name;
      document.getElementById('editPassword').value = '';
      document.getElementById('confirmPassword').value = '';
      document.getElementById('accountInfo').style.display = 'none';
      document.getElementById('editForm').style.display = 'block';
      editProfileBtn.style.display = 'none';
    });
  }

  const reservationsList = document.getElementById('reservations-list');
  if (reservationsList) {
    if (currentUser.reservations?.length > 0) {
      let reservationsHTML = '';
      currentUser.reservations.forEach((res, index) => {
        const reservationDate = new Date(res.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const isExpired = reservationDate < today;
        const statusClass = isExpired ? 'expired-reservation' : 'active-reservation';
        const statusText = isExpired ? ' (Expired)' : ' (Active)';
        reservationsHTML += `
          <div class="reservation-item">
            <div class="reservation-header">
              <span class="reservation-number">Reservation #${index + 1} </span>
              <span class="reservation-date">: ${res.date} at ${res.time}</span>
              <button class="btn btn-sm btn-danger delete-reservation" data-index="${index}">
                <i class="fas fa-trash"></i>
              </button>
            </div>
            <div class="reservation-details">
              <p><strong>Guests:</strong> ${res.guests}</p>
              <p><small>Booked on: ${res.createdAt}</small></p>
            </div>
          </div>`;
      });
      reservationsList.innerHTML = reservationsHTML;

      document.querySelectorAll('.delete-reservation').forEach(button => {
        button.addEventListener('click', function() {
          const index = parseInt(this.getAttribute('data-index'));
          deleteReservation(index);
        });
      });
    } else {
      reservationsList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-calendar-times"></i>
          <p>No reservations yet</p>
        </div>`;
    }
  }

  const reviewsList = document.getElementById('user-reviews-list');
  if (reviewsList) {
    if (currentUser.reviews?.length > 0) {
      let reviewsHTML = '';
      currentUser.reviews.forEach((rev, index) => {
        reviewsHTML += `
          <div class="review-item">
            <div class="review-header">
              <span class="review-number">Review #${index + 1}</span>
              <span class="review-date">: ${rev.date}</span>
              <button class="btn btn-sm btn-danger delete-review" data-index="${index}">
                <i class="fas fa-trash"></i>
              </button>
            </div>
            <div class="review-content">
              <p>"${rev.text}"</p>
            </div>
          </div>`;
      });
      reviewsList.innerHTML = reviewsHTML;

      document.querySelectorAll('.delete-review').forEach(button => {
        button.addEventListener('click', function() {
          const index = parseInt(this.getAttribute('data-index'));
          deleteReview(index);
        });
      });
    } else {
      reviewsList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-comment-slash"></i>
          <p>No reviews yet</p>
        </div>`;
    }
  }
}

function deleteReservation(index) {
  if (!currentUser?.reservations) return;

  if (confirm('Are you sure you want to delete this reservation?')) {
    currentUser.reservations.splice(index, 1);
    localStorage.setItem(currentUser.email, JSON.stringify(currentUser));
    updateTables(false);
    loadAccountData();
    alert('Reservation deleted successfully');
  }
}

function deleteReview(index) {
  if (!currentUser?.reviews) return;

  if (confirm('Are you sure you want to delete this review?')) {
    currentUser.reviews.splice(index, 1);
    localStorage.setItem(currentUser.email, JSON.stringify(currentUser));
    loadAccountData();
    alert('Review deleted successfully');
  }
}

function cancelEdit() {
  clickSound.currentTime = 0;
  clickSound.play();
  document.getElementById('accountInfo').style.display = 'block';
  document.getElementById('editForm').style.display = 'none';
  document.getElementById('editProfileBtn').style.display = 'block';
}

function saveProfileChanges() {
  clickSound.currentTime = 0;
  clickSound.play();

  const newName = document.getElementById('editName').value.trim();
  const newPassword = document.getElementById('editPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (!newName) {
    alert('Please enter your name');
    return;
  }

  if (newPassword && newPassword !== confirmPassword) {
    alert('Passwords do not match');
    return;
  }

  currentUser.name = newName;
  if (newPassword) {
    currentUser.password = newPassword;
  }

  localStorage.setItem(currentUser.email, JSON.stringify(currentUser));
  localStorage.setItem('currentUser', currentUser.email);
  loadAccountData();
  cancelEdit();
  alert('Profile updated successfully!');
}

function confirmDeleteAccount() {
  clickSound.currentTime = 0;
  clickSound.play();
  if (confirm('Are you sure you want to permanently delete your account? All your data will be lost.')) {
    deleteAccount();
  }
}

function deleteAccount() {
  localStorage.removeItem(currentUser.email);
  localStorage.removeItem('currentUser');
  currentUser = null;
  alert('Account deleted successfully');
  window.location.href = 'rest.html';
}

function handleRegister(e) {
  e.preventDefault();
  clickSound.currentTime = 0;
  clickSound.play();

  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim().toLowerCase();
  const password = document.getElementById('regPassword').value;

  if (!name || !email || !password) {
    alert('Please fill all fields!');
    return;
  }

  if (localStorage.getItem(email)) {
    alert('Email already registered!');
    return;
  }

  const isAdmin = email === ADMIN_EMAIL;

  currentUser = {
    name,
    email,
    password,
    isAdmin,
    reservations: [],
    reviews: []
  };

  localStorage.setItem(email, JSON.stringify(currentUser));
  localStorage.setItem('currentUser', email);
  updateAccountDropdown();
  closeModal('registerModal');
  document.getElementById('registerForm').reset();
  alert(`Registration successful, ${name}!${isAdmin ? ' (Admin account created)' : ''}`);

  if (window.location.pathname.includes('account.html')) {
    loadAccountData();
  }
}

function handleLogin(e) {
  e.preventDefault();
  clickSound.currentTime = 0;
  clickSound.play();

  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;
  const userData = localStorage.getItem(email);

  if (!userData) {
    alert('User not found!');
    return;
  }

  const user = JSON.parse(userData);
  if (user.password === password) {
    currentUser = user;
    localStorage.setItem('currentUser', email);
    updateAccountDropdown();
    closeModal('loginModal');
    document.getElementById('loginForm').reset();
    alert(`Welcome back, ${user.name}!`);

    if (window.location.pathname.includes('account.html')) {
      loadAccountData();
    }
  } else {
    alert('Invalid password!');
  }
}

function logout() {
  clickSound.currentTime = 0;
  clickSound.play();

  if (confirm('Are you sure you want to logout?')) {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateAccountDropdown();

    if (window.location.pathname.includes('account.html')) {
      window.location.href = 'rest.html';
    } else {
      window.location.reload();
    }
  }
}

function handleReservation(e) {
  e.preventDefault();
  clickSound.currentTime = 0;
  clickSound.play();

  if (!currentUser) {
    alert('Please login to make a reservation!');
    openModal('loginModal');
    return;
  }

  const name = document.getElementById('reserveName').value;
  const date = document.getElementById('reserveDate').value;
  const time = document.getElementById('reserveTime').value;
  const guests = document.getElementById('reserveGuests').value;

  const reservationDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (reservationDate < today) {
    alert('Please select a future date for your reservation');
    return;
  }

  const reservation = {
    name,
    date,
    time,
    guests,
    createdAt: new Date().toLocaleString()
  };

  if (!currentUser.reservations) {
    currentUser.reservations = [];
  }

  currentUser.reservations.push(reservation);
  localStorage.setItem(currentUser.email, JSON.stringify(currentUser));
  localStorage.setItem('currentUser', currentUser.email);
  updateTables(true);
  closeModal('reserveModal');
  document.getElementById('reserveForm').reset();

  const confirmationMsg = `Reservation confirmed!\nName: ${name}\nDate: ${new Date(date).toLocaleDateString()}\nTime: ${time}\nGuests: ${guests}`;
  alert(confirmationMsg);

  if (window.location.pathname.includes('account.html')) {
    loadAccountData();
  }
}

function handleReview(e) {
  e.preventDefault();
  clickSound.currentTime = 0;
  clickSound.play();

  if (!currentUser) {
    alert('Please login to submit a review!');
    openModal('loginModal');
    return;
  }
  const reviewText = document.getElementById('reviewText').value.trim();
  if (!reviewText) {
    alert('Please enter your review!');
    return;
  }
  if (reviewText.length > 500) {
    alert('Review must be less than 500 characters');
    return;
  }

  const review = {
    text: reviewText,
    date: new Date().toLocaleDateString(),
    createdAt: new Date().toLocaleString()
  };

  if (!currentUser.reviews) {
    currentUser.reviews = [];
  }

  currentUser.reviews.push(review);
  localStorage.setItem(currentUser.email, JSON.stringify(currentUser));
  localStorage.setItem('currentUser', currentUser.email);
  closeModal('reviewsModal');
  document.getElementById('reviewForm').reset();
  alert('Thank you for your review!');

  if (window.location.pathname.includes('account.html')) {
    loadAccountData();
  } else {
    loadReviews();
  }
}

function loadReviews() {
  const reviewsContainer = document.getElementById('reviewsContainer');
  if (!reviewsContainer) return;

  const allReviews = [ { userName: "Maira", text:"The pasta was absolutely delicious!", date: "2025-01-15" },
    { userName: "Ali", text: "Great atmosphere and friendly staff.", date: "2025-03-02" },
    { userName: "Inju", text: "Best Italian food in town!", date: "2025-04-18" }];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key !== 'currentUser' && key !== 'restaurantMenu' && key !== 'welcomeShown') {
      const user = JSON.parse(localStorage.getItem(key));
      if (user.reviews) {
        allReviews.push(...user.reviews.map(review => ({
          ...review,
          userName: user.name
        })));
      }
    }
  }

  allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  let reviewsHTML = '';
  allReviews.forEach(review => {
    reviewsHTML += `
      <div class="review">
        <h4>${review.userName}</h4>
        <p>"${review.text}"</p>
        <small>${review.date}</small>
      </div>`;
  });

  reviewsContainer.innerHTML = reviewsHTML || '<p>No reviews yet. Be the first to review!</p>';
}

function updateTables(reserved) {
  reserved ? tablesAvailable-- : tablesAvailable++;
  updateReservationCounter();
}

function updateReservationCounter() {
  const counter = document.getElementById('reservation-counter');
  if (counter) {
    counter.textContent = `Tables Available: ${tablesAvailable}`;
    counter.style.animation = 'none';
    void counter.offsetWidth;
    counter.style.animation = 'flash 1s';
  }
}

let menuItems = localStorage.getItem('restaurantMenu')
  ? JSON.parse(localStorage.getItem('restaurantMenu'))
  : [
    {
      category: "Appetizers",
      items: [
        { id: 1, name: "Bruschetta", description: "Toasted bread with tomatoes & basil", icon: "seedling", iconColor: "text-success" },
        { id: 2, name: "Caesar Salad", description: "Crispy romaine, croutons, parmesan & dressing", icon: "leaf", iconColor: "text-success" },
        { id: 3, name: "Sausage-Stuffed Fried Olives", description: "Crispy olives filled with spiced sausage", icon: "utensils", iconColor: "text-success" },
        { id: 4, name: "Fresh Mozzarella", description: "Creamy mozzarella served with tomatoes & basil", icon: "cheese", iconColor: "text-warning" },
        { id: 5, name: "Michael Symon's Arancini", description: "Crispy risotto balls with cheese and herbs", icon: "bread-slice", iconColor: "text-danger" }
      ]
    },
    {
      category: "Main Courses",
      items: [
        { id: 6, name: "Grilled Salmon", description: "Grilled with lemon butter and herbs", icon: "fish", iconColor: "text-primary" },
        { id: 7, name: "Swordfish Steak", description: "Thick, juicy swordfish grilled to perfection", icon: "water", iconColor: "text-info" },
        { id: 8, name: "Fettuccini Alfredo", description: "Creamy parmesan sauce over fresh pasta", icon: "pasta", iconColor: "text-warning" },
        { id: 9, name: "Pizza Margherita", description: "Tomato, mozzarella & fresh basil on classic crust", icon: "pizza-slice", iconColor: "text-danger" },
        { id: 10, name: "Steak with Vegetables", description: "Juicy grilled steak with seasonal vegetables", icon: "drumstick-bite", iconColor: "text-danger" }
      ]
    },
    {
      category: "Desserts",
      items: [
        { id: 11, name: "Chocolate Cake", description: "Rich, moist chocolate layered cake", icon: "birthday-cake", iconColor: "text-pink" },
        { id: 12, name: "Cheesecake", description: "Creamy New York style cheesecake", icon: "cheese", iconColor: "text-warning" },
        { id: 13, name: "Tiramisu", description: "Espresso-soaked dessert with mascarpone", icon: "ice-cream", iconColor: "text-warning" },
        { id: 14, name: "Panna Cotta", description: "Silky cooked cream with berry coulis", icon: "mug-hot", iconColor: "text-danger" },
        { id: 15, name: "Affogato", description: "Vanilla ice cream topped with hot espresso", icon: "glass-martini", iconColor: "text-success" }
      ]
    },
    {
      category: "Drinks",
      items: [
        { id: 16, name: "Aperol Spritz", description: "Light and refreshing citrus cocktail", icon: "wine-glass-alt", iconColor: "text-danger" },
        { id: 17, name: "Espresso", description: "Bold Italian-style espresso shot", icon: "coffee", iconColor: "text-brown" },
        { id: 18, name: "Fresh Juices", description: "Orange, apple, or seasonal mixed juices", icon: "tint", iconColor: "text-primary" },
        { id: 19, name: "Chinotto", description: "Bittersweet Italian citrus soda", icon: "wine-bottle", iconColor: "text-danger" },
        { id: 20, name: "Sanbitter", description: "Classic non-alcoholic bitter aperitif", icon: "glass-cheers", iconColor: "text-success" }
      ]
    }
  ];

function renderMenu() {
  const menuContainer = document.getElementById('menuDisplay');
  if (!menuContainer) return;

  menuContainer.innerHTML = '';
  menuItems.forEach(categoryObj => {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'mb-5';

    categoryDiv.innerHTML = `
      <h3 class="mb-4" style="color: #321905; border-bottom: 2px solid #d4a762; padding-bottom: 5px;">
        ${categoryObj.category}
      </h3>
      <div class="row row-cols-1 row-cols-md-2 g-4" id="${categoryObj.category.toLowerCase().replace(' ', '-')}-items">
      </div>
    `;

    menuContainer.appendChild(categoryDiv);
    const itemsContainer = document.getElementById(`${categoryObj.category.toLowerCase().replace(' ', '-')}-items`);

    categoryObj.items.forEach(item => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'col';

      const deleteButton = currentUser?.isAdmin ? `
        <button class="btn btn-sm btn-outline-danger delete-dish" data-id="${item.id}">
          <i class="fas fa-trash"></i>
        </button>
      ` : '';

      itemDiv.innerHTML = `
        <div class="card h-100" style="border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div class="card-body">
            <div class="d-flex justify-content-between">
              <h5 class="card-title">
                <i class="fas fa-${item.icon} ${item.iconColor} me-2"></i>
                ${item.name}
              </h5>
              ${deleteButton}
            </div>
            <p class="card-text">${item.description}</p>
          </div>
        </div>
      `;
      itemsContainer.appendChild(itemDiv);
    });
  });

  if (currentUser?.isAdmin) {
    document.querySelectorAll('.delete-dish').forEach(button => {
      button.addEventListener('click', function() {
        clickSound.currentTime = 0;
        clickSound.play();
        const id = parseInt(this.getAttribute('data-id'));
        deleteDish(id);
      });
    });
  }
}

function deleteDish(id) {
  if (!currentUser?.isAdmin) {
    alert('Only administrators can delete dishes!');
    return;
  }

  if (confirm('Are you sure you want to delete this dish?')) {
    menuItems.forEach(category => {
      category.items = category.items.filter(item => item.id !== id);
    });

    localStorage.setItem('restaurantMenu', JSON.stringify(menuItems));
    renderMenu();
    alert('Dish removed from menu!');
  }
}

function addNewDish() {
  if (!currentUser?.isAdmin) {
    alert('Only administrators can add dishes!');
    return;
  }

  clickSound.currentTime = 0;
  clickSound.play();

  const nameInput = document.getElementById('newDishName');
  const descInput = document.getElementById('newDishDesc');
  const categorySelect = document.getElementById('dishCategory');

  const dishName = nameInput.value.trim();
  const dishDesc = descInput.value.trim();
  const dishCategory = categorySelect.value;

  if (!dishName || !dishDesc || !dishCategory) {
    alert('Please fill all fields!');
    return;
  }

  const selectedCategory = menuItems.find(category =>
    category.category.toLowerCase() === dishCategory.toLowerCase()
  );

  if (!selectedCategory) {
    alert('Invalid category selected');
    return;
  }

  const newId = Math.max(...menuItems.flatMap(c => c.items.map(i => i.id)), 0) + 1;

  selectedCategory.items.push({
    id: newId,
    name: dishName,
    description: dishDesc,
    icon: "utensils",
    iconColor: "text-success"
  });

  localStorage.setItem('restaurantMenu', JSON.stringify(menuItems));
  renderMenu();

  nameInput.value = '';
  descInput.value = '';
  alert(`${dishName} added to ${selectedCategory.category}!`);
}

document.getElementById('compareDishesBtn')?.addEventListener('click', function() {
  clickSound.currentTime = 0;
  clickSound.play();

  const dish1 = document.getElementById('dish1');
  const dish2 = document.getElementById('dish2');

  if (!dish1.value || !dish2.value) {
    alert("Please select two dishes to compare");
    return;
  }

  if (dish1.value === dish2.value) {
    alert("Please select two different dishes to compare");
    return;
  }

  const price1 = parseInt(dish1.value);
  const price2 = parseInt(dish2.value);
  const name1 = dish1.options[dish1.selectedIndex].text.split(' (')[0];
  const name2 = dish2.options[dish2.selectedIndex].text.split(' (')[0];

  let result = "";
  let savingsTip = "";

  if (price1 > price2) {
    const difference = price1 - price2;
    result = `${name1} costs $${difference} more than ${name2}`;
    savingsTip = `Save $${difference} by choosing ${name2}!`;
  } else if (price2 > price1) {
    const difference = price2 - price1;
    result = `${name2} costs $${difference} more than ${name1}`;
    savingsTip = `Save $${difference} by choosing ${name1}!`;
  } else {
    result = `Both ${name1} and ${name2} cost the same ($${price1})`;
    savingsTip = `Both are great choices at this price!`;
  }

  document.getElementById('priceResult').textContent = result;
  document.getElementById('savingsTip').textContent = savingsTip;
  document.getElementById('comparisonResult').style.display = 'block';
  document.getElementById('comparisonResult').scrollIntoView({ behavior: 'smooth' });
});

document.getElementById('randomDishBtn')?.addEventListener('click', function() {
  clickSound.currentTime = 0;
  clickSound.play();

  const allDishes = menuItems.flatMap(category =>
    category.items.map(item => ({
      name: item.name,
      desc: item.description
    }))
  );

  if (allDishes.length === 0) {
    alert("No dishes available in the menu");
    return;
  }

  const randomIndex = Math.floor(Math.random() * allDishes.length);
  const randomDish = allDishes[randomIndex];
  const output = document.getElementById('randomDishOutput');

  if (output) {
    output.querySelector('h4').textContent = randomDish.name;
    output.querySelector('p').textContent = randomDish.desc;
    output.querySelector('small').textContent = "Try this delicious dish today!";
    output.style.display = 'block';
    output.style.animation = 'fadeIn 0.5s ease-in-out';
  }
});

document.getElementById('generateNumberBtn')?.addEventListener('click', function() {
  clickSound.currentTime = 0;
  clickSound.play();

  const randomNum = Math.floor(Math.random() * 100) + 1;
  const isEven = randomNum % 2 === 0;
  const isOver50 = randomNum > 50;
  let specialOffer = "";

  if (randomNum <= 10) {
    specialOffer = "Congratulations! You win a free dessert!";
  } else if (randomNum <= 30) {
    specialOffer = "Congratulations! 10% off your next bottle of wine";
  } else if (randomNum <= 60) {
    specialOffer = "Congratulations! Free garlic bread with your pasta order";
  } else if (randomNum <= 90) {
    specialOffer = "Congratulations! Complimentary espresso after your meal";
  } else {
    specialOffer = "Congratulations! 20% off your entire bill!";
  }

  const resultDiv = document.getElementById('numberResult');
  if (resultDiv) {
    resultDiv.querySelector('.number-display').textContent = randomNum;
    resultDiv.querySelector('#evenOdd').textContent = `This is an ${isEven ? 'even' : 'odd'} number`;
    resultDiv.querySelector('#sizeComparison').textContent = `This number is ${isOver50 ? 'greater than 50' : '50 or less'}`;
    resultDiv.querySelector('#specialOffer').textContent = specialOffer;
    resultDiv.style.display = 'block';
    resultDiv.scrollIntoView({ behavior: 'smooth' });
  }
});

function openModal(modalId) {
  clickSound.currentTime = 0;
  clickSound.play();
  document.getElementById(modalId).style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
  clickSound.currentTime = 0;
  clickSound.play();
  document.getElementById(modalId).style.display = 'none';
  document.body.style.overflow = 'auto';
}

function setupEventListeners() {
  document.getElementById('mobile-menu-btn')?.addEventListener('click', function() {
    clickSound.currentTime = 0;
    clickSound.play();
    document.querySelector('nav ul').classList.toggle('show');
  });

  document.getElementById('registerForm')?.addEventListener('submit', handleRegister);
  document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
  document.getElementById('reserveForm')?.addEventListener('submit', handleReservation);
  document.getElementById('reviewForm')?.addEventListener('submit', handleReview);

  const categorySelect = document.getElementById('dishCategory');
  if (categorySelect) {
    categorySelect.innerHTML = '<option value="">Select Category</option>';
    menuItems.forEach(category => {
      const option = document.createElement('option');
      option.value = category.category;
      option.textContent = category.category;
      categorySelect.appendChild(option);
    });
  }
}

document.addEventListener('DOMContentLoaded', function() {
  renderMenu();
});
function fetchChefsSpecial() {
  const apiDishContainer = document.getElementById('apiDishContainer');
  apiDishContainer.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Loading...</p>';

  fetch('https://www.themealdb.com/api/json/v1/1/random.php')
    .then(response => {
      if (!response.ok) throw new Error('Network error');
      return response.json();
    })
    .then(data => {
      const meal = data.meals[0];
      apiDishContainer.innerHTML = `
        <div class="card mx-auto" style="max-width: 300px;">
          <img src="${meal.strMealThumb}" class="card-img-top" alt="${meal.strMeal}" style="border-radius: 10px 10px 0 0;">
          <div class="card-body">
            <h5 class="card-title">${meal.strMeal}</h5>
            <p class="card-text">${meal.strArea} Cuisine</p>
            </a>
          </div>
        </div>
      `;
    })
    .catch(error => {
      console.error('API Error:', error);
      apiDishContainer.innerHTML = `
        <p class="text-danger">Failed to load special. Showing local dish instead.</p>
        ${getLocalRandomDish()}
      `;
    });
}

function getLocalRandomDish() {
  const localDishes = menuItems.flatMap(c => c.items);
  const randomDish = localDishes[Math.floor(Math.random() * localDishes.length)];
  return `
    <div class="card mx-auto" style="max-width: 300px;">
      <div class="card-body">
        <h5 class="card-title">${randomDish.name}</h5>
        <p class="card-text">${randomDish.description}</p>
      </div>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  fetchChefsSpecial();
  document.getElementById('fetchDishBtn')?.addEventListener('click', fetchChefsSpecial);
});
