// Groups Module
const Groups = (function() {
    // Private variables
    let groups = [];
    let currentGroup = null;
    
    // Cache DOM elements
    const $groupList = $('#group-list');
    const $noGroupsMessage = $('#no-groups-message');
    const $createGroupForm = $('#create-group-form');
    const $createGroupError = $('#create-group-error');
    const $createGroupSubmit = $('#create-group-submit');
    const $joinGroupForm = $('#join-group-form');
    const $joinGroupError = $('#join-group-error');
    const $joinGroupSubmit = $('#join-group-submit');
    const $groupName = $('.group-name');
    const $groupDescription = $('.group-description');
    const $groupSubject = $('.group-subject');
    const $groupCreator = $('.group-creator');
    const $groupInviteCode = $('.group-invite-code');
    const $copyInviteCode = $('.copy-invite-code');
    const $groupMembers = $('#group-members');
    
    // Event bindings
    function bindEvents() {
      // Create group
      $createGroupSubmit.on('click', handleCreateGroup);
      
      // Join group
      $joinGroupSubmit.on('click', handleJoinGroup);
      
      // Copy invite code
      $copyInviteCode.on('click', copyInviteCodeToClipboard);
    }
    
    // Handle creating a new group
    function handleCreateGroup() {
      $createGroupError.addClass('d-none');
      
      const groupData = {
        name: $('#group-name').val(),
        subject: $('#group-subject').val(),
        description: $('#group-description').val() || ''
      };
      
      if (!groupData.name || !groupData.subject) {
        $createGroupError.text('Name and subject are required').removeClass('d-none');
        return;
      }
      
      // For demo purposes, create a group locally
      // In a real application, this would be an API call
      
      // Generate a random invite code
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const user = Auth.getCurrentUser();
      
      // Create the group object
      const newGroup = {
        id: Date.now(), // Use timestamp as temporary ID
        name: groupData.name,
        subject: groupData.subject,
        description: groupData.description,
        inviteCode: inviteCode,
        createdBy: user.id,
        members: [
          {
            id: 1,
            userId: user.id,
            groupId: Date.now(),
            isAdmin: true,
            user: user
          }
        ]
      };
      
      // Add to groups array
      groups.push(newGroup);
      
      // Close modal
      $('#create-group-modal').modal('hide');
      
      // Reset form
      $createGroupForm[0].reset();
      
      // Reload groups
      renderGroups();
      
      // Navigate to the new group
      App.navigateTo('group', newGroup.id);
    }
    
    // Handle joining a group
    function handleJoinGroup() {
      $joinGroupError.addClass('d-none');
      
      const code = $('#invite-code').val();
      
      if (!code) {
        $joinGroupError.text('Invite code is required').removeClass('d-none');
        return;
      }
      
      // For demo purposes, simulate joining a group
      // In a real application, this would be an API call
      const matchingGroup = groups.find(group => 
        group.inviteCode.toLowerCase() === code.toLowerCase()
      );
      
      if (!matchingGroup) {
        $joinGroupError.text('Invalid invite code').removeClass('d-none');
        return;
      }
      
      const user = Auth.getCurrentUser();
      
      // Check if user is already a member
      const isMember = matchingGroup.members.some(member => member.userId === user.id);
      
      if (isMember) {
        $joinGroupError.text('You are already a member of this group').removeClass('d-none');
        return;
      }
      
      // Add user to the group
      matchingGroup.members.push({
        id: Date.now(),
        userId: user.id,
        groupId: matchingGroup.id,
        isAdmin: false,
        user: user
      });
      
      // Close modal
      $('#join-group-modal').modal('hide');
      
      // Reset form
      $joinGroupForm[0].reset();
      
      // Reload groups
      renderGroups();
      
      // Navigate to the joined group
      App.navigateTo('group', matchingGroup.id);
    }
    
    // Copy invite code to clipboard
    function copyInviteCodeToClipboard() {
      const code = $groupInviteCode.val();
      
      if (navigator.clipboard) {
        navigator.clipboard.writeText(code).then(() => {
          // Change button text temporarily
          $copyInviteCode.text('Copied!');
          setTimeout(() => {
            $copyInviteCode.text('Copy');
          }, 2000);
        });
      } else {
        // Fallback method
        $groupInviteCode.select();
        document.execCommand('copy');
        
        $copyInviteCode.text('Copied!');
        setTimeout(() => {
          $copyInviteCode.text('Copy');
        }, 2000);
      }
    }
    
    // Render groups list
    function renderGroups() {
      if (groups.length === 0) {
        $groupList.empty();
        $noGroupsMessage.removeClass('d-none');
        return;
      }
      
      $noGroupsMessage.addClass('d-none');
      
      let html = '';
      
      groups.forEach(group => {
        html += `
          <div class="col">
            <div class="card group-card h-100">
              <div class="card-body">
                <h5 class="card-title">${group.name}</h5>
                <h6 class="card-subtitle mb-2 text-muted">${group.subject}</h6>
                <p class="card-text">${group.description || 'No description'}</p>
                <div class="d-flex justify-content-between">
                  <small class="text-muted">${group.members.length} members</small>
                  <a href="#group/${group.id}" class="card-link">View Group</a>
                </div>
              </div>
            </div>
          </div>
        `;
      });
      
      $groupList.html(html);
    }
    
    // Render group details
    function renderGroupDetails(group) {
      // Update group header
      $groupName.text(group.name);
      $groupDescription.text(group.description || 'No description');
      $groupSubject.text(group.subject);
      
      // Find creator user
      const creator = group.members.find(member => member.isAdmin)?.user;
      $groupCreator.text(creator ? creator.name : 'Unknown');
      
      // Update invite code
      $groupInviteCode.val(group.inviteCode);
      
      // Render members list
      let membersHtml = '';
      
      group.members.forEach(member => {
        membersHtml += `
          <li class="list-group-item d-flex justify-content-between align-items-center">
            <div>
              ${member.user.name}
              ${member.isAdmin ? '<span class="badge bg-primary ms-2">Admin</span>' : ''}
            </div>
            <span class="text-muted small">${member.user.email}</span>
          </li>
        `;
      });
      
      $groupMembers.html(membersHtml);
      
      // Update meetings, files, and chat for the group
      Meetings.loadGroupMeetings(group.id);
      Files.loadGroupFiles(group.id);
      Chat.loadGroupMessages(group.id);
    }
    
    // Load groups from server
    function loadGroups() {
      // Check authentication
      if (!Auth.isAuthenticated()) {
        groups = [];
        renderGroups();
        return;
      }
      
      $.ajax({
        url: '/api/groups',
        method: 'GET',
        success: function(response) {
          groups = response.data || [];
          renderGroups();
        },
        error: function() {
          groups = [];
          renderGroups();
          console.error('Failed to load groups');
        }
      });
    }
    
    // Load group details
    function loadGroupDetails(groupId) {
      // Check if we already have the group details cached
      const group = groups.find(g => g.id === groupId);
      
      if (group) {
        currentGroup = group;
        renderGroupDetails(group);
        return;
      }
      
      // Otherwise load from server
      // In a real application, this would be an API call
      
      // For demo purposes, create a mock group
      const mockGroup = {
        id: groupId,
        name: 'Demo Group',
        subject: 'Computer Science',
        description: 'This is a demo group for testing purposes',
        inviteCode: 'DEMO123',
        members: [
          {
            id: 1,
            userId: Auth.getCurrentUser().id,
            groupId: groupId,
            isAdmin: true,
            user: Auth.getCurrentUser()
          }
        ]
      };
      
      currentGroup = mockGroup;
      groups.push(mockGroup);
      renderGroupDetails(mockGroup);
    }
    
    // Get current group
    function getCurrentGroup() {
      return currentGroup;
    }
    
    // Initialize groups module
    function init() {
      bindEvents();
    }
    
    // Get all groups
    function getGroups() {
      return groups;
    }
    
    // Public API
    return {
      init,
      loadGroups,
      loadGroupDetails,
      getCurrentGroup,
      getGroups
    };
  })();