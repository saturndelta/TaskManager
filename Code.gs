function doGet(e) {
  let template;
  
  if (e && e.parameter && e.parameter.page === 'admin') {
    template = HtmlService.createTemplateFromFile('admin');
  } else {
    template = HtmlService.createTemplateFromFile('index');
  }
  
  return template
    .evaluate()
    .setTitle('Task Manager')
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

const TASKS_SHEET_NAME = "Tasks";
const USERS_SHEET_NAME = "Users";

function getSheet(sheetName) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
}

function generateUniqueId() {
  return Utilities.getUuid();
}

function setupSheetsIfNeeded() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  let usersSheet = ss.getSheetByName(USERS_SHEET_NAME);
  if (!usersSheet) {
    usersSheet = ss.insertSheet(USERS_SHEET_NAME);
    usersSheet.appendRow(["Username", "Password"]);
    usersSheet.getRange("A1:B1").setFontWeight("bold");
  }
  
  let tasksSheet = ss.getSheetByName(TASKS_SHEET_NAME);
  if (!tasksSheet) {
    tasksSheet = ss.insertSheet(TASKS_SHEET_NAME);
    tasksSheet.appendRow([
      "TaskID", "VideoLink", "TaskDescription", "Solution", 
      "WhoIsWorkingOn", "Status", "TimeCreated", "CreatedBy", "LastUpdated", "priority", "parentTaskId"
    ]);
    tasksSheet.getRange("A1:K1").setFontWeight("bold");
  } else {
    const headers = tasksSheet.getRange(1, 1, 1, tasksSheet.getLastColumn()).getValues()[0];
    
    // Check if priority column exists, add it if not
    if (headers.indexOf("priority") === -1) {
      const newColIndex = tasksSheet.getLastColumn() + 1;
      tasksSheet.getRange(1, newColIndex).setValue("priority").setFontWeight("bold");
      
      if (tasksSheet.getLastRow() > 1) {
        const defaultPriorities = Array(tasksSheet.getLastRow() - 1).fill(["Medium"]);
        tasksSheet.getRange(2, newColIndex, tasksSheet.getLastRow() - 1, 1).setValues(defaultPriorities);
      }
    }
    
    // Check if parentTaskId column exists, add it if not
    if (headers.indexOf("parentTaskId") === -1) {
      const newColIndex = tasksSheet.getLastColumn() + 1;
      tasksSheet.getRange(1, newColIndex).setValue("parentTaskId").setFontWeight("bold");
      
      if (tasksSheet.getLastRow() > 1) {
        const defaultParentIds = Array(tasksSheet.getLastRow() - 1).fill([""]);
        tasksSheet.getRange(2, newColIndex, tasksSheet.getLastRow() - 1, 1).setValues(defaultParentIds);
      }
    }
  }
}

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
  
  const users = usersSheet.getDataRange().getValues();
  for (let i = 1; i < users.length; i++) {
    if (users[i][0] === username) {
      return { success: false, message: 'Username already exists' };
    }
  }
  
  if (users.length > 5) {
    return { success: false, message: 'Maximum user limit (5) reached' };
  }
  
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

function isAdmin(username) {
  setupSheetsIfNeeded();
  const usersSheet = getSheet(USERS_SHEET_NAME);
  if (!usersSheet) return { success: false, isAdmin: false, message: 'Users sheet not found.' };
  
  const usersData = usersSheet.getDataRange().getValues();
  if (usersData.length > 1 && usersData[1][0] === username) {
    return { success: true, isAdmin: true };
  }
  
  return { success: true, isAdmin: false };
}

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
  
  const headers = tasksSheet.getDataRange().getValues()[0];
  let priorityColumnIndex = headers.indexOf('priority');
  let parentTaskIdColumnIndex = headers.indexOf('parentTaskId');
  
  if (priorityColumnIndex === -1) {
    tasksSheet.getRange(1, headers.length + 1).setValue('priority');
    headers.push('priority');
    priorityColumnIndex = headers.length - 1;
  }
  
  if (parentTaskIdColumnIndex === -1) {
    tasksSheet.getRange(1, headers.length + 1).setValue('parentTaskId');
    headers.push('parentTaskId');
    parentTaskIdColumnIndex = headers.length - 1;
  }
  
  const newTaskId = generateUniqueId();
  const currentTime = new Date().toISOString();
  
  const newRow = Array(headers.length).fill("");
  
  const fieldMap = {
    'TaskID': newTaskId,
    'VideoLink': taskData.videoLink || "",
    'TaskDescription': taskData.taskDescription || "",
    'Solution': taskData.solution || "",
    'WhoIsWorkingOn': taskData.whoIsWorkingOn || "",
    'Status': taskData.status || "Open",
    'TimeCreated': currentTime,
    'CreatedBy': username,
    'LastUpdated': currentTime,
    'priority': taskData.priority || "Medium",
    'parentTaskId': taskData.parentTaskId || ""
  };
  
  headers.forEach((header, index) => {
    if (fieldMap[header] !== undefined) {
      newRow[index] = fieldMap[header];
    }
  });
  
  tasksSheet.appendRow(newRow);
  
  const addedTask = {};
  headers.forEach((header, index) => { 
    addedTask[header] = newRow[index]; 
  });
  
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
  const createdByColumnIndex = headers.indexOf('CreatedBy');
  const taskDescriptionColumnIndex = headers.indexOf('TaskDescription');
  
  if (taskIdColumnIndex === -1) return { success: false, message: 'TaskID column not found.' };

  for (let i = 1; i < data.length; i++) {
    if (data[i][taskIdColumnIndex] === taskId) {
      // Check if user is trying to update description but is not the creator
      if (updates.TaskDescription && data[i][createdByColumnIndex] !== username) {
        return { 
          success: false, 
          message: 'Only the task creator can modify the task description.' 
        };
      }
      
      // Apply updates
      for (const key in updates) {
        const columnIndex = headers.indexOf(key);
        if (columnIndex !== -1) {
          tasksSheet.getRange(i + 1, columnIndex + 1).setValue(updates[key]);
        }
      }
      
      // Update LastUpdated timestamp
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