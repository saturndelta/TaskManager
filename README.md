# Friends Task Management Tool

A web-based task management application where friends can collaborate on tasks. Users can register, login, create tasks, assign them to team members, and track their progress.

## Features

- User registration and authentication
- Create tasks with video links, descriptions, and assignments
- Track task status (Open, In Progress, Solved)
- Add solutions to tasks
- Filter tasks by status and assigned user
- Responsive design for desktop and mobile use

## Technology Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Google Apps Script
- Database: Google Sheets

## Setup Instructions

### 1. Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com) and create a new spreadsheet
2. Rename it to "Task Management Database" or any name you prefer

### 2. Set up Google Apps Script

1. In your Google Sheet, click on "Extensions" > "Apps Script"
2. Create the following files in the Apps Script editor:
   - `Code.gs`: Copy the content from the Code.gs file in this repository
   - `index.html`: Create a new HTML file and copy the content from index.html
   - `style.html`: Create a new HTML file and copy the content from style.html
   - `script.html`: Create a new HTML file and copy the content from script.html
3. Save the project with a name like "Task Management App"
4. Deploy the project as a web app:
   - Click "Deploy" > "New deployment"
   - Select type: "Web app"
   - Set "Execute as" to "Me"
   - Set "Who has access" to "Anyone"
   - Click "Deploy"
   - Copy the web app URL provided after deployment

### 3. Access Your Application

1. Open the web app URL in your browser
2. Register a new account
3. Start creating and managing tasks

## Usage

1. Register a new account or log in with existing credentials
2. Create tasks by filling out the task form
3. Assign tasks to team members
4. Update task status as work progresses
5. Add solutions when tasks are completed
6. Use filters to find specific tasks

## Security Note

This application uses a simple authentication system and stores passwords in plain text in Google Sheets. This is suitable for small, trusted groups of friends but not for sensitive or production environments.

## Customization

You can customize the application by:

- Modifying the CSS in `style.html` to change the appearance
- Adding additional fields to tasks by updating the HTML, JavaScript, and Google Apps Script code
- Implementing more advanced features like task comments, file attachments, etc.

## Troubleshooting

If you encounter issues:

1. Make sure your Google Apps Script deployment is set to "Anyone" for access
2. Check that all HTML files are correctly included in the Apps Script project
3. Verify that the spreadsheet has the correct permissions
4. Check the browser console for any JavaScript errors