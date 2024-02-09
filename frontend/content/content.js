let defaultDisablerActive = false;
let iframeActive = false;

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
        // var listItem = document.createElement('li');
        // listItem.textContent = review;
        // sideWindow.appendChild(listItem);
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

  // Append side window to iframe
  iframe.onload = function () {
    iframe.contentDocument.body.appendChild(sideWindow);
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
  card.style.width = "100%";
  card.style.border = "1px solid #000";
  card.style.padding = "10px";
  card.style.marginBottom = "10px";

  // Create a website
  var website = document.createElement('h3');
  website.textContent = review.website; // Assuming review has a website property
  card.appendChild(website);

  // Create a link
  var link = document.createElement('a');
  link.href = review.link; // Assuming review has a link property
  link.textContent = "Read More";
  card.appendChild(link);

  // Create a text area
  var textArea = document.createElement('p');
  textArea.textContent = review.review; // Assuming review has a review property
  card.appendChild(textArea);
  return card;
}