const session = require('express-session');
const { createPool } = require('pg');
const connectPg = require('connect-pg-simple');
const memoryStore = require('memorystore');

const MemoryStore = memoryStore(session);

// Interface definition for storage methods
class IStorage {
  async getUser(id) {}
  async getUserByEmail(email) {}
  async createUser(user) {}
  async getAllUsers() {}
  
  async createGroup(group) {}
  async getGroupsByUserId(userId) {}
  async getGroupWithDetails(groupId) {}
  async getGroupByInviteCode(inviteCode) {}
  async isGroupMember(groupId, userId) {}
  async addGroupMember(member) {}
  
  async createMeeting(meeting) {}
  async getMeetingsForUser(userId) {}
  async getMeetingById(meetingId) {}
  async updateMeetingAttendance(meetingId, userId, status) {}
  
  async createStudyMaterial(material) {}
  async getStudyMaterialsByGroupId(groupId) {}
  async getStudyMaterialById(id) {}
  
  async createMessage(message) {}
  async getMessagesByGroupId(groupId) {}
  async getMessageById(id) {}
}

// In-memory storage implementation
class MemStorage extends IStorage {
  constructor() {
    super();
    this.users = new Map();
    this.groups = new Map();
    this.groupMembers = new Map();
    this.meetings = new Map();
    this.meetingAttendees = new Map();
    this.studyMaterials = new Map();
    this.messages = new Map();
    
    this.userIdCounter = 1;
    this.groupIdCounter = 1;
    this.groupMemberIdCounter = 1;
    this.meetingIdCounter = 1;
    this.meetingAttendeeIdCounter = 1;
    this.studyMaterialIdCounter = 1;
    this.messageIdCounter = 1;
    
    // Initialize session store
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Seed initial data
    this.seedInitialData();
  }
  
  async getUser(id) {
    return this.users.get(id);
  }
  
  async getUserByEmail(email) {
    return Array.from(this.users.values()).find(user => user.email === email);
  }
  
  async getAllUsers() {
    return Array.from(this.users.values());
  }
  
  async createUser(userData) {
    const id = this.userIdCounter++;
    
    const user = { 
      id, 
      name: userData.name,
      email: userData.email,
      password: userData.password,
      createdAt: new Date()
    };
    
    this.users.set(id, user);
    return user;
  }
  
  async createGroup(groupData) {
    const id = this.groupIdCounter++;
    
    const group = {
      id,
      name: groupData.name,
      description: groupData.description,
      subject: groupData.subject,
      inviteCode: groupData.inviteCode,
      createdBy: groupData.createdBy,
      createdAt: new Date()
    };
    
    this.groups.set(id, group);
    return group;
  }
  
  async getGroupsByUserId(userId) {
    const membershipEntries = Array.from(this.groupMembers.values())
      .filter(member => member.userId === userId);
    
    return Promise.all(
      membershipEntries.map(async entry => {
        const group = this.groups.get(entry.groupId);
        
        // Add members count
        const members = Array.from(this.groupMembers.values())
          .filter(member => member.groupId === group.id);
        
        return {
          ...group,
          membersCount: members.length
        };
      })
    );
  }
  
  async getGroupWithDetails(groupId) {
    const group = this.groups.get(groupId);
    if (!group) return undefined;
    
    // Get members with user details
    const members = Array.from(this.groupMembers.values())
      .filter(member => member.groupId === groupId)
      .map(member => {
        const user = this.users.get(member.userId);
        // Remove sensitive data
        const { password, ...safeUser } = user;
        return {
          ...member,
          user: safeUser
        };
      });
    
    // Get upcoming meetings
    const now = new Date();
    const meetings = Array.from(this.meetings.values())
      .filter(meeting => meeting.groupId === groupId && new Date(meeting.startTime) > now)
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    
    // Get next meeting
    const nextMeeting = meetings.length > 0 ? meetings[0] : null;
    
    return {
      ...group,
      members,
      meetings,
      nextMeeting
    };
  }
  
  async getGroupByInviteCode(inviteCode) {
    return Array.from(this.groups.values()).find(group => group.inviteCode === inviteCode);
  }
  
  async isGroupMember(groupId, userId) {
    return Array.from(this.groupMembers.values()).some(
      member => member.groupId === groupId && member.userId === userId
    );
  }
  
  async addGroupMember(memberData) {
    const id = this.groupMemberIdCounter++;
    
    const groupMember = {
      id,
      groupId: memberData.groupId,
      userId: memberData.userId,
      isAdmin: memberData.isAdmin,
      joinedAt: new Date()
    };
    
    this.groupMembers.set(id, groupMember);
  }
  
  async createMeeting(meetingData) {
    const id = this.meetingIdCounter++;
    
    const meeting = {
      id,
      groupId: meetingData.groupId,
      title: meetingData.title,
      description: meetingData.description,
      startTime: meetingData.startTime,
      endTime: meetingData.endTime,
      location: meetingData.location,
      isOnline: meetingData.isOnline,
      meetingUrl: meetingData.meetingUrl,
      createdBy: meetingData.createdBy,
      createdAt: new Date()
    };
    
    this.meetings.set(id, meeting);
    return meeting;
  }
  
  async getMeetingsForUser(userId) {
    // Get groups the user is a member of
    const userGroups = Array.from(this.groupMembers.values())
      .filter(member => member.userId === userId)
      .map(member => member.groupId);
    
    // Get meetings from those groups
    const meetings = Array.from(this.meetings.values())
      .filter(meeting => userGroups.includes(meeting.groupId))
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    
    // Add group info to each meeting
    return meetings.map(meeting => {
      const group = this.groups.get(meeting.groupId);
      
      // Get attendance info
      const attendees = Array.from(this.meetingAttendees.values())
        .filter(attendee => attendee.meetingId === meeting.id)
        .map(attendee => {
          const user = this.users.get(attendee.userId);
          const { password, ...safeUser } = user;
          return {
            ...attendee,
            user: safeUser
          };
        });
      
      const userAttending = attendees.some(
        attendee => attendee.userId === userId && attendee.status === true
      );
      
      return {
        ...meeting,
        group: {
          id: group.id,
          name: group.name
        },
        attendees,
        userAttending
      };
    });
  }
  
  async getMeetingsByGroupId(groupId) {
    return Array.from(this.meetings.values())
      .filter(meeting => meeting.groupId === groupId)
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  }
  
  async getMeetingById(meetingId) {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) return undefined;
    
    const group = this.groups.get(meeting.groupId);
    
    // Get attendance info
    const attendees = Array.from(this.meetingAttendees.values())
      .filter(attendee => attendee.meetingId === meetingId)
      .map(attendee => {
        const user = this.users.get(attendee.userId);
        const { password, ...safeUser } = user;
        return {
          ...attendee,
          user: safeUser
        };
      });
    
    return {
      ...meeting,
      group,
      attendees
    };
  }
  
  async updateMeetingAttendance(meetingId, userId, status) {
    // Check if attendance record exists
    const existingAttendance = Array.from(this.meetingAttendees.values())
      .find(attendee => attendee.meetingId === meetingId && attendee.userId === userId);
    
    if (existingAttendance) {
      // Update existing record
      existingAttendance.status = status;
      existingAttendance.updatedAt = new Date();
      this.meetingAttendees.set(existingAttendance.id, existingAttendance);
    } else {
      // Create new record
      const id = this.meetingAttendeeIdCounter++;
      const newAttendance = {
        id,
        meetingId,
        userId,
        status,
        createdAt: new Date()
      };
      this.meetingAttendees.set(id, newAttendance);
    }
  }
  
  async createStudyMaterial(materialData) {
    const id = this.studyMaterialIdCounter++;
    
    const material = {
      id,
      groupId: materialData.groupId,
      filename: materialData.filename,
      fileSize: materialData.fileSize,
      filePath: materialData.filePath,
      fileType: materialData.fileType,
      description: materialData.description,
      category: materialData.category,
      uploadedBy: materialData.uploadedBy,
      uploadedAt: new Date()
    };
    
    this.studyMaterials.set(id, material);
    return material;
  }
  
  async getStudyMaterialsByGroupId(groupId) {
    const materials = Array.from(this.studyMaterials.values())
      .filter(material => material.groupId === groupId)
      .sort((a, b) => b.uploadedAt - a.uploadedAt);
    
    return materials.map(material => {
      const user = this.users.get(material.uploadedBy);
      const { password, ...safeUser } = user;
      
      return {
        ...material,
        uploadedBy: safeUser
      };
    });
  }
  
  async getStudyMaterialById(id) {
    const material = this.studyMaterials.get(id);
    if (!material) return undefined;
    
    const user = this.users.get(material.uploadedBy);
    const { password, ...safeUser } = user;
    
    return {
      ...material,
      uploadedBy: safeUser
    };
  }
  
  async createMessage(messageData) {
    const id = this.messageIdCounter++;
    
    const message = {
      id,
      groupId: messageData.groupId,
      userId: messageData.userId,
      content: messageData.content,
      sentAt: new Date()
    };
    
    this.messages.set(id, message);
    return message;
  }
  
  async getMessagesByGroupId(groupId) {
    const messages = Array.from(this.messages.values())
      .filter(message => message.groupId === groupId)
      .sort((a, b) => a.sentAt - b.sentAt);
    
    return messages.map(message => {
      const user = this.users.get(message.userId);
      const { password, ...safeUser } = user;
      
      return {
        ...message,
        user: safeUser
      };
    });
  }
  
  async getMessageById(id) {
    const message = this.messages.get(id);
    if (!message) return undefined;
    
    const user = this.users.get(message.userId);
    const { password, ...safeUser } = user;
    
    return {
      ...message,
      user: safeUser
    };
  }
  
  seedInitialData() {
    // Create sample users
    const users = [
      {
        name: "John Doe",
        email: "john@example.com",
        password: "password123" // In real app, this would be hashed
      },
      {
        name: "Jane Smith",
        email: "jane@example.com",
        password: "password123"
      },
      {
        name: "Alex Johnson",
        email: "alex@example.com",
        password: "password123"
      }
    ];
    
    // Add sample users
    users.forEach(user => {
      const hashedPassword = user.password; // In real app, this would be hashed
      this.createUser({
        ...user,
        password: hashedPassword
      });
    });
    
    // Create sample groups
    const groups = [
      {
        name: "Physics Study Group",
        description: "Group for studying advanced physics concepts",
        subject: "Physics",
        inviteCode: "physics123",
        createdBy: 1
      },
      {
        name: "Web Development Team",
        description: "Learning modern web development techniques",
        subject: "Computer Science",
        inviteCode: "webdev456",
        createdBy: 2
      }
    ];
    
    // Add sample groups
    groups.forEach(group => {
      this.createGroup(group);
    });
    
    // Add members to groups
    const groupMembers = [
      { groupId: 1, userId: 1, isAdmin: true },
      { groupId: 1, userId: 2, isAdmin: false },
      { groupId: 2, userId: 2, isAdmin: true },
      { groupId: 2, userId: 3, isAdmin: false },
      { groupId: 2, userId: 1, isAdmin: false }
    ];
    
    groupMembers.forEach(member => {
      this.addGroupMember(member);
    });
    
    // Create sample meetings
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(10, 0, 0, 0);
    
    const meetings = [
      {
        groupId: 1,
        title: "Physics Exam Prep",
        description: "Preparing for the upcoming physics exam",
        startTime: tomorrow.toISOString(),
        endTime: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000).toISOString(),
        location: "Library Study Room 3",
        isOnline: false,
        meetingUrl: "",
        createdBy: 1
      },
      {
        groupId: 2,
        title: "React Workshop",
        description: "Introduction to React hooks",
        startTime: nextWeek.toISOString(),
        endTime: new Date(nextWeek.getTime() + 3 * 60 * 60 * 1000).toISOString(),
        location: "",
        isOnline: true,
        meetingUrl: "https://zoom.us/j/123456789",
        createdBy: 2
      }
    ];
    
    // Add sample meetings
    meetings.forEach(meeting => {
      this.createMeeting(meeting);
    });
    
    // Add meeting attendees
    this.updateMeetingAttendance(1, 1, true);
    this.updateMeetingAttendance(1, 2, true);
    this.updateMeetingAttendance(2, 2, true);
    this.updateMeetingAttendance(2, 3, true);
    this.updateMeetingAttendance(2, 1, false);
    
    // Create sample study materials
    const materials = [
      {
        groupId: 1,
        filename: "Physics_Notes.pdf",
        fileSize: 1024 * 1024 * 2.5, // 2.5 MB
        filePath: "/uploads/Physics_Notes.pdf",
        fileType: "application/pdf",
        description: "Comprehensive notes for the physics exam",
        category: "notes",
        uploadedBy: 1
      },
      {
        groupId: 2,
        filename: "React_Cheatsheet.pdf",
        fileSize: 1024 * 512, // 512 KB
        filePath: "/uploads/React_Cheatsheet.pdf",
        fileType: "application/pdf",
        description: "Quick reference guide for React",
        category: "reference",
        uploadedBy: 2
      }
    ];
    
    // Add sample study materials
    materials.forEach(material => {
      this.createStudyMaterial(material);
    });
    
    // Create sample messages
    const messages = [
      {
        groupId: 1,
        userId: 1,
        content: "Hi everyone, I've uploaded some physics notes for the exam."
      },
      {
        groupId: 1,
        userId: 2,
        content: "Thanks! These are really helpful."
      },
      {
        groupId: 2,
        userId: 2,
        content: "Don't forget our React workshop next week!"
      },
      {
        groupId: 2,
        userId: 3,
        content: "I'll be there. Should I prepare anything in advance?"
      },
      {
        groupId: 2,
        userId: 2,
        content: "Just make sure you have Node.js installed."
      }
    ];
    
    // Add sample messages
    messages.forEach(message => {
      this.createMessage(message);
    });
  }
}

// Database storage implementation (optional, can be used instead of MemStorage)
class DatabaseStorage extends IStorage {
  constructor() {
    super();
    
    // Initialize database connection pool
    this.pool = createPool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    // Initialize session store
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({
      pool: this.pool,
      tableName: 'session'
    });
  }
  
  // Implement all the methods from IStorage here using PostgreSQL queries
  // This would require writing SQL queries for each method
}

// Create and export storage instance
const storage = new MemStorage();
module.exports = { storage };