// Initialize button with user's preferred color
let changeColor = document.getElementById("changeColor");

chrome.storage.sync.get("color", ({
  color
}) => {
  changeColor.style.backgroundColor = color;
});

chrome.storage.sync.set({
  __superDuperApp: []
}, function () {
  console.log("Initilized list");
});

// When the button is clicked, inject main into current page
changeColor.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });
  await chrome.scripting.executeScript({
    target: {
      tabId: tab.id
    },
    files: ['d3.v5.js'],
  });
  await chrome.scripting.executeScript({
    target: {
      tabId: tab.id
    },
    function: main,
  });
  // await chrome.scripting.insertCSS(
  //   {
  //     target: { tabId: tab.id },
  //     files: ["cursor.css"]
  //   })
});

// The body of this function will be executed as a content script inside the
// current page


function main() {
  // TODO: put in config page as user choices
  const config = {
    'keepHightlights': false,
    'hightlightAll': false,
    'saveHistory': false,
    'scroll': true
  }
  // Update storage for search history
  // TODO: limit search to href
  // TODO: point cursor or at least select (active) and scroll to href
  // TODO: replace popup changeColor to input search and remove prompt

  function update(array, keyword) {
    array.push(keyword);
    //then call the set to update with modified value
    chrome.storage.sync.set({
      __superDuperApp: array
    }, function () {
      console.log("added to list with new values");
    });
  }

  // Style, scroll to, point mouse cursor to etc. 
  // key = "__superDuperApp"
  const processElement = (foundElement, keyword) => {
    if(! foundElement) {
      return
    }
    foundElement.style.border = "thick solid #0000FF"
    // if(config.scroll)
    foundElement.scrollIntoView(true)
    let uniqID = '' + Date.now()
    foundElement.setAttribute('__superDuperApp', uniqID)
    chrome.storage.sync.get({
      __superDuperApp: []
    }, function (data) {
      console.log('data from previous session', data.__superDuperApp);
      // Replace by the keyword
      update(data.__superDuperApp, keyword); //storing the storage value in a variable and passing to update function
    });
  }

  // New search lookup 
  function nodeIterator(value) {
    return function () {
      let nodeIterator = document.createNodeIterator(
        this, // The root node of the searched DOM sub-tree.
        NodeFilter.SHOW_TEXT, // Look for text nodes only.
        {
          acceptNode(node) { // The filter method of interface NodeFilter
            return new RegExp(value).test(node.textContent.toLowerCase()) 
            // || new RegExp(value).test(node.href?.toLowerCase())// Check if text contains string
              ?
              NodeFilter.FILTER_ACCEPT // Found: accept node
              :
              NodeFilter.FILTER_REJECT; // Not found: reject and continue
          }
        })
      return nodeIterator;
    }
  }

  const keyword = prompt('Hello, search for what ?').toLowerCase();
  // returns an iterator, but unluckily.
  // TODO: can easily use document.links instead of nodeIterator, 
  // But maybe refactor later
  const filter = nodeIterator(keyword);
  const selector = d3.select("body").select(filter);

  // Cache earlier found elements for whatever reason
  // 1- reset style
  // 2- propose an autocompletion
  // 3- an option to keep all highlighted
  
  if (!config.keepHightlights) {
    document.querySelectorAll('[__superDuperApp]').forEach(node => {
      node.style.border = ""
    });
  }
  

  let foundElements = selector.node()

  const pars = [];
  let currentNode;
  while (currentNode = foundElements.nextNode()) {
    // Found node is a "pure" text node, get parent <text> element.
    // Cache
    const parent = currentNode.parentElement
    if (parent.tagName !== 'A')
      continue
    pars.push(parent);
    processElement(parent, keyword)
  }


}