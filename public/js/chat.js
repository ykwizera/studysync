// Chat Module
const Chat = (function() {
    // Private variables
    let groupMessages = [];
    
    // Cache DOM elements
    const $chatMessages = $('#chat-messages');
    const $chatForm = $('#chat-form');
    const $chatInput = $('#chat-input');
    
    // Event bindings
    function bindEvents() {
      $chatForm.on('submit', handleSendMessage);
    }
    
    // Format time for display
    function formatTime(date) {
      return new Date(date).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    // Handle sending a message
    function handleSendMessage(e) {
      e.preventDefault();
      
      const content = $chatInput.val().trim();
      if (!content) return;
      
      const currentGroup = Groups.getCurrentGroup();
      if (!currentGroup) {
        console.error('No group selected');
        return;
      }
      
      const user = Auth.getCurrentUser();
      
      // Create message object
      const newMessage = {
        id: Date.now(), // Use timestamp as temporary ID
        groupId: currentGroup.id,
        userId: user.id,
        user: user,
        content: content,
        timestamp: new Date()
      };
      
      // Add to messages array
      groupMessages.push(newMessage);
      
      // Clear input
      $chatInput.val('');
      
      // Render messages
      renderGroupMessages();
      
      // Scroll to bottom
      scrollToBottom();
      
      // In a real application, we would also send the message to the server
      // For now, we'll just use our local array
    }
    
    // Render group messages
    function renderGroupMessages() {
      if (groupMessages.length === 0) {
        $chatMessages.html('<div class="text-center py-5"><i class="bi bi-chat-dots fs-1 text-muted mb-3"></i><p class="text-muted">No messages yet. Be the first to send a message!</p></div>');
        return;
      }
      
      // Sort messages by timestamp
      const sortedMessages = [...groupMessages].sort((a, b) => 
        new Date(a.timestamp) - new Date(b.timestamp)
      );
      
      // Group messages by date
      const groupedByDate = {};
      
      sortedMessages.forEach(message => {
        const messageDate = new Date(message.timestamp);
        const dateKey = messageDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
        
        if (!groupedByDate[dateKey]) {
          groupedByDate[dateKey] = [];
        }
        
        groupedByDate[dateKey].push(message);
      });
      
      let html = '';
      
      // Render messages grouped by date
      Object.keys(groupedByDate).forEach(dateKey => {
        html += `<div class="chat-date-separator text-center my-3"><span class="badge bg-light text-dark px-3 py-2">${dateKey}</span></div>`;
        
        groupedByDate[dateKey].forEach(message => {
          const user = Auth.getCurrentUser();
          const isSent = message.userId === user.id;
          const messageClass = isSent ? 'sent' : 'received';
          const time = formatTime(message.timestamp);
          
          html += `
            <div class="chat-message ${messageClass}">
              ${isSent ? '' : `<div class="message-sender">${message.user.name}</div>`}
              <div class="message-content">${message.content}</div>
              <div class="message-time">${time}</div>
            </div>
          `;
        });
      });
      
      $chatMessages.html(html);
    }
    
    // Scroll chat to bottom
    function scrollToBottom() {
      $chatMessages.scrollTop($chatMessages[0].scrollHeight);
    }
    
    // Load group messages
    function loadGroupMessages(groupId) {
      // Check authentication
      if (!Auth.isAuthenticated()) {
        groupMessages = [];
        renderGroupMessages();
        return;
      }
      
      // For demo purposes, create mock messages
      // In a real application, this would be an API call
      const user = Auth.getCurrentUser();
      
      groupMessages = [
        {
          id: 1,
          groupId: groupId,
          userId: 999, // Different user ID to simulate another user
          user: {
            id: 999,
            name: 'John Doe',
            email: 'john@example.com'
          },
          content: 'Hey everyone, when are we meeting next?',
          timestamp: new Date(2025, 3, 1, 14, 30) // April 1, 2025, 2:30 PM
        },
        {
          id: 2,
          groupId: groupId,
          userId: user.id,
          user: user,
          content: 'I think we scheduled it for tomorrow at 3 PM',
          timestamp: new Date(2025, 3, 1, 14, 32) // April 1, 2025, 2:32 PM
        },
        {
          id: 3,
          groupId: groupId,
          userId: 999,
          user: {
            id: 999,
            name: 'John Doe',
            email: 'john@example.com'
          },
          content: 'Perfect, thanks! I\'ll prepare the notes from last session.',
          timestamp: new Date(2025, 3, 1, 14, 35) // April 1, 2025, 2:35 PM
        }
      ];
      
      renderGroupMessages();
      scrollToBottom();
      
      // Set up periodic refresh
      // In a real application, this would be handled by WebSockets or a polling mechanism
      setInterval(() => {
        // Nothing to do for demo since we're not really fetching from server
      }, 5000); // Refresh every 5 seconds
    }
    
    // Initialize chat module
    function init() {
      bindEvents();
    }
    
    // Public API
    return {
      init,
      loadGroupMessages
    };
  })();