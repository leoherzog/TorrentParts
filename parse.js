const clipboard = require('clipboard');
const parser = require('parse-torrent');
const Buffer = require('Buffer');
const bytes = require('bytes');
const mime = require('mime-types');

var properties = document.getElementById('properties');
var originalSourceIcon = document.getElementById('originalSourceIcon');
var name = document.getElementById('name');
var reset = document.getElementById('reset');
var created = document.getElementById('created');
var createdBy = document.getElementById('createdBy');
var comment = document.getElementById('comment');
var hash = document.getElementById('hash');
var addTrackers = document.getElementById('addTrackers');
var addTracker = document.getElementById('addTracker');
var removeTrackers = document.getElementById('removeTrackers');
var announce = document.getElementById('announce');
var urlList = document.getElementById('urlList');
var addWebseed = document.getElementById('addWebseed');
var removeWebseeds = document.getElementById('removeWebseeds');
var files = document.getElementById('filesBody');
var copyURL = document.getElementById('copyURL');
var copyMagnet = document.getElementById('copyMagnet');
var downloadTorrent = document.getElementById('downloadTorrent');
var parsed;

document.addEventListener('DOMContentLoaded', start);

function start() {

  document.getElementById('magnet').addEventListener('keyup', function(event) {
    event.preventDefault();
    if (event.keyCode === 13) {
      originalSourceIcon.innerHTML = '<span class="fad fa-magnet fa-fw"></span>';
      originalSourceIcon.title = 'Originally sourced from Magnet URL';
      parse(magnet.value);
    }
  });

  document.getElementById('torrent').addEventListener('change', function(event) {
    event.preventDefault();
    event.target.files[0].arrayBuffer().then(function(arrayBuffer) {
      originalSourceIcon.innerHTML = '<span class="fad fa-file fa-fw"></span>';
      originalSourceIcon.title = 'Originally sourced from Torrent file';
      parse(Buffer.from(arrayBuffer));
    });
  });

  let copyurl = new clipboard('#copyURL');
  copyurl.on('success', function(e) {
    console.info(e); // TODO: Alert user to success
  });
  copyurl.on('failure', function(e) {
    console.error(e); // TODO: Alert user to error
  });

  let copymagnet = new clipboard('#copyMagnet');
  copymagnet.on('success', function(e) {
    console.info(e); // TODO: Alert user to success
  });
  copymagnet.on('failure', function(e) {
    console.error(e); // TODO: Alert user to error
  });

  name.addEventListener('input', propertyChange);
  name.addEventListener('change', propertyChange);
  name.addEventListener('reset', propertyChange);
  name.addEventListener('paste', propertyChange);
  reset.addEventListener('click', resetProperties);
  comment.addEventListener('input', propertyChange);
  comment.addEventListener('change', propertyChange);
  comment.addEventListener('reset', propertyChange);
  comment.addEventListener('paste', propertyChange);
  addTrackers.addEventListener('click', addCurrentTrackers);
  addTracker.addEventListener('click', addRow);
  removeTrackers.addEventListener('click', () => removeAllRows('announce'));
  addWebseed.addEventListener('click', addRow);
  removeWebseeds.addEventListener('click', () => removeAllRows('urlList'));

  if (window.location.hash) {
    originalSourceIcon.innerHTML = '<span class="fad fa-link fa-fw"></span>';
    originalSourceIcon.title = 'Originally sourced from Magnet URL in the address bar of this site';
    parse(window.location.hash.split('#')[1]);
  }

}

function parse(toLoad) {
  try {
    console.info("Attempting parse");
    parsed = parser(toLoad);
    display();
    if (parsed.xs) {
      console.log("Magnet includes xs, attempting remote parse");
      parseRemote(parsed.xs);
    }
  }
  catch(e) {
    console.warn(e);
    console.info("Attempting remote parse");
    parseRemote(toLoad);
  }
}

function parseRemote(toLoad) {
  parser.remote(toLoad, function(err, result) {
    if (err) { // TODO: Display error to user
      console.error(err);
      resetProperties();
      return;
    }
    parsed = result;
    display();
  });
}

function display() {

  console.log(parsed);

  resetProperties();

  name.value = parsed.name || "";
  if (parsed.created) created.value = parsed.created.toISOString().slice(0, 19);
  createdBy.value = parsed.createdBy || "";
  comment.value = parsed.comment || "";
  hash.value = parsed.infoHash;

  announce.innerHTML = "";
  if (parsed.announce && parsed.announce.length) {
    for (let i = 0; i < parsed.announce.length; i++) {
      let row = document.createElement('div');
      row.className = 'announce';
      row.dataset.index = i;
      let tracker = document.createElement('input');
      tracker.type = 'text';
      tracker.value = parsed.announce[i];
      tracker.dataset.index = i;
      tracker.dataset.group = 'announce';
      tracker.addEventListener('input', propertyChange);
      row.appendChild(tracker);
      let remove = document.createElement('button');
      remove.dataset.index = i;
      remove.innerHTML = '<span class="fas fa-minus"></span>';
      remove.addEventListener('click', removeRow);
      row.appendChild(remove);
      announce.appendChild(row);
    }
  } else {
    announce.innerHTML = "<em>No trackers specified in the URL/File provided</em>";
  }

  urlList.innerHTML = "";
  if (parsed.urlList && parsed.urlList.length) {
    for (let i = 0; i < parsed.urlList.length; i++) {
      let row = document.createElement('div');
      row.className = 'urlList';
      row.dataset.index = i;
      let webseed = document.createElement('input');
      webseed.type = 'text';
      webseed.value = parsed.urlList[i];
      webseed.dataset.index = i;
      webseed.dataset.group = 'urlList';
      webseed.addEventListener('input', propertyChange);
      row.appendChild(webseed);
      let remove = document.createElement('button');
      remove.dataset.index = i;
      remove.innerHTML = '<span class="fas fa-minus"></span>';
      remove.addEventListener('click', removeRow);
      row.appendChild(remove);
      urlList.appendChild(row);
    }
  } else {
    urlList.innerHTML = "<em>No webseed URLs in the URL/File provided</em>";
  }

  files.innerHTML = "";
  if (parsed.files && parsed.files.length) {
    downloadTorrent.addEventListener('click', saveTorrent);
    downloadTorrent.disabled = false;
    for (let file of parsed.files) {
      let icon = getFontAwesomeIconForMimetype(mime.lookup(file.name));
      files.appendChild(createFileRow(icon, file.name, file.length));
    }
    files.appendChild(createFileRow('folder-tree', '', parsed.length));
  } else {
    downloadTorrent.removeEventListener('click', saveTorrent);
    downloadTorrent.disabled = true;
    files.innerHTML = "<em>Files information isn't included in the URL/File provided</em>";
  }

  copyURL.setAttribute('data-clipboard-text', window.location.origin + "#" + parser.toMagnetURI(parsed));
  copyMagnet.setAttribute('data-clipboard-text', parser.toMagnetURI(parsed));

  properties.style.display = 'block';

  window.location.hash = parser.toMagnetURI(parsed);

  if (parsed.name) {
    document.title = "Torrent Parts | " + parsed.name;
  } else {
    document.title = "Torrent Parts | Inspect and edit what's in your Torrent file or Magnet link";
  }

}

function createFileRow(icon, name, size) {
  let row = document.createElement('tr');
  let iconcell = document.createElement('td');
  iconcell.innerHTML = '<span class="far fa-' + icon + '"></span>';
  row.appendChild(iconcell);
  let namecell = document.createElement('td');
  namecell.innerHTML = name;
  row.appendChild(namecell);
  let totalcell = document.createElement('td');
  totalcell.innerHTML = bytes.format(size, {"decimalPlaces": 1, "unitSeparator": " "});
  row.appendChild(totalcell);
  return row;
}

function getFontAwesomeIconForMimetype(mimetype) {
  if (!mimetype) return 'file';
  switch (true) {
    case mimetype.includes("7z-"):
    case mimetype.includes("iso9660"):
    case mimetype.includes("zip"):
      return 'file-archive';
    case mimetype.includes("audio"):
      return 'file-audio';
    case mimetype.includes("csv"):
      return 'file-csv';
    case mimetype.includes("font"):
      return 'file-contract';
    case mimetype.includes("image"):
      return 'file-image';
    case mimetype.includes("pdf"):
      return 'file-pdf';
    case mimetype.includes("text"):
    case mimetype.includes("subrip"):
    case mimetype.includes("vtt"):
      return 'file-alt';
    case mimetype.includes("video"):
      return 'file-video';
    default:
      return 'file';
  }
}

function propertyChange(e) {
  if (this.dataset.group) {
    parsed[this.dataset.group][this.dataset.index] = this.value || "";
  } else {
    parsed[this.id] = this.value || "";
  }
  window.location.hash = parser.toMagnetURI(parsed);
  updateModified();
}

function resetProperties() {
  document.getElementById('magnet').value = "";
  document.getElementById('torrent').value = "";
  properties.style.display = 'none';
  name.value = "";
  created.value = "";
  createdBy.value = "";
  comment.value = "";
  hash.value = "";
  announce.innerHTML = "";
  urlList.innerHTML = "";
  files.innerHTML = "";
  window.location.hash = "";
  copyURL.setAttribute('data-clipboard-text', "");
  copyMagnet.setAttribute('data-clipboard-text', "");
  document.title = "Torrent Parts | Inspect and edit what's in your Torrent file or Magnet link";
}

async function addCurrentTrackers() {
  addTrackers.disabled = true;
  addTrackers.classList.add('fa-blink');
  try {
    let response = await fetch("https://newtrackon.com/api/100"); // get trackers with 100% uptime
    let trackers = await response.text();
    parsed.announce = parsed.announce.concat(trackers.split('\n\n'));
    parsed.announce = parsed.announce.filter((v,i) => v && parsed.announce.indexOf(v) === i); // remove duplicates and empties
    updateModified();
  }
  catch(e) {
    console.error(e); // TODO: Alert user to error
  }
  addTrackers.classList.remove('fa-blink');
  addTrackers.disabled = false;
  display();
}

function removeAllRows(type) {
  parsed[type] = [];
  updateModified();
  display();
}

function addRow() {
  console.log(this.dataset.type);
  parsed[this.dataset.type].push("");
  display();
}

function removeRow() {
  parsed[this.parentElement.className].splice(this.parentElement.dataset.index, 1);
  display();
}

function updateModified() {
  parsed.created = new Date();
  parsed.createdBy = "Torrent Parts <https://torrent.parts/>";
}

// https://stackoverflow.com/a/36899900/2700296
function saveTorrent() {
  let data = parser.toTorrentFile(parsed);
  if (data !== null && navigator.msSaveBlob)
    return navigator.msSaveBlob(new Blob([data], { "type": "application/x-bittorrent" }), parsed.name + '.torrent');
  let a = document.createElement('a');
  a.style.display = 'none';
  let url = window.URL.createObjectURL(new Blob([data], { "type": "application/x-bittorrent" }));
  a.setAttribute("href", url);
  a.setAttribute("download", parsed.name + '.torrent');
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  a.remove();
}