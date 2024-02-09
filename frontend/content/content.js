let defaultDisablerActive = false;
let iframeActive = false;
let matchActive = false;
let priceTrackingActive = false;
let anyToggleActive = false;

window.onload = function () {
  console.log("Window loaded");
  console.log("anyToggleActive is: ", anyToggleActive);
  if (anyToggleActive) {
    send_HTML_to_server();
  }
  // Check if default disabler was active before
  if (defaultDisablerActive) {
    defaultDisable();
  }
  // Check if iframe was active before
  console.log("iframe is: ", iframeActive);
  if (iframeActive) {
    init_review();
  }
};

// Establish a connection with the background script
const port = chrome.runtime.connect({ name: "content-script" });
port.onMessage.addListener((msg) => {
  console.log("Message received in content script: ", msg);
  if (!anyToggleActive) {
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
        anyToggleActive = true;
        if (msg.response === "Start Default Disabler") {
          defaultDisable();
          defaultDisablerActive = true;
        } else if (msg.response === "Close Default Disabler") {
          defaultDisablerActive = false;
        } else if (msg.response === "Start Review") {
          init_review();
          console.log("Review started");
        } else if (msg.response === "Close Review") {
          close_review();
          console.log("Review closed");
        } else if (msg.response === "Start Match") {
          create_mismatch_modal();
          console.log("Match started");
        } else if (msg.response === "Close Match") {
          matchActive = false;
          var modal = document.getElementById('mismatchModal');
          modal.style.display = "none";
          modal.parentElement.removeChild(modal);
        }
      })
      .catch((err) => {
        console.error(err);
      });
    chrome.runtime.sendMessage({
      message: 'text',
      payload: text
    });
  } else {
    anyToggleActive = true;
    if (msg.response === "Start Default Disabler") {
      defaultDisable();
      defaultDisablerActive = true;
    } else if (msg.response === "Close Default Disabler") {
      defaultDisablerActive = false;
    } else if (msg.response === "Start Review") {
      init_review();
      console.log("Review started");
    } else if (msg.response === "Close Review") {
      close_review();
      console.log("Review closed");
    } else if (msg.response === "Start Match") {
      create_mismatch_modal();
      console.log("Match started");
    } else if (msg.response === "Close Match") {
      matchActive = false;
      var modal = document.getElementById('mismatchModal');
      modal.style.display = "none";
      modal.parentElement.removeChild(modal);
    }
  }
});

function send_HTML_to_server() {
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

init_review = function () {
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
  iframe.id = 'myIframe1';
  iframe.style.position = 'fixed';
  iframe.style.height = '100%';
  iframe.style.width = "270px";
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

  var reviews
  // Fetch reviews
  fetch("http://127.0.0.1:8000/reviews", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    }
  })
    .then((res) => res.json())
    .then((data) => {
      reviews = data;
      console.log("Reviews is: ", reviews);
      reviews.forEach(function (review) {
        console.log("Review is: ", review);
        var card = create_card(review);
        sideWindow.appendChild(card);
      });
    })
    .catch((err) => {
      console.error(err);
    });

  // Add additional content to side window

  sideWindow.innerHTML += `
    <h2>Expert Reviews</h2>
    <p>Following are some of the expert reviews from various sources.</p>
    `;
  var closeButton = document.createElement('button');
  closeButton.textContent = "X";
  closeButton.style.position = "absolute";
  closeButton.style.top = "2px";
  closeButton.style.right = "2px";
  closeButton.addEventListener('click', function () {
    iframeActive = false;
    iframe.style.width = "0";
    iframe.parentElement.removeChild(iframe);
  });

  // Append side window to iframe
  iframe.onload = function () {
    iframe.contentDocument.body.appendChild(sideWindow);
    iframe.contentDocument.body.appendChild(closeButton);
  };
  // Append iframe to body
  iframeActive = true;
  iframe.style.width = "250px";
  document.body.appendChild(iframe);

};

close_review = function () {
  var iframe = document.getElementById('myIframe1');
  console.log("iframe is: ", iframe);
  console.log("iframe width is: ", iframe.style.width);
  iframeActive = false;
  iframe.style.width = "0";
  console.log("iframe new width is: ", iframe.style.width);
  iframe.parentElement.removeChild(iframe);
};

create_card = function (review) {
  var card = document.createElement('div');
  // card.style.width = "100%";
  card.style.border = "1px solid #000";
  card.style.padding = "5px";
  card.style.marginBottom = "10px";
  card.style.borderRadius = "10px";

  // Create a website
  var website = document.createElement('h3');
  website.textContent = review.website; // Assuming review has a website property
  website.style.marginBlockStart = "0.5rem";
  website.style.marginBlockEnd = "0.5rem";
  card.appendChild(website);

  // Create a link
  var link = document.createElement('a');
  link.href = review.link;
  link.target = "_blank";
  link.textContent = "Read More";
  card.appendChild(link);

  // Create a text area
  var textArea = document.createElement('p');
  textArea.textContent = review.review; // Assuming review has a review property
  textArea.style.fontSize = "14px";
  card.appendChild(textArea);
  return card;
}

create_mismatch_modal = function () {
  // fetch("http://127.0.0.1:8000/match", {
  //   method: "GET",
  //   headers: {
  //     "Content-Type": "application/json",
  //   }
  // })
  //   .then((res) => res.json())
  //   .then((data) => {
  //     console.log("Match is: ", data);
  //     if (data === false) {
  //       // Create a modal element
  //       var modal = document.createElement('div');
  //       modal.id = 'mismatchModal';
  //       modal.style.position = "fixed";
  //       modal.style.top = "0";
  //       modal.style.left = "0";
  //       modal.style.width = "100%";
  //       modal.style.height = "100%";
  //       modal.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  //       modal.style.display = "flex";
  //       modal.style.justifyContent = "center";
  //       modal.style.alignItems = "center";
  //       modal.style.zIndex = "1000";

  //       // Create a modal content container
  //       var modalContent = document.createElement('div');
  //       modalContent.style.backgroundColor = "#fff";
  //       modalContent.style.padding = "20px";
  //       modalContent.style.border = "1px solid #000";
  //       modalContent.style.position = "relative";
  //       // Create a close button
  //       var closeButton = document.createElement('button');
  //       closeButton.textContent = "X";

  //       closeButton.style.position = "absolute";
  //       closeButton.style.top = "2px";
  //       closeButton.style.right = "2px";
  //       closeButton.addEventListener('click', function () {
  //         matchActive = false;
  //         modal.style.display = "none";
  //         modal.parentElement.removeChild(modal);
  //       });

  //       modalContent.appendChild(closeButton);

  //       var text = document.createElement('p');
  //       text.style.color = "red";
  //       text.textContent = "The Product Image and Description might NOT match !!!";

  //       modalContent.appendChild(text);

  //       modal.appendChild(modalContent);

  //       // Append the modal to the document body
  //       document.body.appendChild(modal);
  //       matchActive = true;
  //     } else {
  //       matchActive = true;
  //     }
  //   })
  //   .catch((err) => {
  //     console.error(err);
  //   });
  // Create a modal element
  var modal = document.createElement('div');
  modal.id = 'mismatchModal';
  modal.style.position = "fixed";
  modal.style.top = "0";
  modal.style.left = "0";
  modal.style.width = "100%";
  modal.style.height = "100%";
  modal.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  modal.style.display = "flex";
  modal.style.justifyContent = "center";
  modal.style.alignItems = "center";
  modal.style.zIndex = "1000";

  // Create a modal content container
  var modalContent = document.createElement('div');
  modalContent.style.backgroundColor = "#fff";
  modalContent.style.padding = "20px";
  modalContent.style.border = "1px solid #000";
  modalContent.style.position = "relative";
  // Create a close button
  var closeButton = document.createElement('button');
  closeButton.textContent = "X";

  closeButton.style.position = "absolute";
  closeButton.style.top = "2px";
  closeButton.style.right = "2px";
  closeButton.addEventListener('click', function () {
    matchActive = false;
    modal.style.display = "none";
    modal.parentElement.removeChild(modal);
  });

  modalContent.appendChild(closeButton);

  var text = document.createElement('p');
  text.style.color = "red";
  text.textContent = "The Product Image and Description might NOT match !!!";

  modalContent.appendChild(text);

  modal.appendChild(modalContent);

  // Append the modal to the document body
  document.body.appendChild(modal);
  matchActive = true;
};

