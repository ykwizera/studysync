/**
 * WebSocket Module - Handles real-time communication
 */

const websocket = {
    /**
     * The WebSocket connection
     */
    socket: null,
    
    /**
     * Whether the socket is currently connected
     */
    isConnected: false,
    
    /**
     * Event handlers for WebSocket events
     */
    handlers: {
      // Message type handlers
      message: {},
      
      // Connection status handlers
      connect: [],
      disconnect: []
    },
    
    /**
     * Initialize WebSocket connection
     * @param {number} userId - The user ID to authenticate with
     */
    init(userId) {
      // Close existing connection if any
      this.close();
      
      // Determine the WebSocket URL
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      try {
        this.socket = new WebSocket(wsUrl);
        
        // Set up event handlers
        this.socket.addEventListener('open', () => {
          console.log('WebSocket connection established');
          this.isConnected = true;
          
          // Authenticate with the server
          this.send({
            type: 'authenticate',
            userId
          });
          
          // Notify connect handlers
          this.handlers.connect.forEach(handler => handler());
          
          // Update status indicator
          const statusIndicator = document.getElementById('online-status');
          if (statusIndicator) {
            statusIndicator.classList.add('connected');
            statusIndicator.querySelector('.online-text').textContent = 'Online';
          }
        });
        
        this.socket.addEventListener('message', (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('WebSocket message received', data);
            
            // Handle authentication success
            if (data.type === 'auth_success') {
              console.log('WebSocket authentication successful');
            }
            
            // Handle specific message types
            if (data.type && this.handlers.message[data.type]) {
              this.handlers.message[data.type].forEach(handler => handler(data));
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        });
        
        this.socket.addEventListener('close', () => {
          console.log('WebSocket connection closed');
          this.isConnected = false;
          
          // Notify disconnect handlers
          this.handlers.disconnect.forEach(handler => handler());
          
          // Update status indicator
          const statusIndicator = document.getElementById('online-status');
          if (statusIndicator) {
            statusIndicator.classList.remove('connected');
            statusIndicator.querySelector('.online-text').textContent = 'Offline';
          }
          
          // Try to reconnect after a delay
          setTimeout(() => {
            if (!this.isConnected) {
              console.log('Attempting to reconnect WebSocket...');
              this.init(userId);
            }
          }, 5000);
        });
        
        this.socket.addEventListener('error', (error) => {
          console.error('WebSocket error:', error);
        });
      } catch (error) {
        console.error('Error initializing WebSocket:', error);
      }
    },
    
    /**
     * Send a message through the WebSocket
     * @param {Object} data - The data to send
     */
    send(data) {
      if (this.isConnected && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify(data));
      } else {
        console.warn('Cannot send message, WebSocket is not connected');
      }
    },
    
    /**
     * Close the WebSocket connection
     */
    close() {
      if (this.socket) {
        this.socket.close();
        this.socket = null;
        this.isConnected = false;
      }
    },
    
    /**
     * Register a handler for a specific message type
     * @param {string} type - The message type to handle
     * @param {Function} handler - The handler function
     */
    onMessage(type, handler) {
      if (!this.handlers.message[type]) {
        this.handlers.message[type] = [];
      }
      this.handlers.message[type].push(handler);
    },
    
    /**
     * Register a handler for connection events
     * @param {Function} handler - The handler function
     */
    onConnect(handler) {
      this.handlers.connect.push(handler);
    },
    
    /**
     * Register a handler for disconnection events
     * @param {Function} handler - The handler function
     */
    onDisconnect(handler) {
      this.handlers.disconnect.push(handler);
    },
    
    /**
     * Send a message to a group
     * @param {number} groupId - The ID of the group to send to
     * @param {string} content - The message content
     */
    sendGroupMessage(groupId, content) {
      this.send({
        type: 'group_message',
        groupId,
        content
      });
    }
  };
  
  // Export websocket object
  window.websocket = websocket;