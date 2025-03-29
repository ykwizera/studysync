/**
 * Authentication Module - Handles user authentication
 */

const auth = {
    /**
     * Current user data
     */
    currentUser: null,
    
    /**
     * Initialize authentication
     */
    init() {
      // Check for stored user data
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          this.currentUser = JSON.parse(storedUser);
          
          // Initialize WebSocket connection
          if (this.currentUser && this.currentUser.id) {
            websocket.init(this.currentUser.id);
          }
          
          return true;
        } catch (error) {
          console.error('Error parsing stored user data:', error);
          localStorage.removeItem('user');
        }
      }
      
      return false;
    },
    
    /**
     * Login a user
     * @param {string} username - The username
     * @param {string} password - The password
     * @returns {Promise} - A promise that resolves when login is successful
     */
    async login(username, password) {
      try {
        const userData = await api.auth.login(username, password);
        this.setCurrentUser(userData);
        return userData;
      } catch (error) {
        throw error;
      }
    },
    
    /**
     * Register a new user
     * @param {Object} userData - The user data
     * @returns {Promise} - A promise that resolves when registration is successful
     */
    async register(userData) {
      try {
        const newUser = await api.auth.register(userData);
        this.setCurrentUser(newUser);
        return newUser;
      } catch (error) {
        throw error;
      }
    },
    
    /**
     * Logout the current user
     */
    logout() {
      // Close WebSocket connection
      websocket.close();
      
      // Clear user data
      this.currentUser = null;
      localStorage.removeItem('user');
      
      // Redirect to login page
      app.showLoginPage();
    },
    
    /**
     * Set the current user
     * @param {Object} userData - The user data
     */
    setCurrentUser(userData) {
      this.currentUser = userData;
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Initialize WebSocket connection
      if (userData && userData.id) {
        websocket.init(userData.id);
      }
    },
    
    /**
     * Check if a user is logged in
     * @returns {boolean} - Whether a user is logged in
     */
    isLoggedIn() {
      return !!this.currentUser;
    },
    
    /**
     * Get the current user
     * @returns {Object|null} - The current user data or null if not logged in
     */
    getUser() {
      return this.currentUser;
    },
    
    /**
     * Get the current user ID
     * @returns {number|null} - The current user ID or null if not logged in
     */
    getUserId() {
      return this.currentUser ? this.currentUser.id : null;
    },
    
    /**
     * Check if the current user is a member of a group
     * @param {Array} members - The group members
     * @returns {boolean} - Whether the current user is a member
     */
    isGroupMember(members) {
      if (!this.currentUser || !members) return false;
      return members.some(member => member.userId === this.currentUser.id);
    }
  };
  
  // Export auth object
  window.auth = auth;