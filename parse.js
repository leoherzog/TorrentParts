const parser = require('parse-torrent');
const Buffer = require('Buffer');
const bytes = require('bytes');
const mime = require('mime-types');

var name = document.getElementById('name');
var creationDate = document.getElementById('creationDate');
var createdBy = document.getElementById('createdBy');
var comment = document.getElementById('comment');
var hash = document.getElementById('hash');
var files = document.getElementById('filesBody');
var size = document.getElementById('torrentSize');
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

}

function parse(toLoad) {
  if (typeof toLoad === "string" && toLoad.toLowerCase().trim().startsWith("http")) {
    parser.remote(toLoad, handleRemote);
  } else {
    parsed = parser(toLoad);
    display();
  }
}

function handleRemote(err, result) {
  parsed = result;
  display();
}

function display() {

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

  size.innerText = bytes.format(parsed.length, {"decimalPlaces": 1, "unitSeparator": " "});
  files.innerHTML = "";
  for (let file of parsed.files) {
    let row = document.createElement('tr');
    let iconcell = document.createElement('td');
    iconcell.innerHTML = '<span class="far fa-' + getFontAwesomeIconForMimetype(mime.lookup(file.name)) + '"></span>';
    row.appendChild(iconcell);
    let namecell = document.createElement('td');
    namecell.innerHTML = file.path;
    row.appendChild(namecell);
    let sizecell = document.createElement('td');
    sizecell.innerHTML = bytes.format(file.length, {"unitSeparator": " "});
    row.appendChild(sizecell);
    files.appendChild(row);
  }

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