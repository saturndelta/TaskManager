// --- API Endpoints ---

// Handle CORS preflight OPTIONS requests (no custom headers possible)
function doOptions(e) {
  // Google Apps Script does not support setting CORS headers for APIs.
  // This will just return a 200 OK with a simple JSON body.
  return ContentService.createTextOutput(
      JSON.stringify({ status: "ok" })
    )
    .setMimeType(ContentService.MimeType.JSON);
}

// Handle GET requests
function doGet(e) {
  let responseData;
  try {
    const action = e.parameter.action;
    
    // Parse JSON parameters
    const params = {};
    for (const key in e.parameter) {
      if (key !== 'action' && key !== 'callback') {
        try {
          params[key] = JSON.parse(e.parameter[key]);
        } catch (error) {
          params[key] = e.parameter[key];
        }
      }
    }
    
    switch (action) {
      case 'login':
        responseData = loginUser(params.username, params.password);
        break;
      case 'register':
        responseData = registerUser(params.username, params.password);
        break;
      case 'getTasks':
        responseData = getTasks(params.username);
        break;
      case 'addTask':
        responseData = addTask(params.task, params.username);
        break;
      case 'updateTask':
        responseData = updateTask(params.taskId, params.updates, params.username);
        break;
      case 'getUsers':
        responseData = getUsersList();
        break;
      default:
        responseData = { success: false, message: 'Invalid action' };
    }
  } catch (error) {
    responseData = { success: false, message: 'Error: ' + error.toString() };
  }
  
  // Handle JSONP callback
  const callback = e.parameter.callback;
  if (callback) {
    return ContentService.createTextOutput(callback + '(' + JSON.stringify(responseData) + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  } else {
    return ContentService.createTextOutput(JSON.stringify(responseData))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Handle POST requests
function doPost(e) {
  let responseData;
  try {
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;

    switch (action) {
      case 'login':
        responseData = loginUser(requestData.username, requestData.password);
        break;
      case 'register':
        responseData = registerUser(requestData.username, requestData.password);
        break;
      case 'getTasks':
        responseData = getTasks(requestData.username);
        break;
      case 'addTask':
        responseData = addTask(requestData.task, requestData.username);
        break;
      case 'updateTask':
        responseData = updateTask(requestData.taskId, requestData.updates, requestData.username);
        break;
      case 'getUsers':
        responseData = getUsersList();
        break;
      default:
        responseData = { success: false, message: 'Invalid action' };
    }
  } catch (error) {
    responseData = { success: false, message: 'Error: ' + error.toString(), stack: error.stack };
  }

  return ContentService.createTextOutput(JSON.stringify(responseData))
    .setMimeType(ContentService.MimeType.JSON);
}

// --- Configuration ---
const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
const TASKS_SHEET_NAME = "Tasks";
const USERS_SHEET_NAME = "Users";

// --- Helper Functions ---
function getSheet(sheetName) {
  return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);
}

function generateUniqueId() {
  return Utilities.getUuid();
}

function setupSheetsIfNeeded() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
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
function getTasks(username) {
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