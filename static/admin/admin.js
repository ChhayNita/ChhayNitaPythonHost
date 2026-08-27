// Admin Dashboard Interactive Script

// Toggle Mobile Sidebar
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.classList.toggle('-translate-x-full');
  }
}

// Toast Notification System
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const bgColors = {
    'success': 'bg-emerald-600 text-white',
    'info': 'bg-blue-600 text-white',
    'warning': 'bg-amber-600 text-white',
    'error': 'bg-rose-600 text-white'
  };

  toast.className = `p-3 rounded-xl shadow-xl text-xs font-semibold flex items-center justify-between gap-3 transform transition-all duration-300 translate-y-2 opacity-0 pointer-events-auto ${bgColors[type] || bgColors.success}`;
  toast.innerHTML = `
    <span>${message}</span>
    <button onclick="this.parentElement.remove()" class="text-white/80 hover:text-white">✕</button>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  }, 50);

  setTimeout(() => {
    toast.classList.add('opacity-0', '-translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Modal Controls
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('hidden');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('hidden');
}

// Live Product Search & Category Filter
function filterProducts() {
  const searchInput = document.getElementById('product-search');
  const catSelect = document.getElementById('product-category-filter');
  if (!searchInput) return;

  const query = searchInput.value.toLowerCase();
  const category = catSelect ? catSelect.value.toLowerCase() : '';
  const rows = document.querySelectorAll('.product-row');

  rows.forEach(row => {
    const title = row.getAttribute('data-title') || '';
    const cat = row.getAttribute('data-category') || '';
    const matchesQuery = !query || title.includes(query);
    const matchesCat = !category || cat.toLowerCase() === category;

    if (matchesQuery && matchesCat) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

// Live User Search & Role Filter
function filterUsers() {
  const searchInput = document.getElementById('user-search');
  const roleSelect = document.getElementById('user-role-filter');
  if (!searchInput) return;

  const query = searchInput.value.toLowerCase();
  const role = roleSelect ? roleSelect.value.toLowerCase() : '';
  const rows = document.querySelectorAll('.user-row');

  rows.forEach(row => {
    const name = row.getAttribute('data-name') || '';
    const email = row.getAttribute('data-email') || '';
    const userRole = row.getAttribute('data-role') || '';

    const matchesQuery = !query || name.includes(query) || email.includes(query);
    const matchesRole = !role || userRole === role;

    if (matchesQuery && matchesRole) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

// Dynamic Product Addition
function handleAddProductSubmit(e) {
  e.preventDefault();
  const title = document.getElementById('new-prod-title').value;
  const price = parseFloat(document.getElementById('new-prod-price').value).toFixed(2);
  const category = document.getElementById('new-prod-category').value;
  const image = document.getElementById('new-prod-image').value || 'https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_.jpg';

  const tbody = document.getElementById('product-table-body');
  if (!tbody) return;

  const tr = document.createElement('tr');
  const newId = Math.floor(Math.random() * 900) + 100;
  tr.className = 'hover:bg-slate-800/40 transition product-row';
  tr.setAttribute('data-title', title.toLowerCase());
  tr.setAttribute('data-category', category.toLowerCase());

  tr.innerHTML = `
    <td class="py-3.5 px-4 flex items-center gap-3">
      <img src="${image}" class="w-10 h-10 object-contain rounded-lg bg-white p-1 shadow-sm shrink-0">
      <div class="max-w-xs">
        <p class="font-medium text-white truncate text-xs">${title}</p>
        <p class="text-[11px] text-slate-500 font-mono">ID: #${newId}</p>
      </div>
    </td>
    <td class="py-3.5 px-4">
      <span class="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700 capitalize">
        ${category}
      </span>
    </td>
    <td class="py-3.5 px-4">
      <span class="font-semibold text-white">$${price}</span>
    </td>
    <td class="py-3.5 px-4">
      <span class="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">In Stock</span>
    </td>
    <td class="py-3.5 px-4 text-amber-400 font-medium">★ 5.0 <span class="text-slate-500 font-normal">(1)</span></td>
    <td class="py-3.5 px-4 text-right space-x-2">
      <button onclick="deleteProductRow(this)" class="p-1.5 text-slate-400 hover:text-rose-400">Delete</button>
    </td>
  `;

  tbody.prepend(tr);
  closeModal('modal-add-product');
  document.getElementById('form-add-product').reset();
  showToast(`Product "${title}" added successfully!`);
}

// Dynamic User Addition
function handleAddUserSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('new-user-name').value;
  const email = document.getElementById('new-user-email').value;
  const role = document.getElementById('new-user-role').value;
  const status = document.getElementById('new-user-status').value;

  const tbody = document.getElementById('user-table-body');
  if (!tbody) return;

  const tr = document.createElement('tr');
  tr.className = 'hover:bg-slate-800/40 transition user-row';
  tr.setAttribute('data-name', name.toLowerCase());
  tr.setAttribute('data-email', email.toLowerCase());
  tr.setAttribute('data-role', role.toLowerCase());

  const initial = name ? name[0].toUpperCase() : 'U';
  const roleBadge = role === 'Admin' 
    ? '<span class="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20">Admin</span>'
    : '<span class="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">Customer</span>';

  tr.innerHTML = `
    <td class="py-3.5 px-4 flex items-center gap-3">
      <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center font-bold text-white text-xs shrink-0 shadow">
        ${initial}
      </div>
      <div>
        <p class="font-semibold text-white">${name}</p>
        <p class="text-[11px] text-slate-400">${email}</p>
      </div>
    </td>
    <td class="py-3.5 px-4">${roleBadge}</td>
    <td class="py-3.5 px-4"><span class="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">${status}</span></td>
    <td class="py-3.5 px-4 text-slate-400">Jul 22, 2026</td>
    <td class="py-3.5 px-4 text-right"><button onclick="deleteUserRow(this)" class="text-slate-400 hover:text-rose-400">Delete</button></td>
  `;

  tbody.prepend(tr);
  closeModal('modal-add-user');
  document.getElementById('form-add-user').reset();
  showToast(`User "${name}" created!`);
}

let currentEditingProductRow = null;
let currentEditingUserRow = null;

function editProductRow(btn) {
  currentEditingProductRow = btn.closest('tr');
  const titleEl = currentEditingProductRow.querySelector('.product-title');
  const priceEl = currentEditingProductRow.querySelector('.product-price');
  const catEl = currentEditingProductRow.querySelector('.product-category');
  const imgEl = currentEditingProductRow.querySelector('img');

  const title = titleEl ? titleEl.textContent.trim() : '';
  const price = priceEl ? priceEl.textContent.replace('$', '').trim() : '';
  const category = catEl ? catEl.textContent.trim().toLowerCase() : '';
  const image = imgEl ? imgEl.src : '';

  document.getElementById('edit-prod-title').value = title;
  document.getElementById('edit-prod-price').value = price;
  document.getElementById('edit-prod-category').value = category;
  document.getElementById('edit-prod-image').value = image;

  openModal('modal-edit-product');
}

function handleEditProductSubmit(e) {
  e.preventDefault();
  if (!currentEditingProductRow) return;

  const title = document.getElementById('edit-prod-title').value;
  const price = parseFloat(document.getElementById('edit-prod-price').value).toFixed(2);
  const category = document.getElementById('edit-prod-category').value;
  const image = document.getElementById('edit-prod-image').value;

  currentEditingProductRow.setAttribute('data-title', title.toLowerCase());
  currentEditingProductRow.setAttribute('data-category', category.toLowerCase());

  const titleEl = currentEditingProductRow.querySelector('.product-title');
  const priceEl = currentEditingProductRow.querySelector('.product-price');
  const catEl = currentEditingProductRow.querySelector('.product-category');
  const imgEl = currentEditingProductRow.querySelector('img');

  if (titleEl) titleEl.textContent = title;
  if (priceEl) priceEl.textContent = `$${price}`;
  if (catEl) catEl.textContent = category;
  if (imgEl && image) imgEl.src = image;

  closeModal('modal-edit-product');
  showToast(`Product "${title}" updated successfully!`, 'success');
}

function editUserRow(btn) {
  currentEditingUserRow = btn.closest('tr');
  const nameEl = currentEditingUserRow.querySelector('.user-name');
  const emailEl = currentEditingUserRow.querySelector('.user-email');
  const roleEl = currentEditingUserRow.querySelector('.user-role');
  const statusEl = currentEditingUserRow.querySelector('.user-status');

  const name = nameEl ? nameEl.textContent.trim() : '';
  const email = emailEl ? emailEl.textContent.trim() : '';
  const role = roleEl ? roleEl.textContent.trim() : 'Customer';
  const status = statusEl ? statusEl.textContent.trim() : 'Active';

  document.getElementById('edit-user-name').value = name;
  document.getElementById('edit-user-email').value = email;
  document.getElementById('edit-user-role').value = role;
  document.getElementById('edit-user-status').value = status;

  openModal('modal-edit-user');
}

function handleEditUserSubmit(e) {
  e.preventDefault();
  if (!currentEditingUserRow) return;

  const name = document.getElementById('edit-user-name').value;
  const email = document.getElementById('edit-user-email').value;
  const role = document.getElementById('edit-user-role').value;
  const status = document.getElementById('edit-user-status').value;

  currentEditingUserRow.setAttribute('data-name', name.toLowerCase());
  currentEditingUserRow.setAttribute('data-email', email.toLowerCase());
  currentEditingUserRow.setAttribute('data-role', role.toLowerCase());

  const nameEl = currentEditingUserRow.querySelector('.user-name');
  const emailEl = currentEditingUserRow.querySelector('.user-email');
  const roleEl = currentEditingUserRow.querySelector('.user-role');
  const statusEl = currentEditingUserRow.querySelector('.user-status');
  const avatarEl = currentEditingUserRow.querySelector('.user-avatar');

  if (nameEl) nameEl.textContent = name;
  if (emailEl) emailEl.textContent = email;
  if (avatarEl && name) avatarEl.textContent = name[0].toUpperCase();

  if (roleEl) {
    roleEl.textContent = role;
    if (role === 'Admin') {
      roleEl.className = 'px-2.5 py-1 rounded-full text-[11px] font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20 user-role';
    } else {
      roleEl.className = 'px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 user-role';
    }
  }

  if (statusEl) {
    statusEl.textContent = status;
    if (status === 'Active') {
      statusEl.className = 'px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 user-status';
    } else {
      statusEl.className = 'px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 user-status';
    }
  }

  closeModal('modal-edit-user');
  showToast(`User "${name}" updated successfully!`, 'success');
}

// Row Delete Operations
function deleteProductRow(btn) {
  if (confirm('Are you sure you want to delete this product?')) {
    const row = btn.closest('tr');
    row.remove();
    showToast('Product removed', 'warning');
  }
}

function deleteUserRow(btn) {
  if (confirm('Are you sure you want to delete this user?')) {
    const row = btn.closest('tr');
    row.remove();
    showToast('User deleted', 'warning');
  }
}

// Global Top Search Handler
function handleGlobalSearch(query) {
  if (!query) return;
  filterProducts();
  filterUsers();
}

// Initialize Charts on DOM Ready if Canvas Exists
document.addEventListener('DOMContentLoaded', () => {
  const revCanvas = document.getElementById('revenueChart');
  if (revCanvas && window.Chart) {
    const ctxRev = revCanvas.getContext('2d');
    const gradient = ctxRev.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

    new Chart(ctxRev, {
      type: 'line',
      data: {
        labels: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
        datasets: [{
          label: 'Revenue ($)',
          data: [18400, 24500, 31200, 29800, 42100, 48290],
          borderColor: '#3b82f6',
          borderWidth: 3,
          backgroundColor: gradient,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#60a5fa',
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
          y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } }
        }
      }
    });
  }

  const catCanvas = document.getElementById('categoryChart');
  if (catCanvas && window.Chart) {
    const ctxCat = catCanvas.getContext('2d');
    new Chart(ctxCat, {
      type: 'doughnut',
      data: {
        labels: ['Electronics', 'Men Clothing', 'Women Clothing', 'Jewelery'],
        datasets: [{
          data: [45, 25, 20, 10],
          backgroundColor: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#cbd5e1', font: { size: 11 } } }
        },
        cutout: '72%'
      }
    });
  }
});
