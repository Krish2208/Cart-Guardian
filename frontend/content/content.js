
window.onload = function () {
  let text = document.documentElement.outerHTML;
  console.log(text);

  fetch("http://127.0.0.1:8000/page", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ pageData: text, pageUrl: window.location.href, pageTitle: document.title }),
  })
    .then((res) => res.json())
    .then((data) => {
      console.log(data);
    })
    .catch((err) => {
      console.error(err);
    });
  chrome.runtime.sendMessage({
    message: 'text',
    payload: text
  });
};

// Establish a connection with the background script
const port = chrome.runtime.connect({ name: "content-script" });
port.onMessage.addListener((msg) => {
  if (msg.response === "Start Default Disabler") {
    defaultDisable();
  } else if (msg.response === "Start Review") {
    
    // Inject CSS
    var style = document.createElement('style');
    style.textContent = `
      .side-window {
        height: 100%;
        width: 0;
        position: fixed;
        z-index: 1000;
        top: 0;
        right: 0;
        background-color: white;
        opacity: 1;
        overflow-x: hidden;
        transition: 0.5s;
        // padding-top: 60px;
      }

      .side-window a {
        padding: 8px 8px 8px 32px;
        text-decoration: none;
        font-size: 25px;
        color: #818181;
        display: block;
        transition: 0.3s;
      }

      .side-window a:hover {
        color: #f1f1f1;
      }

      .side-window .closebtn {
        position: absolute;
            top: 0;
            right: 25px;
            font-size: 36px;
            margin-left: 50px;
          }
    `;
    document.head.appendChild(style);
    // Create iframe
    var iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.height = '100%';
    iframe.style.width = "250px";
    iframe.style.top = '0';
    iframe.style.right = '0';
    iframe.style.zIndex = '1000';
    iframe.style.border = 'none';
    iframe.style.overflow = 'hidden';
    iframe.style.transition = '0.5s';
    iframe.style.backgroundColor = 'white';
    // Create side window div
    var sideWindow = document.createElement('div');
    sideWindow.id = 'mySideWindow';
    sideWindow.className = 'side-window';

    // Add additional content to side window
    sideWindow.innerHTML += `
      <h2>Side Window</h2>
      <p>This is a sample side window.</p>
      `;

    // Append side window to iframe
    iframe.onload = function () {
      iframe.contentDocument.body.appendChild(sideWindow);
    };
    // Append iframe to body
    iframe.style.width = "250px";
    document.body.appendChild(iframe);
  } else if (msg.response === "Close Review") {
    // Close side window
    var iframe = document.querySelector('iframe');
    iframe.style.width = "0";
    iframe.parentElement.removeChild(iframe);
  }
});

function defaultDisable() {
  var inputs = document.querySelectorAll('input, select, textarea');
  inputs.forEach(function (input) {
    if (input.type === 'text' || input.type === 'password' || input.type === 'email' || input.type === 'search' || input.type === 'tel' || input.type === 'url') {
      input.value = '';
    } else if (input.type === 'checkbox' || input.type === 'radio') {
      input.checked = false;
    } else if (input.type === 'number') {
      input.value = '';
    } else if (input.type === 'range') {
      input.value = 0;
    } else if (input.type === 'file') {
      input.value = null;
    } else if (input.type === 'select-one' || input.type === 'select-multiple') {
      input.selectedIndex = -1;
    } else if (input.nodeName === 'TEXTAREA') {
      input.value = '';
    }
  });
}

function openSideWindow() {
  document.getElementById("mySideWindow").style.width = "250px";
}

function closeSideWindow() {
  document.getElementById("mySideWindow").style.width = "0";
}
