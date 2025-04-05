// People.js - Handles the display of users in the system
const People = (function() {
    const state = {
      users: [],
      isLoading: false,
      error: null
    };
  
    function bindEvents() {
      // Nothing to bind for now as this is a read-only page
    }
  
    function renderUsers() {
      const container = document.getElementById('people-list');
      
      if (state.isLoading) {
        container.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
        return;
      }
  
      if (state.error) {
        container.innerHTML = `<div class="alert alert-danger" role="alert">${state.error}</div>`;
        return;
      }
  
      if (state.users.length === 0) {
        container.innerHTML = '<div class="alert alert-info" role="alert">No users found.</div>';
        return;
      }
  
      let html = '';
  
      html += '<div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">';
      
      state.users.forEach(user => {
        html += `
          <div class="col">
            <div class="card h-100 shadow-sm">
              <div class="card-body">
                <div class="d-flex align-items-center mb-3">
                  <div class="avatar-placeholder rounded-circle bg-${getAvatarColor(user.name)} text-white me-3">
                    ${getInitials(user.name)}
                  </div>
                  <h5 class="card-title mb-0">${escapeHtml(user.name)}</h5>
                </div>
                <p class="card-text">
                  <small class="text-muted">
                    <i class="bi bi-envelope-fill me-2"></i>
                    <a href="mailto:${user.email}" class="text-decoration-none">${escapeHtml(user.email)}</a>
                  </small>
                </p>
                <p class="card-text">
                  <small class="text-muted">
                    <i class="bi bi-calendar-fill me-2"></i>
                    Joined: ${formatDate(new Date(user.createdAt))}
                  </small>
                </p>
              </div>
            </div>
          </div>
        `;
      });
      
      html += '</div>';
      
      container.innerHTML = html;
    }
  
    function formatDate(date) {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  
    function getInitials(name) {
      if (!name) return '?';
      return name
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
  
    function getAvatarColor(name) {
      const colors = [
        'primary', 'secondary', 'success', 
        'danger', 'warning', 'info'
      ];
      
      // Generate a consistent color based on the name
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
      
      const index = Math.abs(hash) % colors.length;
      return colors[index];
    }
  
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  
    function loadUsers() {
      state.isLoading = true;
      state.error = null;
      renderUsers();
  
      fetch('/api/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load users');
        }
        return response.json();
      })
      .then(data => {
        // Handle both formats - simple array or data wrapper object
        if (Array.isArray(data)) {
          state.users = data;
        } else if (data.data && Array.isArray(data.data)) {
          state.users = data.data;
        } else if (data.success === false) {
          throw new Error(data.message || 'Failed to load users');
        } else {
          // Unknown format
          state.users = Array.isArray(data) ? data : [data];
        }
        
        state.isLoading = false;
        renderUsers();
      })
      .catch(err => {
        console.error('Error loading users:', err);
        state.error = err.message;
        state.isLoading = false;
        renderUsers();
      });
    }
  
    function init() {
      bindEvents();
      loadUsers();
    }
  
    return {
      init
    };
  })();