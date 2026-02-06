const { google } = require('googleapis');
const { query } = require('./config/database');
const logger = require('../utils/logger');

class CalendarService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  /**
   * Get authorization URL for OAuth
   */
  getAuthUrl() {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/gmail.readonly'
      ]
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokens(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      return tokens;
    } catch (error) {
      logger.error('Get tokens error:', error);
      throw error;
    }
  }

  /**
   * Set credentials from stored tokens
   */
  setCredentials(tokens) {
    this.oauth2Client.setCredentials(tokens);
  }

  /**
   * Get user's calendar events
   */
  async getEvents(userId, timeMin, timeMax) {
    try {
      // Get user's tokens
      const userResult = await query(
        'SELECT calendar_token FROM users WHERE id = $1',
        [userId]
      );

      if (!userResult.rows[0]?.calendar_token) {
        throw new Error('Calendar not connected');
      }

      const tokens = JSON.parse(userResult.rows[0].calendar_token);
      this.setCredentials(tokens);

      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin || new Date().toISOString(),
        timeMax: timeMax || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
      });

      return response.data.items || [];
    } catch (error) {
      logger.error('Get calendar events error:', error);
      throw error;
    }
  }

  /**
   * Find free time slots
   */
  async findFreeSlots(userId, durationMinutes = 60, daysAhead = 14) {
    try {
      const events = await this.getEvents(userId);
      const freeSlots = [];
      
      const now = new Date();
      const endDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

      // Check each business day
      for (let d = new Date(now); d <= endDate; d.setDate(d.getDate() + 1)) {
        // Skip weekends
        if (d.getDay() === 0 || d.getDay() === 6) continue;

        // Check business hours (9 AM - 5 PM)
        for (let hour = 9; hour <= 16; hour++) {
          const slotStart = new Date(d);
          slotStart.setHours(hour, 0, 0, 0);
          
          const slotEnd = new Date(slotStart);
          slotEnd.setMinutes(slotStart.getMinutes() + durationMinutes);

          // Check if slot conflicts with any event
          const hasConflict = events.some(event => {
            const eventStart = new Date(event.start.dateTime || event.start.date);
            const eventEnd = new Date(event.end.dateTime || event.end.date);
            
            return (slotStart < eventEnd && slotEnd > eventStart);
          });

          if (!hasConflict && slotStart > now) {
            freeSlots.push({
              start: slotStart,
              end: slotEnd
            });
          }

          // Limit to 10 slots
          if (freeSlots.length >= 10) break;
        }
        
        if (freeSlots.length >= 10) break;
      }

      return freeSlots;
    } catch (error) {
      logger.error('Find free slots error:', error);
      throw error;
    }
  }

  /**
   * Create calendar event for interview
   */
  async createInterviewEvent(userId, interviewData) {
    try {
      // Get user's tokens
      const userResult = await query(
        'SELECT calendar_token FROM users WHERE id = $1',
        [userId]
      );

      if (!userResult.rows[0]?.calendar_token) {
        throw new Error('Calendar not connected');
      }

      const tokens = JSON.parse(userResult.rows[0].calendar_token);
      this.setCredentials(tokens);

      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      const event = {
        summary: `Interview: ${interviewData.jobTitle} at ${interviewData.company}`,
        description: `
Interview Details:
Position: ${interviewData.jobTitle}
Company: ${interviewData.company}
${interviewData.meetingLink ? `Meeting Link: ${interviewData.meetingLink}` : ''}
${interviewData.location ? `Location: ${interviewData.location}` : ''}
${interviewData.notes ? `Notes: ${interviewData.notes}` : ''}

Powered by JobInt
        `.trim(),
        start: {
          dateTime: interviewData.scheduledAt,
          timeZone: 'America/Los_Angeles'
        },
        end: {
          dateTime: new Date(new Date(interviewData.scheduledAt).getTime() + 
            (interviewData.duration || 60) * 60 * 1000).toISOString(),
          timeZone: 'America/Los_Angeles'
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 60 }
          ]
        }
      };

      if (interviewData.meetingLink) {
        event.conferenceData = {
          entryPoints: [{
            entryPointType: 'video',
            uri: interviewData.meetingLink
          }]
        };
      }

      const response = await calendar.events.insert({
        calendarId: 'primary',
        resource: event,
        conferenceDataVersion: 1
      });

      logger.info(`Calendar event created: ${response.data.id}`);
      return response.data;
    } catch (error) {
      logger.error('Create calendar event error:', error);
      throw error;
    }
  }

  /**
   * Update calendar event
   */
  async updateEvent(userId, eventId, updates) {
    try {
      const userResult = await query(
        'SELECT calendar_token FROM users WHERE id = $1',
        [userId]
      );

      const tokens = JSON.parse(userResult.rows[0].calendar_token);
      this.setCredentials(tokens);

      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      const response = await calendar.events.patch({
        calendarId: 'primary',
        eventId: eventId,
        resource: updates
      });

      return response.data;
    } catch (error) {
      logger.error('Update calendar event error:', error);
      throw error;
    }
  }

  /**
   * Delete calendar event
   */
  async deleteEvent(userId, eventId) {
    try {
      const userResult = await query(
        'SELECT calendar_token FROM users WHERE id = $1',
        [userId]
      );

      const tokens = JSON.parse(userResult.rows[0].calendar_token);
      this.setCredentials(tokens);

      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      await calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId
      });

      logger.info(`Calendar event deleted: ${eventId}`);
      return true;
    } catch (error) {
      logger.error('Delete calendar event error:', error);
      throw error;
    }
  }

  /**
   * Monitor Gmail for interview invitations
   */
  async monitorGmail(userId) {
    try {
      const userResult = await query(
        'SELECT gmail_token FROM users WHERE id = $1',
        [userId]
      );

      if (!userResult.rows[0]?.gmail_token) {
        throw new Error('Gmail not connected');
      }

      const tokens = JSON.parse(userResult.rows[0].gmail_token);
      this.setCredentials(tokens);

      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

      // Search for interview-related emails
      const response = await gmail.users.messages.list({
        userId: 'me',
        q: 'subject:(interview OR schedule OR meet) newer_than:7d',
        maxResults: 10
      });

      const messages = response.data.messages || [];
      const interviews = [];

      for (const message of messages) {
        const detail = await gmail.users.messages.get({
          userId: 'me',
          id: message.id
        });

        const parsed = this.parseInterviewEmail(detail.data);
        if (parsed) {
          interviews.push(parsed);
        }
      }

      return interviews;
    } catch (error) {
      logger.error('Monitor Gmail error:', error);
      throw error;
    }
  }

  /**
   * Parse interview email
   */
  parseInterviewEmail(emailData) {
    try {
      const headers = emailData.payload.headers;
      const subject = headers.find(h => h.name === 'Subject')?.value || '';
      const from = headers.find(h => h.name === 'From')?.value || '';
      
      let body = '';
      if (emailData.payload.parts) {
        const textPart = emailData.payload.parts.find(p => p.mimeType === 'text/plain');
        if (textPart && textPart.body.data) {
          body = Buffer.from(textPart.body.data, 'base64').toString();
        }
      }

      // Simple keyword detection
      const isInterview = /interview|schedule|meet|call/i.test(subject) ||
                          /interview|schedule|meet|call/i.test(body);

      if (!isInterview) return null;

      // Extract company name from email
      const companyMatch = from.match(/@([^.]+)/);
      const company = companyMatch ? companyMatch[1] : 'Unknown';

      return {
        subject,
        from,
        company,
        body: body.substring(0, 500),
        receivedAt: new Date(parseInt(emailData.internalDate))
      };
    } catch (error) {
      logger.error('Parse email error:', error);
      return null;
    }
  }
}

module.exports = new CalendarService();