// adapted heavily from https://dev.to/theonlybeardedbeast/comparing-urls-in-javascript-2iha

const urlsEqual = (urlProp1, urlProp2) => {
  if (urlProp1 === urlProp2) return true;
  const url1 = null;
  const url2 = null;
  try {
    const url1 = new URL(urlProp1);
    const url2 = new URL(urlProp2);
  }
  catch (_) {
    return;
  }
  if (! url1 || ! url2) return;

  if (url1.origin != url2.origin) {
    return false;
  }

  if (url1.pathname !== url2.pathname) {
    return false;
  }

  if (
    url1.searchParams.toString().length !== url2.searchParams.toString().length
  ) {
    return false;
  }

  return true;
};

var browser = browser || chrome;

const settingsDefaults = {
  //backup: [],
  site_list: "examplesite.com",
  //maximumBackups: 10,
};

function filterWhiteSpace(arr) {
  return arr.filter((str) => {
    return /\S/.test(str);
  });
}

// returns array
async function getSitesToRemove() {
  let storage = await browser.storage.sync.get({ site_list: "" });
  let text = storage["site_list"];
  if (!text) {
    return [];
  }
  let sites = filterWhiteSpace(text.split("\n"));
  sites = sites.map(site => {
    site = site.replace(/^((https?|ftp):\/\/)?(www\.)?/i, "*") // replace https, ftp and etc with blob
    site = site.replace(/^[^\*]/, "*") // add blob to beginning
    return site;
  })
  return sites
}

function wildcardCheck (i, m) {
  var regExpEscape = function(s) {
      return s.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
  };
  var m = new RegExp('^' + m.split(/\*+/).map(regExpEscape).join('.*') + '$', 'gi');
  return i.match(m) !== null && i.match(m).length >= 1;
};

async function getBrowserStorage() {
  let storage = await browser.storage.sync.get(settingsDefaults);
  app.ports.getBrowserStorage.send(storage["site_list"]);
}

async function setBrowserStorage(message) {
  await browser.storage.sync.set(message);
}

async function listTabs() {
  let tabsList = await browser.tabs.query({});
  let site_list = await getSitesToRemove();
  function tabMatches(tab) {
    if (!site_list) {
      return false;
    }
    return !tab.pinned && site_list.some((site) => {
      // let equal = urlsEqual(site, tab.url);
      let blobMatch = wildcardCheck(tab.url, site);
      return blobMatch;
    });
  }
  let tabsToRemove = tabsList.filter(tabMatches);
  let message = tabsToRemove.map((tab) => { return {id : tab.id, title : tab.title, url : tab.url}; });
  app.ports.listTabs.send(message);
}

async function purgeTabs(ids) {
  if (!ids) return;
  await browser.tabs.remove(ids);
}

var app = Elm.Main.init({
  node: document.getElementById("myapp"),
});

app.ports.setBrowserStorage.subscribe(setBrowserStorage);
app.ports.purgeTabs.subscribe(purgeTabs);
getBrowserStorage();
listTabs();
