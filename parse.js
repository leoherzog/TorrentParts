const parser = require('parse-torrent');
const Buffer = require('Buffer');
const bytes = require('bytes');
const mime = require('mime-types');
const clipboard = require('clipboard');

var name = document.getElementById('name');
var creationDate = document.getElementById('creationDate');
var createdBy = document.getElementById('createdBy');
var comment = document.getElementById('comment');
var hash = document.getElementById('hash');
var trackers = document.getElementById('trackers');
var webseeds = document.getElementById('webseeds');
var files = document.getElementById('filesBody');
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

  new clipboard('#copyMagnet'); // TODO: Alert user to success
  downloadTorrent.addEventListener('click', saveTorrent);

}

function parse(toLoad) {
  try {
    console.info("Attempting parse");
    parsed = parser(toLoad);
    display();
  }
  catch(e) {
    console.warn("That didn't work. Attempting remote parse.");
    parser.remote(toLoad, function(err, result) {
      if (err) return; // TODO: Display error to user
      parsed = result;
      display();
    });
  }
}

function display() {

  document.getElementById('magnet').value = "";
  document.getElementById('torrent').value = "";

  console.log(parsed);

  name.value = parsed.name || "";
  if (parsed.created) {
    creationDate.disabled = false;
    creationDate.value = parsed.created.toISOString().slice(0, 19);
  } else {
    creationDate.disabled = true;
    creationDate.value = "";
  }
  createdBy.value = parsed.createdBy || "";
  comment.value = parsed.comment || "";
  hash.value = parsed.infoHash;

  trackers.innerHTML = "";
  if (parsed.announce) {
    for (var url of parsed.announce) {
      let tracker = document.createElement('input');
      tracker.className = 'tracker';
      tracker.type = 'text';
      tracker.value = url;
      trackers.appendChild(tracker);
    }
  } else {
    trackers.innerHTML = "<em>No trackers specified in the URL/File provided</em>";
  }

  webseeds.innerHTML = "";
  if (parsed.urlList && parsed.urlList.length) {
    for (var url of parsed.urlList) {
      let webseed = document.createElement('input');
      webseed.className = 'tracker';
      webseed.type = 'text';
      webseed.value = url;
      webseeds.appendChild(webseed);
    }
  } else {
    webseeds.innerHTML = "<em>No webseed URLs in the URL/File provided</em>";
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

  copyMagnet.setAttribute('data-clipboard-text', parser.toMagnetURI(parsed));

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