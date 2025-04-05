// Authentication Module
const Auth = (function() {
    // Private variables
    const authKey = 'studysync_auth';
    
    // Cache DOM elements
    const $loginForm = $('#login-form');
    const $registerForm = $('#register-form');
    const $loginError = $('#login-error');
    const $registerError = $('#register-error');
    const $userNavInfo = $('#user-nav-info');
    const $userName = $('.user-name');
    const $logoutBtn = $('#logout-btn');
    const $loginContainer = $('#login-container');
    const $registerContainer = $('#register-container');
    const $showRegister = $('#show-register');
    const $showLogin = $('#show-login');
    
    // Event bindings
    function bindEvents() {
      $loginForm.on('submit', handleLogin);
      $registerForm.on('submit', handleRegister);
      $logoutBtn.on('click', handleLogout);
      
      // Form switching
      $showRegister.on('click', function(e) {
        e.preventDefault();
        showRegisterForm();
      });
      
      $showLogin.on('click', function(e) {
        e.preventDefault();
        showLoginForm();
      });
    }
    
    // Toggle between login and register forms
    function showLoginForm() {
      $registerContainer.addClass('d-none');
      $loginContainer.removeClass('d-none');
    }
    
    function showRegisterForm() {
      $loginContainer.addClass('d-none');
      $registerContainer.removeClass('d-none');
    }
    
    // Handle login form submission
    function handleLogin(e) {
      e.preventDefault();
      
      const email = $('#login-email').val();
      const password = $('#login-password').val();
      
      $loginError.addClass('d-none');
      
      // Call API to login
      $.ajax({
        url: '/api/login',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ email, password }),
        success: function(user) {
          // Store user info in localStorage
          localStorage.setItem(authKey, JSON.stringify(user));
          // Update UI
          updateUserInfo(user);
          // Update sidebar groups
          App.updateSidebarGroups();
          // Navigate to dashboard
          App.navigateTo('dashboard');
        },
        error: function(xhr) {
          let errorMessage = 'Login failed';
          try {
            const response = JSON.parse(xhr.responseText);
            errorMessage = response.message || errorMessage;
          } catch (e) {
            console.error('Error parsing error response', e);
          }
          showLoginError(errorMessage);
        }
      });
    }
    
    // Handle register form submission
    function handleRegister(e) {
      e.preventDefault();
      
      const name = $('#register-name').val();
      const email = $('#register-email').val();
      const password = $('#register-password').val();
      
      $registerError.addClass('d-none');
      
      // Call API to register
      $.ajax({
        url: '/api/register',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ name, email, password }),
        success: function(user) {
          // Store user info in localStorage
          localStorage.setItem(authKey, JSON.stringify(user));
          
          // Update UI
          updateUserInfo(user);
          
          // Update sidebar groups
          App.updateSidebarGroups();
          
          // Navigate to dashboard
          App.navigateTo('dashboard');
        },
        error: function(xhr) {
          let errorMessage = 'Registration failed';
          try {
            const response = JSON.parse(xhr.responseText);
            errorMessage = response.message || errorMessage;
          } catch (e) {
            console.error('Error parsing error response', e);
          }
          showRegisterError(errorMessage);
        }
      });
    }
    
    // Handle logout
    function handleLogout() {
      $.ajax({
        url: '/api/logout',
        method: 'POST',
        success: function() {
          // Clear auth from localStorage
          localStorage.removeItem(authKey);
          
          // Update UI
          updateUserInfo(null);
          
          // Navigate to auth page
          App.navigateTo('auth');
        },
        error: function() {
          // Even if the API call fails, log out on the client side
          localStorage.removeItem(authKey);
          updateUserInfo(null);
          App.navigateTo('auth');
        }
      });
    }
    
    // Show login error
    function showLoginError(message) {
      $loginError.text(message).removeClass('d-none');
    }
    
    // Show registration error
    function showRegisterError(message) {
      $registerError.text(message).removeClass('d-none');
    }
    
    // Update user info in UI
    function updateUserInfo(user) {
      if (user) {
        $userName.text(user.name);
        $userNavInfo.removeClass('d-none');
      } else {
        $userName.text('');
        $userNavInfo.addClass('d-none');
      }
    }
    
    // Check if user is authenticated
    function isAuthenticated() {
      const userStr = localStorage.getItem(authKey);
      if (!userStr) return false;
      
      try {
        const user = JSON.parse(userStr);
        return !!user && !!user.id;
      } catch (e) {
        console.error('Error parsing auth data', e);
        return false;
      }
    }
    
    // Get current user
    function getCurrentUser() {
      if (!isAuthenticated()) return null;
      
      try {
        return JSON.parse(localStorage.getItem(authKey));
      } catch (e) {
        console.error('Error parsing user data', e);
        return null;
      }
    }
    
    // Verify authentication with server and update local storage
    function verifyAuth() {
      return new Promise((resolve, reject) => {
        $.ajax({
          url: '/api/user',
          method: 'GET',
          success: function(user) {
            // Update localStorage with latest user data
            localStorage.setItem(authKey, JSON.stringify(user));
            // Update UI
            updateUserInfo(user);
            // Update sidebar groups if App module has been initialized
            if (typeof App !== 'undefined' && App.updateSidebarGroups) {
              App.updateSidebarGroups();
            }
            resolve(user);
          },
          error: function() {
            // Clear any existing auth data
            localStorage.removeItem(authKey);
            updateUserInfo(null);
            reject(new Error('Failed to verify authentication'));
          }
        });
      });
    }
    
    // Initialize module
    function init() {
      bindEvents();
      
      // Check if user is already authenticated
      if (isAuthenticated()) {
        const user = getCurrentUser();
        updateUserInfo(user);
        
        // Verify with server
        verifyAuth()
          .then(() => {
            // Navigate to dashboard if on auth page
            if (window.location.hash === '' || window.location.hash === '#auth') {
              App.navigateTo('dashboard');
            }
          })
          .catch(() => {
            // If verification fails, stay on auth page
            App.navigateTo('auth');
            // Make sure login form is visible (not register form)
            showLoginForm();
          });
      } else {
        // If not authenticated, ensure we're on the auth page
        App.navigateTo('auth');
        // Make sure login form is visible (not register form)
        showLoginForm();
      }
    }
    
    // Public API
    return {
      init,
      isAuthenticated,
      getCurrentUser,
      verifyAuth,
      showLoginForm,
      showRegisterForm
    };
  })();