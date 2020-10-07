// TODO allow wildcards

// adapted heavily from https://dev.to/theonlybeardedbeast/comparing-urls-in-javascript-2iha
const urlsEqual = (urlProp1, urlProp2) => {
  const url1 = new URL(urlProp1);
  const url2 = new URL(urlProp2);

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

async function tabsToRemove() {
  let tabsList = await browser.tabs.query({});
  let sitesToRemove = await getSitesToRemove();
  function tabMatches(tab) {
    if (!sitesToRemove) {
      return false;
    }
    return (
      !tab.pinned && sitesToRemove.some((site) => urlsEqual(site, tab.url))
    );
  }
  return tabsList.filter(tabMatches);
}

const settingsDefaults = {
  backup: [],
  sitesToRemove: "examplesite.com",
  maximumBackups: 10,
};

// fill with defaults
async function initializeStorage(tabs) {
  let settingsToInitialize = {};
  let storage = await browser.storage.sync.get(settingsDefaults); // retrieves all
  for (const key in settingsDefaults) {
    if (
      !storage[key] ||
      storage[key].constructor !== settingsDefaults[key].constructor
    ) {
      settingsToInitialize[key] = settingsDefaults[key];
    }
  }
  await browser.storage.sync.set(settingsToInitialize);
}

async function backupTabs(tabs) {
  if (!tabs) return;
  let storage = await browser.storage.sync.get(["backup", "maximumBackups"]);
  let currentBackup = storage["backup"];
  let newList = tabs.map((tab) => [tab.url, tab.title]);
  let newBackup = currentBackup.push(newList);
  if (newBackup.length > storage["maximumBackups"]) {
    newBackup.splice(0, 1); // removes first (oldest) element
  }
  await browser.storage.sync.set({ backup: newBackup });
}

async function cleanTabs() {
  let tabs = await tabsToRemove();
  if (!tabs) return;
  let ids = tabs.map((tab) => tab.id);
  await browser.tabs.remove(ids);
  await backupTabs(tabs);
  await displayTabsToDiscard();
}

function filterWhiteSpace(arr) {
  return arr.filter((str) => {
    return /\S/.test(str);
  });
}

// returns array
async function getSitesToRemove() {
  let storage = await browser.storage.sync.get({ sitesToRemove: "" });
  let text = storage["sitesToRemove"];
  if (!text) {
    return [];
  }
  return filterWhiteSpace(text.split("\n"));
}

async function saveSites() {
  let text = document.getElementById("sitesToRemove").value;
  await browser.storage.sync.set({ sitesToRemove: text });
}

async function displayTabsToDiscard() {
  let tabs = await tabsToRemove();
  let tBody = document.getElementById("tabs-to-remove");
  if (!tabs) {
      let div = document.getElementById("to-purge");
      div.innerHTML = "<p>No tabs to purge!</p>";
      return;
    }
  tBody.innerHTML = "";
  tabs.sort((a, b) => a.url < b.url);
  tabs.forEach((tab) => {
    row = tBody.insertRow();
    row.insertCell().innerHTML = tab.title;
    row.insertCell().innerHTML = tab.url;
  });
}

async function initializePopup() {
  let storage = await browser.storage.sync.get("sitesToRemove");
  document.getElementById("sites-to-remove").value = storage["sitesToRemove"];
  displayTabsToDiscard();
  document.querySelector(".button.purge").onclick = cleanTabs;
  document.querySelector(".button.save").onclick = saveSites;
}

async function main() {
  await initializeStorage();
  await initializePopup();
}

main();
