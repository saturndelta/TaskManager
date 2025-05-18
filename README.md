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

- Frontend: HTML, CSS, JavaScript (vanilla)
- Backend: Google Apps Script
- Database: Google Sheets

## Setup Instructions

### 1. Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com) and create a new spreadsheet
2. Rename it to "Task Management Database" or any name you prefer

### 2. Set up Google Apps Script

1. In your Google Sheet, click on "Extensions" > "Apps Script"
2. Delete any code in the editor and paste the contents of `Code.gs` from this repository
3. Save the project with a name like "Task Management API"
4. Deploy the project as a web app:
   - Click "Deploy" > "New deployment"
   - Select type: "Web app"
   - Set "Execute as" to "Me"
   - Set "Who has access" to "Anyone"
   - Click "Deploy"
   - Copy the web app URL provided after deployment

### 3. Configure the Frontend

1. Open `script.js` in a text editor
2. Replace `YOUR_GOOGLE_SCRIPT_ID_HERE` in the `API_URL` constant with your deployed web app URL

### 4. Deploy to GitHub Pages

1. Create a new GitHub repository
2. Upload all files from this project to your repository
3. Go to repository Settings > Pages
4. Select the main branch as the source and click Save
5. Your site will be published at `https://yourusername.github.io/repository-name/`

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

- Modifying the CSS in `style.css` to change the appearance
- Adding additional fields to tasks by updating the HTML, JavaScript, and Google Apps Script code
- Implementing more advanced features like task comments, file attachments, etc.

## License

This project is available for personal use.