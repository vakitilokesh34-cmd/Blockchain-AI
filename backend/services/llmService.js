const { VertexAI } = require('@google-cloud/vertexai');
require('dotenv').config();

class LLMService {
  constructor() {
    this.project = process.env.GOOGLE_PROJECT_ID || 'ultra-acre-469914-f0';
    this.location = 'us-central1';

    // Construct credentials object from env vars
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    // Handle potential escaped newlines in env var
    const privateKey = process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined;

    this.vertexAI = null;
    this.model = null;

    if (clientEmail && privateKey) {
      try {
        this.vertexAI = new VertexAI({
          project: this.project,
          location: this.location,
          googleAuthOptions: {
            credentials: {
              client_email: clientEmail,
              private_key: privateKey
            }
          }
        });
        this.model = this.vertexAI.getGenerativeModel({ model: 'gemini-1.5-flash-001' });
        console.log('[LLM-SERVICE] Vertex AI initialized with environment credentials');
      } catch (error) {
        console.error('[LLM-SERVICE] Failed to initialize Vertex AI:', error);
      }
    } else {
      console.warn('[LLM-SERVICE] Missing GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY in environment');
    }
  }

  /**
   * Parse a natural language command into a workflow ID and parameters
   */
  async parseCommand(command, availableWorkflows) {
    if (!this.model) {
      console.warn('[LLM-SERVICE] Vertex AI model not available, falling back to regex parsing');
      return this.fallbackParse(command);
    }

    const prompt = `
      You are an AI assistant for a university management system. 
      Analyze the following user command and map it to one of the available workflows.
      
      Available Workflows:
      ${JSON.stringify(availableWorkflows, null, 2)}
      
      User Command: "${command}"
      
      Extract any scheduling information if present (e.g., "next Friday", "tomorrow at 2pm").
      Default to "tomorrow 10am" if a meeting is implied but no time is specified.
      
      Return ONLY a JSON object with the following structure:
      {
        "workflowId": "the_id_of_the_matched_workflow",
        "params": {
          "threshold": 75,
          "targetDate": "YYYY-MM-DD HH:mm" or "human readable date string",
          "scheduleMeeting": boolean
        },
        "confidence": 0.95
      }
      
      If no workflow matches, return:
      {
        "workflowId": null,
        "params": {},
        "confidence": 0
      }
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      // Vertex AI response structure might differ slightly, but usually .text() is available on the candidate
      // The SDK returns { response: { candidates: [...] } }
      // Helper method .text() might not be directly on response if it's the raw object
      // But let's safely access candidates

      const candidate = response.candidates[0];
      const text = candidate.content.parts[0].text;

      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Could not parse JSON from LLM response');
    } catch (error) {
      console.error('[LLM-SERVICE] Error calling Vertex AI:', error);
      return this.fallbackParse(command);
    }
  }

  /**
   * Fallback regex parsing if LLM is unavailable
   */
  fallbackParse(command) {
    const cmd = command.toLowerCase();

    // Fallback regex parsing result
    const result = {
      workflowId: null,
      params: {},
      confidence: 0
    };

    // Attendance monitoring patterns
    // Enhanced regex to catch critical vs low
    const criticalMatch = cmd.match(/(?:notify|flag|alert|check).*students.*(?:under|below|<)\s*(\d+)/i);

    if (criticalMatch) {
      const threshold = parseInt(criticalMatch[1]);
      if (threshold < 65) {
        result.workflowId = 'attendance_critical_60';
      } else {
        result.workflowId = 'attendance_low_75';
      }
      result.params.threshold = threshold;
      result.confidence = 0.8;
    } else if (cmd.includes('attendance') && cmd.includes('65')) {
      result.workflowId = 'attendance_critical_60';
      result.params.threshold = 65;
      result.confidence = 0.8;
    } else if (cmd.includes('attendance')) {
      // Default low attendance
      result.workflowId = 'attendance_low_75';
      result.params.threshold = 75;
      result.confidence = 0.7;
    }

    // Assignment tracking
    if (cmd.includes('assignment') || cmd.includes('incomplete') || cmd.includes('deadline')) {
      result.workflowId = 'assignment_tracking';
      result.confidence = 0.8;
    }


    // Performance review
    if (cmd.includes('performance') || cmd.includes('review')) {
      result.workflowId = 'performance_review';
      result.confidence = 0.8;
    }

    // Extraction of scheduling info
    if (cmd.includes('schedule') || cmd.includes('meeting') || cmd.includes('google meet')) {
      result.params.scheduleMeeting = true;

      // Simple date extraction regex (e.g., "next monday", "tomorrow", "on friday")
      const dateMatch = cmd.match(/(?:for|on|at)\s+((?:next\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today)(?:\s+at\s+\d+(?:am|pm)?)?)/i);
      if (dateMatch) {
        result.params.targetDate = dateMatch[1];
      } else {
        result.params.targetDate = "Tomorrow 10am";
      }
    }

    return result;
  }
}

module.exports = new LLMService();
