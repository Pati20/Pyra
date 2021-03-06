window.onload = function () {
    $('#task-add-success').hide();
    $('#task-add-failure').hide();
    $('#board-add-success').hide();
    $('#board-add-failure').hide();
    $('#user-invite-success').hide();
    $('#user-invite-failure').hide();

    const list_items = document.querySelectorAll('.list-item');
    const lists = document.querySelectorAll('.list');
    let draggedItem = null;
    let currStateTile = null;

    for (let i = 0; i < list_items.length; i++) {
        const item = list_items[i];

        item.addEventListener('dragstart', function () {
            draggedItem = item;
            setTimeout(function () {
                item.style.display = 'none';
            }, 0)
        });

        item.addEventListener('dragend', function () {
            setTimeout(function () {
                draggedItem.style.display = 'block';
                let taskId = draggedItem.getAttribute('data-internalid');
                let newState = currStateTile.children[0].textContent;
                updateTaskState(newState, taskId);
                draggedItem = null;
            }, 0);
        })

        for (let j = 0; j < lists.length; j++) {
            const list = lists[j];

            list.addEventListener('dragover', function (e) {
                e.preventDefault();
            });

            list.addEventListener('dragenter', function (e) {
                e.preventDefault();
                currStateTile = list;
                this.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
            });

            list.addEventListener('dragleave', function () {
                this.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
            });

            list.addEventListener('drop', function () {
                this.append(draggedItem);
                this.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
            });
        }
    }
};


// Class BLOCK
class Task {
    constructor(id, title, description, status, priority,
                board, created, last_modified, created_by) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.status = status;
        this.priority = priority;
        this.board = board;
        this.created = created;
        this.last_modified = last_modified;
        this.created_by = created_by;
    }
}

class Contributors {
    constructor(username, email, initials) {
        this.username = username;
        this.email = email;
        this.initials = initials;
    }
}

// GLOBAL VARIABLE BLOCK
let currentUpdatedTask = new Task();
let priorityMapping = new Map();
priorityMapping.set('VH', ['#da1c2ed6', 'Very high', 4])
priorityMapping.set('HIGH', ['#ffa500', 'High', 3])
priorityMapping.set('NORMAL', ['#ffff00', 'Normal', 2])
priorityMapping.set('LOW', ['#37bf37', 'Low', 1])
priorityMapping.set('VL', ['#808080', 'Very low', 0])


function updateTaskState(newState, taskId) {
    $.post({
        url: '/update-task/',
        data: {
            'new_state': newState.toString().trim(),
            'task_id': taskId.toString().trim(),
            csrfmiddlewaretoken: $("input[name='csrfmiddlewaretoken']").val(),
        },
        dataType: 'json',
    });
}

function toggleMenu() {
    document.getElementById("myDropdown").classList.toggle("show");
}

function createNewTask() {
    const title = $('#task-title').val();
    const description = $('#task-description').val();
    const state = $('#task-state').val();
    const priority = $('#task-priority').val();
    const url = window.location.href.split('/');
    const board_id = url[url.length - 2];

    if (!isTaskTitleValid(title) || !isTaskDescriptionValid(description)) {
        return;
    }

    $.post({
        url: '/create-task/',
        data: {
            'title': title,
            'description': description,
            'status': state,
            'priority': priority,
            'board_id': board_id,
            csrfmiddlewaretoken: $("input[name='csrfmiddlewaretoken']").val(),
        },
        dataType: 'json',
        success: () => {
            $('#task-add-failure').hide();
            $('#task-title').val('');
            $('#task-description').val('');
            $('#task-add-success').show();
            setTimeout(() => {
                $('#task-add-success').hide();
            }, 3000)
        }
    });
}

function closeNewTaskModal() {
    $('#task-state').val('TODO');
    $('#task-add-success').hide();
    document.getElementById("myDropdown").classList.toggle("show", false);
    location.reload();
}

function inviteUser() {
    const username = $('#username-input').val();
    const url = window.location.href.split('/');
    const board_id = url[url.length - 2];

    $.post({
        url: '/invite-user/',
        data: {
            'username': username,
            'board_id': board_id,
            csrfmiddlewaretoken: $("input[name='csrfmiddlewaretoken']").val(),
        },
        dataType: 'json',
        success: () => {
            $('#user-invite-failure').hide();
            $('#username-input').val('');
            $('#user-invite-success').show();
            setTimeout(() => {
                $('#user-invite-success').hide();
            }, 3000)
        },
        error: (data) => {
            const responseMessage = JSON.parse(data.responseText)['message'];
            const failureMessageBox = $('#user-invite-failure');

            switch (responseMessage) {
                case "username or board_id can't be empty":
                    failureMessageBox.text('Username can\'t be empty!');
                    break;
                case "User doesn\'t exist":
                    failureMessageBox.text("User doesn't exist!");
                    break;
                case "user already added":
                    failureMessageBox.text("This user has already been added to this board!");
                    break;
            }

            failureMessageBox.show();
        }
    });
}

function closeInviteUserModal() {
    $('#user-invite-failure').hide();
    $('#user-invite-success').hide();
    document.getElementById("myDropdown").classList.toggle("show", false);
}

function createNewBoard() {
    const name = $('#board-name').val();
    const description = $('#board-description').val();
    const csrfToken = $("input[name='csrfmiddlewaretoken']").val()

    if (!isBoardNameValid(name) || !isBoardDescriptionValid(description)) {
        return;
    }

    $.post({
        url: '/create-board/',
        data: {
            name: name,
            description: description,
            csrfmiddlewaretoken: csrfToken
        },
        dataType: 'json',
        success: () => {
            $('#board-add-failure').hide();
            $('#board-name').val('');
            $('#board-description').val('');
            $('#board-add-success').show();
            setTimeout(() => {
                $('#board-add-success').hide();
            }, 3000);
        }
    });
}

function closeNewBoardModal() {
    $('#board-add-success').hide();
    document.getElementById("myDropdown").classList.toggle("show", false);
    location.reload();
}

function isTaskTitleValid(title) {
    if (!isStringLengthValid(title, 30)) {
        displayErrorMessage('task-add-failure', 'Title too long (max 30 characters)!');
        return false
    }

    if (!stringNotEmpty(title)) {
        displayErrorMessage('task-add-failure', 'Title can\'t be empty!');
        return false;
    }

    return true;
}

function isBoardNameValid(title) {
    if (!isStringLengthValid(title, 30)) {
        displayErrorMessage('board-add-failure', 'Name too long (max 30 characters)!');
        return false
    }

    if (!stringNotEmpty(title)) {
        displayErrorMessage('board-add-failure', 'Name can\'t be empty!');
        return false;
    }

    return true;
}

function isTaskDescriptionValid(title) {
    if (!isStringLengthValid(title, 200)) {
        displayErrorMessage('task-add-failure', 'Description too long (max 200 characters)!');
        return false
    }
    if (!stringNotEmpty(title)) {
        displayErrorMessage('task-add-failure', 'Description can\'t be empty!');
        return false;
    }

    return true;
}

function isBoardDescriptionValid(title) {
    if (!isStringLengthValid(title, 200)) {
        displayErrorMessage('board-add-failure', 'Description too long (max 200 characters)!');
        return false
    }
    if (!stringNotEmpty(title)) {
        displayErrorMessage('board-add-failure', 'Description can\'t be empty!');
        return false;
    }

    return true;
}

function isStringLengthValid(str, len) {
    return (str.length <= len);
}

function stringNotEmpty(str) {
    return str.length > 0;
}

function displayErrorMessage(alertBoxId, errorMessage) {
    const alertBox = $('#' + alertBoxId);
    alertBox.text(errorMessage);
    alertBox.show();
}

function loadTaskView(task) {

    this.currentUpdatedTask = task[0]['fields'];
    this.currentUpdatedTask.id = task[0]['pk'];
    this.contributors = task[1]['contributors']
    this.currentUpdatedTask.created = assignFormattedDate(this.currentUpdatedTask.created);
    this.currentUpdatedTask.last_modified = assignFormattedDate(this.currentUpdatedTask.last_modified);
    toggleTaskEditMode();
    passDataIntoEditTemplate();
    generateAssignedMember();
    getAllUsers()
}

function toggleTaskEditMode() {
    document.getElementById("edit-task-block").classList.toggle("hide");
}

function assignFormattedDate(data) {
    let dataArr = data.split('T');
    return dataArr[0].concat(' ').concat(dataArr[1].substr(0, 8))
}

function toggleTaskMenu() {
    document.getElementById('edit-task').classList.toggle("show");
}

function toggleTaskPriority() {
    document.getElementById('edit-priority').classList.toggle("show");
}

function toggleAssignedMember() {
    document.getElementById('users').classList.toggle("show");
}

function updateMenuValue(id) {
    document.getElementById("taskDropDown").innerText = id.toUpperCase();
    toggleTaskMenu();
}

function setTaskOptionStatus(idKey) {
    assignNewPriority(idKey)
    toggleTaskPriority()
}

function assignNewPriority(idKey) {
    let statusObj = document.getElementById('priority-val');
    statusObj.innerText = priorityMapping.get(idKey)[1];
    statusObj.style.background = priorityMapping.get(idKey)[0];
}

function passDataIntoEditTemplate() {
    document.getElementById('title-value').value = this.currentUpdatedTask.title;
    document.getElementById('desc-value').value = this.currentUpdatedTask.description;
    assignNewPriority(this.currentUpdatedTask.priority)
    document.getElementById("taskDropDown").innerText = this.currentUpdatedTask.status;
    document.getElementById("create-val").innerText = this.currentUpdatedTask.created;
    document.getElementById("modify-val").innerText = this.currentUpdatedTask.last_modified;
}

function onSaveTask() {

    $.post({
        url: '/update-task-all/',
        data: {
            id: this.currentUpdatedTask.id,
            title: document.getElementById('title-value').value,
            description: document.getElementById('desc-value').value,
            status: document.getElementById("taskDropDown").innerText,
            priority: document.getElementById('priority-val').innerText,
            user: $("#assigned-member-id").val(),
            csrfmiddlewaretoken: $("input[name='csrfmiddlewaretoken']").val(),
        },
        dataType: 'json',
        success: () => {
            toggleTaskEditMode();
        },
        error: () => {
            toggleTaskEditMode();
        },
    }).always(
        location.reload()
    );
}

function generateAssignedMember() {
    let rootElem = document.getElementById('members');
    rootElem.innerHTML = ''; // clear nodes

    if (this.contributors.length > 0) {
        for (const contributor of this.contributors) {
            let newDiv = document.createElement("div");
            newDiv.classList = 'rounded-circle member mr-1'
            let span = document.createElement("span");
            span.classList = 'member-initials';
            span.setAttribute('title', contributor.username + " " + contributor.email);
            span.setAttribute('aria-label', contributor.email);
            span.innerHTML = contributor.initials
            newDiv.appendChild(span);
            rootElem.appendChild(newDiv)
        }
    } else {
        rootElem.innerHTML = 'Not assigned';
    }
}

function getAllUsers() {
    const location = window.location.href.split('/');
    $.get({
        url: '/available-users/',
        data: {
            board: location[location.length - 2],
            task: this.currentUpdatedTask.id
        },
        success: (data) => {
            fillMenuWithUsers(data['users'])
        }
    });
}

function fillMenuWithUsers(users) {
    let root = document.getElementById('users');
    root.innerText = ''
    for (const user of users) {
        let aTag = document.createElement("a");
        aTag.classList = 'dropdown-item';
        aTag.setAttribute("href", '#');
        aTag.innerText = user.username
        aTag.addEventListener('click', () => {
            document.getElementById('assign-member').innerText = user.username;
            $("#assigned-member-id").val(user.id)
            toggleAssignedMember();
        })
        root.appendChild(aTag)
    }
}
