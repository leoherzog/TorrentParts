const clipboard = require('clipboard');
const parser = require('parse-torrent');
const Buffer = require('Buffer');
const bytes = require('bytes');
const mime = require('mime-types');

var properties = document.getElementById('properties');
var name = document.getElementById('name');
var created = document.getElementById('created');
var createdBy = document.getElementById('createdBy');
var comment = document.getElementById('comment');
var hash = document.getElementById('hash');
var addTrackers = document.getElementById('addTrackers');
var removeTrackers = document.getElementById('removeTrackers');
var announce = document.getElementById('announce');
var urlList = document.getElementById('urlList');
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
      parse(magnet.value);
    }
  });

  document.getElementById('torrent').addEventListener('change', function(event) {
    event.preventDefault();
    event.target.files[0].arrayBuffer().then(arrayBuffer => parse(Buffer.from(arrayBuffer)));
  });

  let copyurl = new clipboard('#copyURL');
  copyurl.on('success', function(e) {
    console.info(e); // TODO: Alert user to success
  });
  copyurl.on('failure', function(e) {
    console.error(e);
  });

  let copymagnet = new clipboard('#copyMagnet');
  copymagnet.on('success', function(e) {
    console.info(e); // TODO: Alert user to success
  });
  copymagnet.on('failure', function(e) {
    console.error(e);
  });

  downloadTorrent.addEventListener('click', saveTorrent);

  name.addEventListener('input', propertyChange);
  createdBy.addEventListener('change', propertyChange);
  comment.addEventListener('input', propertyChange);
  addTrackers.addEventListener('click', addCurrentTrackers);
  removeTrackers.addEventListener('click', removeCurrentTrackers);
  removeWebseeds.addEventListener('click', removeCurrentWebseeds);

  if (window.location.hash) parse(window.location.hash.split('#')[1]);

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
      display();
      return;
    }
    parsed = result;
    display();
  });
}

function display() {

  document.getElementById('magnet').value = "";
  document.getElementById('torrent').value = "";

  console.log(parsed);

  name.value = parsed.name || "";
  if (parsed.created) created.value = parsed.created.toISOString().slice(0, 19);
  createdBy.value = parsed.createdBy || "";
  comment.value = parsed.comment || "";
  hash.value = parsed.infoHash;

  announce.innerHTML = "";
  if (parsed.announce && parsed.announce.length) {
    for (let i = 0; i < parsed.announce.length; i++) {
      let tracker = document.createElement('input');
      tracker.className = 'tracker';
      tracker.type = 'text';
      tracker.value = parsed.announce[i];
      tracker.dataset.index = i;
      tracker.dataset.group = 'announce';
      tracker.addEventListener('input', propertyChange);
      announce.appendChild(tracker);
    }
  } else {
    announce.innerHTML = "<em>No trackers specified in the URL/File provided</em>";
  }

  urlList.innerHTML = "";
  if (parsed.urlList && parsed.urlList.length) {
    for (let i = 0; i < parsed.urlList.length; i++) {
      let webseed = document.createElement('input');
      webseed.className = 'webseed';
      webseed.type = 'text';
      webseed.value = parsed.urlList[i];
      webseed.dataset.index = i;
      webseed.dataset.group = 'urlList';
      webseed.addEventListener('input', propertyChange);
      urlList.appendChild(webseed);
    }
  } else {
    urlList.innerHTML = "<em>No webseed URLs in the URL/File provided</em>";
  }

  files.innerHTML = "";
  if (parsed.files && parsed.files.length) {
    for (let file of parsed.files) {
      let icon = getFontAwesomeIconForMimetype(mime.lookup(file.name));
      files.appendChild(createFileRow(icon, file.name, file.length));
    }
    files.appendChild(createFileRow('folder-tree', '', parsed.length));
  } else {
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
  if (e.target.dataset.group) {
    parsed[e.target.dataset.group][e.target.dataset.index] = e.target.value || "";
  } else {
    parsed[e.target.id] = e.target.value || "";
  }
  updateModified();
  display();
}

async function addCurrentTrackers() {
  addTrackers.disabled = true;
  let response = await fetch("https://newtrackon.com/api/100"); // 100% uptime
  let trackers = await response.text();
  parsed.announce = parsed.announce.concat(trackers.split('\n\n'));
  parsed.announce = parsed.announce.filter((v,i) => v && parsed.announce.indexOf(v) === i); // remove duplicates and empties
  updateModified();
  addTrackers.disabled = false;
  display();
}

function removeCurrentTrackers() {
  parsed.announce = [];
  updateModified();
  display();
}

function removeCurrentWebseeds() {
  parsed.urlList = [];
  updateModified();
  display();
}

function updateModified() {
  created.value = new Date().toISOString().slice(0, 19);
  parsed.created = new Date();
  createdBy.value = "Torrent Parts <https://torrent.parts/>";
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