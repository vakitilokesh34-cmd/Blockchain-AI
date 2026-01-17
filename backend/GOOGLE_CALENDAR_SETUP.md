# Google Calendar API Setup Guide

To enable the agent to schedule real Google Meet meetings, you need to set up a **Google Service Account**.

## Step 1: Create a Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g., "University Agent").

## Step 2: Enable Calendar API
1. In the sidebar, go to **APIs & Services > Library**.
2. Search for "Google Calendar API".
3. Click **Enable**.

## Step 3: Create Service Account & Keys
1. Go to **APIs & Services > Credentials**.
2. Click **Create Credentials** > **Service Account**.
3. Name it (e.g., "calendar-scheduler") and click **Done**.
4. Click on the newly created service account email (e.g., `calendar-scheduler@project-id.iam.gserviceaccount.com`).
5. Go to the **Keys** tab.
6. Click **Add Key > Create new key**.
7. Select **JSON** and create. A file will download to your computer.

## Step 4: Configure Environment Variables
Open the downloaded JSON file. It looks like this:
```json
{
  "type": "service_account",
  "project_id": "...",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "calendar-scheduler@project-id.iam.gserviceaccount.com",
  ...
}
```

Copy the values into your `backend/.env` file:
```env
GOOGLE_CLIENT_EMAIL=your-service-account-email@...
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```
*Note: Make sure to keep the double quotes around the private key if it contains newlines (`\n`).*

## Step 5: Share Your Calendar (Crucial!)
The Service Account acts like a generic user. It cannot edit *your* personal calendar unless you give it permission.
1. Go to [Google Calendar](https://calendar.google.com/).
2. Find the calendar you want meetings to appear on (e.g., your primary one) in the left sidebar.
3. Click the three dots > **Settings and sharing**.
4. Scroll to **Share with specific people**.
5. Click **Add people**.
6. Paste the **Service Account Email** (`client_email` from step 4).
7. **Permission**: Select **"Make changes to events"**.
8. Click **Send**.

Now the agent can create events on your calendar!
