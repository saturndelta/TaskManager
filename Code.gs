// --- Main function to serve the web app ---
function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Friends Task Manager')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// --- Include HTML, CSS, JS files ---
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// --- Configuration ---
const TASKS_SHEET_NAME = "Tasks";
const USERS_SHEET_NAME = "Users";

// --- Helper Functions ---
function getSheet(sheetName) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
}

function generateUniqueId() {
  return Utilities.getUuid();
}

function setupSheetsIfNeeded() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Check and create Users sheet if needed
  let usersSheet = ss.getSheetByName(USERS_SHEET_NAME);
  if (!usersSheet) {
    usersSheet = ss.insertSheet(USERS_SHEET_NAME);
    usersSheet.appendRow(["Username", "Password"]);
    usersSheet.getRange("A1:B1").setFontWeight("bold");
  }
  
  // Check and create Tasks sheet if needed
  let tasksSheet = ss.getSheetByName(TASKS_SHEET_NAME);
  if (!tasksSheet) {
    tasksSheet = ss.insertSheet(TASKS_SHEET_NAME);
    tasksSheet.appendRow([
      "TaskID", "VideoLink", "TaskDescription", "Solution", 
      "WhoIsWorkingOn", "Status", "TimeCreated", "CreatedBy", "LastUpdated"
    ]);
    tasksSheet.getRange("A1:I1").setFontWeight("bold");
  }
}

// --- Authentication ---
function loginUser(username, password) {
  setupSheetsIfNeeded();
  const usersSheet = getSheet(USERS_SHEET_NAME);
  if (!usersSheet) return { success: false, message: 'Users sheet not found.' };
  
  const users = usersSheet.getDataRange().getValues();
  for (let i = 1; i < users.length; i++) {
    if (users[i][0] === username && users[i][1] === password) {
      return { success: true, username: username, message: 'Login successful' };
    }
  }
  return { success: false, message: 'Invalid username or password' };
}

function registerUser(username, password) {
  setupSheetsIfNeeded();
  const usersSheet = getSheet(USERS_SHEET_NAME);
  if (!usersSheet) return { success: false, message: 'Users sheet not found.' };
  
  // Check if username already exists
  const users = usersSheet.getDataRange().getValues();
  for (let i = 1; i < users.length; i++) {
    if (users[i][0] === username) {
      return { success: false, message: 'Username already exists' };
    }
  }
  
  // Add new user
  usersSheet.appendRow([username, password]);
  return { success: true, message: 'Registration successful' };
}

function getUsersList() {
  setupSheetsIfNeeded();
  const usersSheet = getSheet(USERS_SHEET_NAME);
  if (!usersSheet) return { success: false, users: [], message: 'Users sheet not found.' };
  const usersData = usersSheet.getDataRange().getValues();
  const users = [];
  for (let i = 1; i < usersData.length; i++) {
    if (usersData[i][0]) {
      users.push(usersData[i][0]);
    }
  }
  return { success: true, users: users };
}

// --- Task Management ---
function getTasks() {
  setupSheetsIfNeeded();
  const tasksSheet = getSheet(TASKS_SHEET_NAME);
  if (!tasksSheet) return { success: false, tasks: [], message: 'Tasks sheet not found.' };
  const data = tasksSheet.getDataRange().getValues();
  const tasks = [];
  const headers = data[0];
  for (let i = 1; i < data.length; i++) {
    let task = {};
    for (let j = 0; j < headers.length; j++) {
      task[headers[j]] = data[i][j];
    }
    tasks.push(task);
  }
  return { success: true, tasks: tasks };
}

function addTask(taskData, username) {
  setupSheetsIfNeeded();
  const tasksSheet = getSheet(TASKS_SHEET_NAME);
  if (!tasksSheet) return { success: false, message: 'Tasks sheet not found.' };
  const newTaskId = generateUniqueId();
  const currentTime = new Date().toISOString();
  const newRow = [
    newTaskId, taskData.videoLink || "", taskData.taskDescription || "",
    taskData.solution || "", taskData.whoIsWorkingOn || "", taskData.status || "Open",
    currentTime, username, currentTime
  ];
  tasksSheet.appendRow(newRow);
  const headers = tasksSheet.getDataRange().getValues()[0];
  const addedTask = {};
  headers.forEach((header, index) => { addedTask[header] = newRow[index]; });
  return { success: true, message: 'Task added successfully', task: addedTask };
}

function updateTask(taskId, updates, username) {
  setupSheetsIfNeeded();
  const tasksSheet = getSheet(TASKS_SHEET_NAME);
  if (!tasksSheet) return { success: false, message: 'Tasks sheet not found.' };
  const data = tasksSheet.getDataRange().getValues();
  const headers = data[0];
  const taskIdColumnIndex = headers.indexOf('TaskID');
  const lastUpdatedColumnIndex = headers.indexOf('LastUpdated');
  if (taskIdColumnIndex === -1) return { success: false, message: 'TaskID column not found.' };

  for (let i = 1; i < data.length; i++) {
    if (data[i][taskIdColumnIndex] === taskId) {
      for (const key in updates) {
        const columnIndex = headers.indexOf(key);
        if (columnIndex !== -1) {
          tasksSheet.getRange(i + 1, columnIndex + 1).setValue(updates[key]);
        }
      }
      if (lastUpdatedColumnIndex !== -1) {
        tasksSheet.getRange(i + 1, lastUpdatedColumnIndex + 1).setValue(new Date().toISOString());
      }
      SpreadsheetApp.flush();
      const updatedRowValues = tasksSheet.getRange(i + 1, 1, 1, headers.length).getValues()[0];
      const updatedTask = {};
      headers.forEach((header, index) => { updatedTask[header] = updatedRowValues[index]; });
      return { success: true, message: 'Task updated successfully', task: updatedTask };
    }
  }
  return { success: false, message: 'Task not found' };
}