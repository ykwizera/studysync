const { createServer } = require("http");
const { storage } = require("./storage");
const { setupAuth } = require("./auth");
const { randomBytes } = require("crypto");
const fs = require("fs");
const path = require("path");

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

function registerRoutes(app) {
  // Set up authentication
  setupAuth(app);

  // API routes
  // Groups
  app.get("/api/groups", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = req.user.id;
    const groups = await storage.getGroupsByUserId(userId);
    res.json(groups);
  });

  app.post("/api/groups", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const validatedData = req.body;
      const inviteCode = randomBytes(6).toString("hex");
      
      const group = await storage.createGroup({
        ...validatedData,
        inviteCode,
        createdBy: req.user.id,
      });
      
      // Add creator as admin
      await storage.addGroupMember({
        groupId: group.id,
        userId: req.user.id,
        isAdmin: true,
      });
      
      res.status(201).json(group);
    } catch (error) {
      res.status(500).json({ message: "Failed to create group" });
    }
  });

  app.get("/api/groups/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const groupId = parseInt(req.params.id);
    const userId = req.user.id;
    
    // Verify user is a member of the group
    const isMember = await storage.isGroupMember(groupId, userId);
    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }
    
    const group = await storage.getGroupWithDetails(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    
    res.json(group);
  });

  app.post("/api/groups/join", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ message: "Invite code is required" });
    }
    
    const group = await storage.getGroupByInviteCode(code);
    if (!group) {
      return res.status(404).json({ message: "Invalid invite code" });
    }
    
    const userId = req.user.id;
    
    // Check if user is already a member
    const isMember = await storage.isGroupMember(group.id, userId);
    if (isMember) {
      return res.status(400).json({ message: "You are already a member of this group" });
    }
    
    await storage.addGroupMember({
      groupId: group.id,
      userId,
      isAdmin: false,
    });
    
    res.json(group);
  });

  // Meetings
  app.get("/api/meetings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = req.user.id;
    const meetings = await storage.getMeetingsForUser(userId);
    res.json(meetings);
  });

  app.post("/api/meetings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user.id;
      const { groupId } = req.body;
      
      // Verify user is a member of the group
      const isMember = await storage.isGroupMember(groupId, userId);
      if (!isMember) {
        return res.status(403).json({ message: "You are not a member of this group" });
      }
      
      const validatedData = {
        ...req.body,
        createdBy: userId,
      };
      
      const meeting = await storage.createMeeting(validatedData);
      
      // Automatically mark creator as attending
      await storage.updateMeetingAttendance(meeting.id, userId, true);
      
      res.status(201).json(meeting);
    } catch (error) {
      res.status(500).json({ message: "Failed to create meeting" });
    }
  });

  app.post("/api/meetings/:id/rsvp", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const meetingId = parseInt(req.params.id);
    const userId = req.user.id;
    const { status } = req.body;
    
    if (typeof status !== "boolean") {
      return res.status(400).json({ message: "Status must be a boolean" });
    }
    
    try {
      // Verify the meeting exists and user is a member of the group
      const meeting = await storage.getMeetingById(meetingId);
      if (!meeting) {
        return res.status(404).json({ message: "Meeting not found" });
      }
      
      const isMember = await storage.isGroupMember(meeting.groupId, userId);
      if (!isMember) {
        return res.status(403).json({ message: "You are not a member of this group" });
      }
      
      await storage.updateMeetingAttendance(meetingId, userId, status);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update RSVP" });
    }
  });

  // Study Materials
  app.get("/api/groups/:id/files", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const groupId = parseInt(req.params.id);
    const userId = req.user.id;
    
    // Verify user is a member of the group
    const isMember = await storage.isGroupMember(groupId, userId);
    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }
    
    const files = await storage.getStudyMaterialsByGroupId(groupId);
    res.json(files);
  });

  app.post("/api/groups/:id/files", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // This would normally use a file upload middleware like multer
    // For simplicity, we're simulating file upload
    const groupId = parseInt(req.params.id);
    const userId = req.user.id;
    
    // Verify user is a member of the group
    const isMember = await storage.isGroupMember(groupId, userId);
    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }
    
    try {
      // Simulate file storage
      const filename = `file_${Date.now()}.pdf`;
      const filePath = path.join(uploadsDir, filename);
      
      // Create the study material entry
      const material = await storage.createStudyMaterial({
        groupId,
        filename: req.body.filename || filename,
        fileSize: req.body.fileSize || 1024,
        filePath,
        fileType: req.body.fileType || "application/pdf",
        description: req.body.description || "",
        category: req.body.category || "other",
        uploadedBy: userId,
      });
      
      res.status(201).json(material);
    } catch (error) {
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  app.get("/api/files/:id/download", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const fileId = parseInt(req.params.id);
    const userId = req.user.id;
    
    try {
      const file = await storage.getStudyMaterialById(fileId);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      // Verify user is a member of the group
      const isMember = await storage.isGroupMember(file.groupId, userId);
      if (!isMember) {
        return res.status(403).json({ message: "You are not authorized to download this file" });
      }
      
      // In a real application, we would stream the file from storage
      // Here we're just simulating a download
      res.setHeader("Content-Type", file.fileType || "application/octet-stream");
      res.setHeader("Content-Disposition", `attachment; filename=${file.filename}`);
      
      // Create a simple dummy PDF file (just for simulation)
      const dummyContent = Buffer.from("%PDF-1.5\nDummy PDF content for StudySync");
      res.send(dummyContent);
    } catch (error) {
      res.status(500).json({ message: "Failed to download file" });
    }
  });

  // Users
  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const users = await storage.getAllUsers();
    
    // Return users without password field for security
    const safeUsers = users.map(user => {
      const { password, ...safeUser } = user;
      return safeUser;
    });
    
    res.json(safeUsers);
  });

  // Messages
  app.get("/api/groups/:id/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const groupId = parseInt(req.params.id);
    const userId = req.user.id;
    
    // Verify user is a member of the group
    const isMember = await storage.isGroupMember(groupId, userId);
    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }
    
    const messages = await storage.getMessagesByGroupId(groupId);
    res.json(messages);
  });

  const httpServer = createServer(app);
  
  // Add a POST endpoint for chat messages instead of WebSocket
  app.post("/api/groups/:id/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const groupId = parseInt(req.params.id);
    const userId = req.user.id;
    const { content } = req.body;
    
    // Verify user is a member of the group
    const isMember = await storage.isGroupMember(groupId, userId);
    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }
    
    if (!content || typeof content !== "string") {
      return res.status(400).json({ message: "Message content is required" });
    }
    
    try {
      // Save message to database
      const message = await storage.createMessage({
        groupId,
        userId,
        content,
      });
      
      // Get the complete message with user info
      const completeMessage = await storage.getMessageById(message.id);
      
      res.status(201).json(completeMessage);
    } catch (error) {
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  return httpServer;
}

module.exports = { registerRoutes };