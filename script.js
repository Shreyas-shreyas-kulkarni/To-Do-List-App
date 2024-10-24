let addButton = document.getElementById("addTask");
let taskInput = document.getElementById("taskInput");
let taskList = document.getElementById("taskList");
let note = document.querySelector(".note");
let overflow = document.querySelector(".list-for-overflow");

let db;
let request = indexedDB.open("taskDB", 1);

request.onerror = function(event) {
    console.log("Error opening IndexedDB:", event);
};

request.onsuccess = function(event) {
    db = event.target.result;
    loadTasks(); // Load tasks when the page loads
};

request.onupgradeneeded = function(event) {
    db = event.target.result;
    let objectStore = db.createObjectStore("tasks", { keyPath: "id", autoIncrement: true });
    objectStore.createIndex("task", "task", { unique: false });
}

// Function to add a task
function addTask() {
    let task = taskInput.value.trim(); // Trim whitespace from input

    // Check if the input is empty
    if (task === "") {
        note.style.visibility = "visible"; // Show note if input is empty
        return; // Exit the function if no task is entered
    } else {
        note.style.visibility = "hidden"; // Hide note if input is not empty
        overflow.style.visibility = "visible"; // Show overflow if input is not empty
    }

    // Create and add the task to the list
    createTaskElement(task);
    taskInput.value = ""; // Clear input field
    saveTask(task); // Save tasks to IndexedDB
}

// Add event listener for the Add button
addButton.addEventListener("click", addTask);

// Create task list item element with a delete button and checkbox
function createTaskElement(task) {
    let listItem = document.createElement("li");
    
    // Create checkbox
    let checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "checkbox";

    // Set the text content of the task
    listItem.textContent = task;

    // Add checkbox change event listener to toggle text color
    checkbox.addEventListener("change", function () {
        if (checkbox.checked) {
            listItem.style.textDecoration = "line-through"; // Strike-through text
            listItem.style.color = "grey"; // Change color to grey
        } else {
            listItem.style.textDecoration = "none"; // Remove strike-through
            listItem.style.color = "black"; // Reset color to black
        }
    });

    // Create delete button for each task
    const deleteButton = document.createElement("button");
    deleteButton.textContent = 'Delete';
    deleteButton.className = "deleteTask";
    
    // Append checkbox and delete button to the task item
    listItem.prepend(checkbox); // Insert checkbox at the beginning
    listItem.appendChild(deleteButton);

    // Delete task when the delete button is clicked
    deleteButton.addEventListener("click", () => {
        taskList.removeChild(listItem);
        deleteTask(task); // Delete from IndexedDB
        checkNoteVisibility(); // Check visibility of the note after deletion
    });

    taskList.appendChild(listItem);
}

// Save tasks to IndexedDB
function saveTask(task) {
    let transaction = db.transaction(["tasks"], "readwrite");
    let objectStore = transaction.objectStore("tasks");

    let request = objectStore.add({ task: task });
    request.onerror = function(event) {
        console.log("Error saving task:", event);
    };
    request.onsuccess = function(event) {
        console.log("Task saved to IndexedDB");
    };
}

// Load tasks from IndexedDB and display them
function loadTasks() {
    let transaction = db.transaction(["tasks"], "readonly");
    let objectStore = transaction.objectStore("tasks");

    let hasTasks = false; // Track if there are any tasks

    objectStore.openCursor().onsuccess = function(event) {
        let cursor = event.target.result;
        if (cursor) {
            createTaskElement(cursor.value.task); // Create element for each stored task
            hasTasks = true; // Set to true if at least one task is loaded
            cursor.continue();
        } else {
            // Once all tasks are loaded, check if there are any tasks
            checkNoteVisibility(hasTasks); // Pass the result to checkNoteVisibility
        }
    };
}

// Delete tasks from IndexedDB
function deleteTask(task) {
    let transaction = db.transaction(["tasks"], "readwrite");
    let objectStore = transaction.objectStore("tasks");

    let index = objectStore.index("task");
    let request = index.openCursor(IDBKeyRange.only(task));

    request.onsuccess = function(event) {
        let cursor = event.target.result;
        if (cursor) {
            objectStore.delete(cursor.primaryKey); // Delete the task from IndexedDB
            console.log("Task deleted from IndexedDB");
        }
    };
}

// Function to check visibility of the note based on the task list
function checkNoteVisibility(hasTasks) {
    if (taskList.children.length === 0 && !hasTasks) {
        note.style.visibility = "visible"; // Show note if no tasks
        overflow.style.visibility = "hidden"; // Hide overflow if no tasks
    } else {
        note.style.visibility = "hidden"; // Hide note if there are tasks
        overflow.style.visibility = "visible"; // Show overflow if there are tasks
    }
}
