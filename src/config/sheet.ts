import { google } from "googleapis";

// Set up Google authentication
const auth = new google.auth.GoogleAuth({
  keyFile: "./google-credentials.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

// Create a Google Sheets instance
const sheets = google.sheets({ version: "v4", auth });

// Export the configured sheets object for global use
export { sheets };
