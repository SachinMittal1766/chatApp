let socket = io();
let form = document.getElementById("form");
let input = document.getElementById("input");
let feedback = document.getElementById("feedback");
let username = document.getElementById("username");
let messages = document.getElementById('messages')
let online = document.getElementById('online');
let sendBtn = document.querySelector('.btn--send');
let list = document.querySelector('#messages');
let forms = document.forms;
let users = []
let selfId
let md
let myId

let input_file = document.getElementById("input_file");
let label = document.getElementsByClassName("file");

md = window.markdownit({
  html: false,
  linkify: true,
  typographer: true
});

fetch("/me")
  .then((user) => user.json())
  .then((data) => {
    console.log(data);
    document.getElementById('username_holder').innerText = data.username;
    document.getElementById('email_holder').innerText = `<${data.email}>`;
    myId = data
  })

// Color for the messages 
let colors = ['#0080FF', '#8000FF', '#FF00FF', '#FF0080', '#FF0000', '#FF8000', '#80FF00', '#00FF00', '#00FF80']

// let coll = document.getElementsByClassName("collapsible");

// coll[0].addEventListener("click", function () {
//   this.classList.toggle("active");
//   var content = this.nextElementSibling;
//   if (content.style.display === "block") {
//     content.style.display = "none";
//   } else {
//     content.style.display = "block";
//   }
// })

// Add user to collapsible
let addusertolist = (user) => {
  let item = document.createElement("li");
  // item.style.color = (selfId) ? user.color : 'blue';
  item.className = "clearfix";
  item.innerHTML = '<div class="about"><div class="name">' + user.name + '</div></div>';
  item.id = user.id
  item.onclick = handleOnlineClick.bind(null, user.id)
  online.appendChild(item);
}

// Fetch users online as soon as you connect
fetch("/users")
  .then((user) => user.json())
  .then((data) => {
    console.log("asdasd");
    console.log(data);
    data.forEach((user) => {
      user.color = colors[0]
      colors = colors.splice(1)
      addusertolist(user)
    })
    users = users.concat(data)
  })

// Fetch messages as soon as you connect
// fetch("/messages")
//   .then((user) => user.json())
//   .then((data) => {
//     if (data.length>0) {
//       data.map(msg => {
//         let item = document.createElement("li");
//         item.className = "clearfix position-relative"        

//         if (msg.email == myId.email) {
//           item.innerHTML = `<div class="message other-message float-right p-3">${msg.message}</div><span class="text-muted position-absolute bottom--10 end-0 fs-6">${msg.name}, ${msg.time} </span>`;
//         }
//         else {
//           item.innerHTML = `<div class="message my-message p-3">${msg.message}</div><span class="text-muted position-absolute bottom--10 start-0 fs-6">${msg.name}, ${msg.time} </span>`;

//         }
//         messages.appendChild(item);  
//       })
//     }}
//   )
// Sent a chat message to server when submit a form
form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (input.value) {
    socket.emit("mychat message", input.value);
    // console.log("send", input.value);
    input.value = "";
  }
  // if (username.readOnly === false) {
  //   username.readOnly = true;
  //   username.style.backgroundColor = "gold"
  // }
});

// Received from server when someone gets connected
socket.on("connected", ({ id, name }) => {

  users.push({ name: name, id: id, color: colors[0] })
  addusertolist({ name: name, id: id, color: colors[0] })
  colors = colors.splice(1)

  if (selfId) {
    let item = document.createElement("li");
    item.className = 'connection p-2 rounded'
    item.style.color = "black";
    item.textContent = ` ${name} has connected`;
    item.style.backgroundColor = "LightGray";
    messages.appendChild(item);
  }
  else {
    selfId = id
    feedback.innerHTML = "Welcome to Chat App - Instant Messaging App"
    playSound('/welcome.mp3')
  }

  scrollSmoothToBottom('main')
});

// Received from server when someone gets disconnected
socket.on("disconnected", (id) => {
  let current_user = users.filter((user) => user.id === id)
  colors.push(current_user[0].color)
  users = users.filter((user) => user.id != id);

  let item = document.createElement("li");
  item.style.color = "black";
  item.className = 'connection p-2'
  item.style.backgroundColor = "LightGray";
  item.textContent = current_user[0].name + ' has disconnected'
  messages.appendChild(item);

  scrollSmoothToBottom('main')
  removeuserfromlist(id);
  feedback.innerHTML = ''
});

// Recieved from a server when a chat message is received
socket.on("chat message", (user, msg, time, toUser) => {
  console.log(user, msg, time, toUser);
  let item = document.createElement("li");
  item.className = user.id + " clearfix position-relative";

  let current_user = users.filter((_user_) => _user_.id === user.id)
  if (selfId === user.id) {
    item.innerHTML = `<div class="message other-message bg-custom text-white ls-msg float-right p-3 wordwrap"> <span class="pb-2 fw-bold">${user.name}</span><br>${msg}</div><span class="text-muted position-absolute bottom--10 end-0 fs-6">${time} </span>`;
    // item.classList.add('self')
  }
  else {
    // item.style.color = current_user[0].color
    item.innerHTML = `<div class="message my-message ls-msg p-3 wordwrap"><span class="pb-2 fw-bold">${user.name}</span><br>${msg}</div><span class="text-muted position-absolute bottom--10 start-0 fs-6">${time} </span>`;
  }


  // if (toUser !== "null") item.innerHTML = `<b>${user.name}&nbsp;</b><b>toUser: ${toUser.name}&nbsp;</b> <span class="time">${time} </span>` + `<div class="userMsg">${md.render(msg)}</div>`;
  // else item.innerHTML = `<b>${user.name}&nbsp;</b> <span class="time">${time} </span>` + `<div class="userMsg">${md.render(msg)}</div>`;
  // item.innerHTML = `<b>${ user.name }: </b>` + `<div class="userMsg">${msg}</div>`;
  // item.classList.add('messages')
  messages.appendChild(item)

  scrollSmoothToBottom('main')
  if (user.id !== selfId) playSound('/notification.mp3')
  feedback.innerHTML = "";

  // check if someone has set their name
  users.forEach((saved_user) => {
    if (saved_user.id === user.id) {
      saved_user.name = user.name
      let item = document.getElementById(user.id);
      item.innerHTML = `<div class="about">${user.name}</div>`;
    }
  });
});
socket.on("output", ({ result, useremail }) => {
  console.log(result);
  if (result.length) {
    for (var x = 0; x < result.length; x++) {
      let item = document.createElement("li");
      item.className = "clearfix position-relative";

      // item.innerHTML = `<b>${result[x].name}&nbsp;</b> <span class="time">${result[x].time} </span>` + `<div class="userMsg">${md.render(result[x].message)}</div>`;

      if (result[x].email == useremail) {
        // item.classList.add("useridentified");
        item.innerHTML = `<div class="message other-message bg-custom text-white ls-msg float-right p-3 wordwrap"><span class="pb-2 fw-bold">${result[x].name}</span><br>${result[x].message}</div><span class="text-muted position-absolute bottom--10 end-0 fs-6">${result[x].time} </span>`;
      }
      else {
        // item.classList.add('messages');
        item.innerHTML = `<div class="message my-message ls-msg p-3 wordwrap"><span class="pb-2 fw-bold">${result[x].name}</span><br>${result[x].message}</div><span class="text-muted position-absolute bottom--10 start-0 fs-6">${result[x].time} </span>`;
      }
      messages.appendChild(item);
    }
  }
  scroll('main')
});
function scroll(id) {
  var div = document.getElementById(id)
  var scrollHeight = div.scrollHeight
  div.scroll({
    top: scrollHeight + 10,

  })
}


// Sent to server when you type
input.addEventListener("keypress", () => {
  socket.emit("typing", myId.username);
});

//Received from server when someone else is typing
let fbTimer;
socket.on("typing", (user) => {
  clearTimeout(fbTimer);
  feedback.innerHTML = user + " is typing...";
  fbTimer = setTimeout(() => {
    feedback.innerHTML = "";
  }, 2000);
});
// Recieved from a server when an image file is received
socket.on("base64_file", (data, time) => {

  var listitem = document.createElement('li');
  var curr_user_img = users.filter((_user_) => _user_.id === data.id);
  if (selfId === data.id) {
    listitem.classList.add('self');
    input_file.value = "";
  }
  else {
    listitem.style.color = curr_user_img[0].color;
  }
  listitem.innerHTML = `<b>${data.username}&nbsp;</b><span class="time">${time} </span><br><img  src="${data.file}" height="200" width="200"/>`
  listitem.classList.add('messages')
  messages.appendChild(listitem);
  if (data.id !== selfId) playSound('/notification.mp3')
  feedback.innerHTML = "";

  scrollSmoothToBottom('main')

});

// Remove use from collapsible
let removeuserfromlist = (userid) => {
  let item = document.getElementById(userid);
  if (item != null)
    item.remove();
}

// Auto scroll to bottom when messages come
function scrollSmoothToBottom(id) {
  var div = document.getElementById(id)
  var scrollHeight = div.scrollHeight
  div.scroll({
    top: scrollHeight + 10,
    behavior: "smooth"
  })
}

function playSound(url) {
  const audio = new Audio(url);
  audio.play();
}

function handleOnlineClick(id) {
  let current_user = users.filter((user) => user.id === id)
  input.value = `@${current_user[0].name}`
}

// search box JS
const searchBar = forms['search-messages'].querySelector('input');

document.getElementById("search-messages").addEventListener("submit", function (event) {
  event.preventDefault()
});

searchBar.addEventListener('keyup', (e) => {
  e.preventDefault()
  const term = e.target.value.toLowerCase();
  const messageList = list.getElementsByClassName('ls-msg');
  Array.from(messageList).forEach((msgList) => {
    const title = msgList.textContent;
    if (title.toLowerCase().indexOf(e.target.value) !== -1) {
      msgList.parentNode.style.display = 'block';
    } else {
      msgList.parentNode.style.display = 'none';
    }
  });
});
sendBtn.addEventListener('mousedown', () => {
  if (input.value || input_file.value) {
    sendBtn.innerHTML = 'Sent &nbsp;<i class="fas fa-chevron-circle-right"></i>'
    sendBtn.style.backgroundColor = '#38b000'
  }
});

sendBtn.addEventListener('mouseup', () => {
  setTimeout(() => {
    sendBtn.innerHTML = 'Send <i class="fas fa-chevron-circle-right"></i>'
    sendBtn.style.backgroundColor = '#ed1c24'
  }, 400);
});

input.addEventListener("keyup", function (event) {
  if (event.key === 'Enter') {
    sendBtn.click();
    sendBtn.style.backgroundColor = '#38b000'
    setTimeout(() => {
      sendBtn.style.backgroundColor = '#ed1c24'
    }, 400);
  }
});

function readThensend() {
  const data = document.querySelector('input[type=file]').files[0];
  const reader = new FileReader();
  reader.onload = function (evt) {
    var msg = {};
    msg.username = socket.name;
    msg.file = evt.target.result;
    msg.fileName = data.fileName;
    socket.emit("base64_file", msg);
  };
  reader.readAsDataURL(data);
}