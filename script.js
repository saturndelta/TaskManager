// IMPORTANT: Replace with your Google Apps Script Web App URL
const SCRIPT_URL = "https://script.google.com/macros/library/d/1nwXqklrSXpBVekaRTG3CTT6JrMIshjIwA-eq-7-wzsszs0EdRKSrtgJU/1"; 


const loginSection = document.getElementById('loginSection');
const taskSection = document.getElementById('taskSection');
const loginForm = document.getElementById('loginForm');
const taskForm = document.getElementById('taskForm');
const taskListDiv = document.getElementById('taskList');
const userInfoDiv = document.getElementById('userInfo');
const loggedInUserSpan = document.getElementById('loggedInUser');
const logoutButton = document.getElementById('logoutButton');
const loginErrorP = document.getElementById('loginError');
const taskFormErrorP = document.getElementById('taskFormError');
const assignToSelect = document.getElementById('assignTo');

// Edit Modal elements
const editModal = document.getElementById('editTaskModal');
const editTaskForm = document.getElementById('editTaskForm');
const closeButton = document.querySelector('.modal .close-button');
const editTaskIdInput = document.getElementById('editTaskId');
const editVideoLinkInput = document.getElementById('editVideoLink');
const editTaskDescriptionTextarea = document.getElementById('editTaskDescription');
const editSolutionTextarea = document.getElementById('editSolution');
const editAssignToSelect = document.getElementById('editAssignTo');
const editStatusSelect = document.getElementById('editStatus');
const editTaskErrorP = document.getElementById('editTaskError');

// Filter elements
const statusFilter = document.getElementById('statusFilter');
const userFilter = document.getElementById('userFilter');

let allTasks = []; // To store all tasks for client-side filtering
let availableUsers = []; // To store user list

// --- API Communication ---
async function apiCall(action, data = {}) {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'cors', // Important for cross-origin requests
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json', // This is often ignored by GAS for POST, but good practice
            },
            body: JSON.stringify({ action, ...data }),
            redirect: 'follow' // GAS sometimes redirects, so follow it
        });
        
        if (!response.ok) {
            // Try to get more details if possible
            const errorText = await response.text();
            console.error("API Error Response Text:", errorText);
            throw new Error(`Network response was not ok: ${response.statusText} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log("API Response for " + action + ":", result);
        if (!result.success) {
            throw new Error(result.message || 'API call failed');
        }
        return result;
    } catch (error) {
        console.error('API Call Error:', error);
        // Display error to user appropriately in the calling function
        throw error; // Re-throw to be caught by calling function
    }
}


// --- Authentication ---
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginErrorP.textContent = '';
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const result = await apiCall('login', { username, password });
        localStorage.setItem('loggedInUser', result.username);
        showTaskSection(result.username);
        fetchAndRenderTasks();
        fetchAndPopulateUsers();
    } catch (error) {
        loginErrorP.textContent = error.message || 'Login failed. Please try again.';
    }
});

logoutButton.addEventListener('click', () => {
    localStorage.removeItem('loggedInUser');
    showLoginSection();
});

function checkLoginStatus() {
    const user = localStorage.getItem('loggedInUser');
    if (user) {
        showTaskSection(user);
        fetchAndRenderTasks();
        fetchAndPopulateUsers();
    } else {
        showLoginSection();
    }
}

function showLoginSection() {
    loginSection.style.display = 'block';
    taskSection.style.display = 'none';
    userInfoDiv.style.display = 'none';
    allTasks = []; // Clear tasks on logout
    availableUsers = []; // Clear users on logout
}

function showTaskSection(username) {
    loginSection.style.display = 'none';
    taskSection.style.display = 'block';
    userInfoDiv.style.display = 'block';
    loggedInUserSpan.textContent = username;
}

// --- User Population ---
async function fetchAndPopulateUsers() {
    try {
        const result = await apiCall('getUsers');
        availableUsers = result.users || [];
        populateUserDropdown(assignToSelect, availableUsers);
        populateUserDropdown(editAssignToSelect, availableUsers, true); // For edit modal
        populateUserDropdown(userFilter, availableUsers, true, "All Users"); // For filter
    } catch (error) {
        console.error("Failed to fetch users:", error);
        // Handle error (e.g., display a message)
    }
}

function populateUserDropdown(selectElement, users, includeUnassigned = false, defaultOptionText = "Assign to (optional)") {
    selectElement.innerHTML = ''; // Clear existing options

    const defaultOption = document.createElement('option');
    defaultOption.value = "";
    defaultOption.textContent = includeUnassigned ? "Unassigned" : defaultOptionText;
    selectElement.appendChild(defaultOption);
    
    if (defaultOptionText === "All Users") { // Special case for filter
        defaultOption.value = "all";
    }


    users.forEach(user => {
        const option = document.createElement('option');
        option.value = user;
        option.textContent = user;
        selectElement.appendChild(option);
    });
}


// --- Task Management ---
taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    taskFormErrorP.textContent = '';
    const currentUser = localStorage.getItem('loggedInUser');
    if (!currentUser) {
        taskFormErrorP.textContent = "You must be logged in to add tasks.";
        return;
    }

    const taskData = {
        videoLink: document.getElementById('videoLink').value,
        taskDescription: document.getElementById('taskDescription').value,
        whoIsWorkingOn: assignToSelect.value,
        status: "Open" // Default status
    };

    if (!taskData.taskDescription) {
        taskFormErrorP.textContent = "Task description is required.";
        return;
    }

    try {
        const result = await apiCall('addTask', { task: taskData, username: currentUser });
        // Add to local cache and re-render
        if (result.task) {
           allTasks.push(result.task);
           renderTasks();
        } else {
           fetchAndRenderTasks(); // Fallback to refetch all if new task data isn't returned fully
        }
        taskForm.reset();
    } catch (error) {
        taskFormErrorP.textContent = error.message || 'Failed to add task.';
    }
});

async function fetchAndRenderTasks() {
    const currentUser = localStorage.getItem('loggedInUser');
    if (!currentUser) return;

    try {
        const result = await apiCall('getTasks', { username: currentUser });
        allTasks = result.tasks.sort((a, b) => new Date(b.TimeCreated) - new Date(a.TimeCreated)); // Sort by newest first
        renderTasks();
    } catch (error) {
        taskListDiv.innerHTML = `<p class="error-message">Failed to load tasks: ${error.message}</p>`;
    }
}

function renderTasks() {
    taskListDiv.innerHTML = ''; // Clear current list
    if (!allTasks || allTasks.length === 0) {
        taskListDiv.innerHTML = '<p>No tasks yet. Create one!</p>';
        return;
    }

    const filteredTasks = applyFilters(allTasks);

    filteredTasks.forEach(task => {
        const taskEl = document.createElement('div');
        taskEl.classList.add('task-item');
        taskEl.classList.add(`status-${task.Status.replace(/\s+/g, '')}`); // e.g., status-InProgress
        taskEl.dataset.taskId = task.TaskID;

        let assignedToDisplay = task.WhoIsWorkingOn || 'Unassigned';
        let solutionDisplay = task.Solution ? `<p><strong>Solution:</strong> ${linkify(task.Solution)}</p>` : '<p><strong>Solution:</strong> Not provided yet.</p>';
        let videoLinkDisplay = task.VideoLink ? `<p><strong>Video Link:</strong> <a href="${task.VideoLink}" target="_blank" rel="noopener noreferrer">${task.VideoLink}</a></p>` : '';
        
        taskEl.innerHTML = `
            <h3>${escapeHTML(task.TaskDescription)}</h3>
            <div class="task-meta">
                <span><strong>Status:</strong> ${task.Status}</span>
                <span><strong>Assigned To:</strong> ${assignedToDisplay}</span>
                <span><strong>Created:</strong> ${new Date(task.TimeCreated).toLocaleString()} by ${task.CreatedBy}</span>
                <span><strong>Last Updated:</strong> ${new Date(task.LastUpdated).toLocaleString()}</span>
            </div>
            ${videoLinkDisplay}
            <p><strong>Description:</strong> ${linkify(escapeHTML(task.TaskDescription))}</p>
            ${solutionDisplay}
            <div class="task-actions">
                <button class="edit-btn">Edit / Add Solution</button>
                ${task.Status !== 'Solved' ? `<button class="solve-btn">Mark as Solved</button>` : ''}
                ${task.Status === 'Solved' && task.WhoIsWorkingOn === localStorage.getItem('loggedInUser') ? `<button class="reopen-btn">Re-open</button>` : ''}
            </div>
        `;

        // Event Listeners for task actions
        const editBtn = taskEl.querySelector('.edit-btn');
        if (editBtn) {
            editBtn.addEventListener('click', () => openEditModal(task));
        }

        const solveBtn = taskEl.querySelector('.solve-btn');
        if (solveBtn) {
            solveBtn.addEventListener('click', () => updateTaskStatus(task.TaskID, 'Solved', localStorage.getItem('loggedInUser')));
        }
        
        const reopenBtn = taskEl.querySelector('.reopen-btn');
        if (reopenBtn) {
            reopenBtn.addEventListener('click', () => updateTaskStatus(task.TaskID, 'Open', '')); // Re-open and unassign
        }

        taskListDiv.appendChild(taskEl);
    });
}

function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return str.toString().replace(/[&<>"']/g, function (match) {
        return {
            '&': '&',
            '<': '<',
            '>': '>',
            '"': '"',
            "'": '\'',
        }[match];
    });
}

function linkify(text) {
    if (text === null || text === undefined) return '';
    const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    return text.toString().replace(urlRegex, function(url) {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });
}


async function updateTaskStatus(taskId, newStatus, assignedUser = null) {
    const currentUser = localStorage.getItem('loggedInUser');
    const updates = { Status: newStatus };
    if (newStatus === 'Solved') {
        updates.WhoIsWorkingOn = assignedUser || currentUser; // Assign to current user if solving
    } else if (newStatus === 'Open' && assignedUser === '') { // For re-opening and unassigning
        updates.WhoIsWorkingOn = '';
    }


    try {
        const result = await apiCall('updateTask', { taskId, updates, username: currentUser });
        // Update local cache and re-render
        const taskIndex = allTasks.findIndex(t => t.TaskID === taskId);
        if (taskIndex > -1 && result.task) {
            allTasks[taskIndex] = result.task;
            renderTasks();
        } else {
            fetchAndRenderTasks(); // Fallback
        }
    } catch (error) {
        alert(`Failed to update task: ${error.message}`);
    }
}

// --- Edit Modal Logic ---
function openEditModal(task) {
    editTaskIdInput.value = task.TaskID;
    editVideoLinkInput.value = task.VideoLink || '';
    editTaskDescriptionTextarea.value = task.TaskDescription || '';
    editSolutionTextarea.value = task.Solution || '';
    
    // Populate and set assigned user
    populateUserDropdown(editAssignToSelect, availableUsers, true);
    editAssignToSelect.value = task.WhoIsWorkingOn || "";

    editStatusSelect.value = task.Status || "Open";
    
    editTaskErrorP.textContent = '';
    editModal.style.display = 'block';
}

closeButton.onclick = function() {
    editModal.style.display = "none";
}

window.onclick = function(event) {
    if (event.target == editModal) {
        editModal.style.display = "none";
    }
}

editTaskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    editTaskErrorP.textContent = '';
    const currentUser = localStorage.getItem('loggedInUser');

    const taskId = editTaskIdInput.value;
    const updates = {
        VideoLink: editVideoLinkInput.value,
        TaskDescription: editTaskDescriptionTextarea.value,
        Solution: editSolutionTextarea.value,
        WhoIsWorkingOn: editAssignToSelect.value,
        Status: editStatusSelect.value
    };

    if (!updates.TaskDescription) {
        editTaskErrorP.textContent = "Task description cannot be empty.";
        return;
    }

    try {
        const result = await apiCall('updateTask', { taskId, updates, username: currentUser });
        // Update local cache and re-render
        const taskIndex = allTasks.findIndex(t => t.TaskID === taskId);
        if (taskIndex > -1 && result.task) {
            allTasks[taskIndex] = result.task;
            renderTasks();
        } else {
            fetchAndRenderTasks(); // Fallback
        }
        editModal.style.display = "none";
    } catch (error) {
        editTaskErrorP.textContent = `Failed to update task: ${error.message}`;
    }
});

// --- Filtering ---
statusFilter.addEventListener('change', renderTasks);
userFilter.addEventListener('change', renderTasks);

function applyFilters(tasksToFilter) {
    const selectedStatus = statusFilter.value;
    const selectedUser = userFilter.value;
    
    return tasksToFilter.filter(task => {
        const statusMatch = (selectedStatus === 'all') || (task.Status === selectedStatus);
        const userMatch = (selectedUser === 'all') || (task.WhoIsWorkingOn === selectedUser) || (selectedUser === "" && !task.WhoIsWorkingOn); // Handle "Unassigned"
        return statusMatch && userMatch;
    });
}

// --- Initial Load ---
checkLoginStatus();