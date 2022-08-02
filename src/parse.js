require('buffer');
const clipboard = require('clipboard');
const parser = require('parse-torrent');
const bytes = require('bytes');
const mime = require('mime-types');
const WebTorrent = require('webtorrent');
const tippy = require('tippy.js').default;

var examples = document.getElementById('examples');
var example1 = document.getElementById('example1');
var example2 = document.getElementById('example2');
var example3 = document.getElementById('example3');
var properties = document.getElementById('properties');
var originalSourceIcon = document.getElementById('originalSourceIcon');
var source;
var sourceTooltip = tippy(originalSourceIcon, {"theme": "torrent-parts", "animation": "shift-away-subtle"});
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
var pieces = document.getElementById('pieces');
var files = document.getElementById('filesBody');
var getFiles = document.getElementById('getFiles');
var copyURL = document.getElementById('copyURL');
var copyMagnet = document.getElementById('copyMagnet');
var downloadTorrentWrapper = document.getElementById('downloadTorrentWrapper');
var downloadTorrent = document.getElementById('downloadTorrent');
var copyURLTooltip = tippy(copyURL, {"theme": "torrent-parts", "animation": "shift-away-subtle", "content": "Copy torrent.parts link to clipboard"});
var copyMagnetTooltip = tippy(copyMagnet, {"theme": "torrent-parts", "animation": "shift-away-subtle", "content": "Copy Magnet link to clipboard"});
var downloadTorrentTooltip = tippy(downloadTorrentWrapper, {"theme": "torrent-parts", "animation": "shift-away-subtle", "content": "Download Torrent file"});
var parsed;
var client = new WebTorrent();
var notyf = new Notyf({
  "duration": 8000,
  "dismissible": true,
  "ripple": false,
  "position": {
    "x": "right",
    "y": "top",
  },
  "types": [
    {
      "type": "success",
      "background": "#46835C",
      "icon": false
    },
    {
      "type": "error",
      "background": "#A60A0A",
      "icon": false
    }
  ]
});

function placeDownloadTooltips(e) {
  if (window.innerWidth > 1080) {
    copyURLTooltip.setProps({"placement": "right"});
    copyMagnetTooltip.setProps({"placement": "right"});
    downloadTorrentTooltip.setProps({"placement": "right"});
  } else {
    copyURLTooltip.setProps({"placement": "top"});
    copyMagnetTooltip.setProps({"placement": "top"});
    downloadTorrentTooltip.setProps({"placement": "top"});
  }
}

window.addEventListener('resize', placeDownloadTooltips);
placeDownloadTooltips();

document.addEventListener('DOMContentLoaded', start);

function start() {

  // magnet input
  document.getElementById('magnet').addEventListener('keyup', function(event) {
    event.preventDefault();
    if (event.key === 'Enter') {
      source = 'magnet';
      originalSourceIcon.innerHTML = '<span class="fad fa-magnet fa-fw"></span>';
      sourceTooltip.setContent('Currently loaded information sourced from Magnet URL');
      parse(magnet.value);
    }
  });

  // torrent select button
  document.getElementById('torrent').addEventListener('change', function(event) {
    event.preventDefault();
    event.target.files[0].arrayBuffer().then(function(arrayBuffer) {
      source = 'torrent-file';
      originalSourceIcon.innerHTML = '<span class="fad fa-file-alt fa-fw"></span>';
      sourceTooltip.setContent('Currently loaded information sourced from Torrent file');
      parse(Buffer.from(arrayBuffer));
    });
  });

  // body drag-and-drop torrent file support
  document.addEventListener('dragover', function(event) {
    event.preventDefault();
  });

  document.addEventListener('drop', function(event) {
    event.preventDefault();
    event.dataTransfer.items[0].getAsFile().arrayBuffer().then(function(arrayBuffer) {
      source = 'torrent-file';
      originalSourceIcon.innerHTML = '<span class="fad fa-file-alt fa-fw"></span>';
      sourceTooltip.setContent('Currently loaded information sourced from Torrent file');
      parse(Buffer.from(arrayBuffer));
    });
  });

  // example buttons
  example1.addEventListener('click', function(event) {
    event.preventDefault();
    notyf.success('Parsing Ubuntu 22.04 Magnet URL');
    source = 'magnet';
    originalSourceIcon.innerHTML = '<span class="fad fa-magnet fa-fw"></span>';
    sourceTooltip.setContent('Currently loaded information sourced from Magnet URL');
    parse('magnet:?xt=urn:btih:2c6b6858d61da9543d4231a71db4b1c9264b0685&dn=ubuntu-22.04-desktop-amd64.iso&tr=https%3A%2F%2Ftorrent.ubuntu.com%2Fannounce&tr=https%3A%2F%2Fipv6.torrent.ubuntu.com%2Fannounce');
  });

  example2.addEventListener('click', async function(event) {
    event.preventDefault();
    notyf.success('Fetching and Parsing &ldquo;The WIRED CD&rdquo; Torrent File...');
    source = 'remote-torrent-file';
    originalSourceIcon.innerHTML = '<span class="fad fa-file-alt fa-fw"></span>';
    sourceTooltip.setContent('Currently loaded information sourced from remotely fetched Torrent file');
    parseRemote('https://webtorrent.io/torrents/wired-cd.torrent');
  });

  example3.addEventListener('click', async function(event) {
    event.preventDefault();
    notyf.success('Parsing Jack Johnson Archive.org Torrent File');
    let response = await fetch('/ext/jj2008-06-14.mk4_archive.torrent');
    let arrayBuffer = await response.arrayBuffer();
    source = 'torrent-file';
    originalSourceIcon.innerHTML = '<span class="fad fa-file-alt fa-fw"></span>';
    sourceTooltip.setContent('Currently loaded information sourced from Torrent file');
    parse(Buffer.from(arrayBuffer));
  });

  // share buttons
  let copyurl = new clipboard('#copyURL');
  copyurl.on('success', function(e) {
    notyf.success('Copied site URL to clipboard!');
    console.info(e);
  });
  copyurl.on('failure', function(e) {
    notyf.error('Problem copying to clipboard');
    console.warn(e);
  });

  let copymagnet = new clipboard('#copyMagnet');
  copymagnet.on('success', function(e) {
    notyf.success('Copied Magnet URL to clipboard!');
  });
  copymagnet.on('failure', function(e) {
    notyf.error('Problem copying to clipboard');
    console.warn(e);
  });

  // details field listeners
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
  getFiles.addEventListener('click', getFilesFromPeers);

  tippy('[data-tippy-content]', {"theme": "torrent-parts", "animation": "shift-away-subtle"}); // all element-defined tooltips
  sourceTooltip.disable();

  if (window.location.hash) {
    source = 'shared-url';
    originalSourceIcon.innerHTML = '<span class="fad fa-link fa-fw"></span>';
    sourceTooltip.setContent('Currently loaded information sourced from shared torrent.parts link');
    parse(window.location.hash.split('#')[1]);
  }

}

function parse(toLoad) {
  resetProperties();
  try {
    console.info('Attempting parse');
    parsed = parser(toLoad);
    display();
    if (parsed.xs) {
      console.info('Magnet includes xs, attempting remote parse');
      parseRemote(parsed.xs);
    }
  }
  catch(e) { // maybe they put a URL to a torrent file in the magnet box?
    console.warn(e);
    if (source == 'magnet') {
      console.info('Attempting remote parse');
      parseRemote(toLoad);
    } else { // probably not. Just a bad file.
      notyf.error('Problem parsing input. Is this a .torrent file?');
      console.error('Problem parsing input');
    }
  }
}

function parseRemote(toLoad) {
  parser.remote(toLoad, function(err, result) {
    if (err) {
      notyf.error('Problem remotely fetching that file or parsing result');
      console.warn(err);
      resetProperties();
      return;
    }
    source = 'remote-torrent-file';
    originalSourceIcon.innerHTML = '<span class="fad fa-file-alt fa-fw"></span>';
    sourceTooltip.setContent('Currently loaded information sourced from remotely fetched Torrent file');
    parsed = result;
    display();
  });
}

function display() {

  console.log(parsed);

  hash.value = parsed.infoHash;
  name.value = parsed.name ? parsed.name : '';
  if (parsed.created) {
    created.value = parsed.created.toISOString().slice(0, 19);
    created.type = 'datetime-local';
  } else {
    created.type = 'text';
  }
  createdBy.value = parsed.createdBy ? ' by ' + parsed.createdBy : '';
  comment.value = parsed.comment ? parsed.comment : '';
  pieces.value = parsed.pieces ? parsed.pieces.length.toLocaleString() + ' ' + bytes.format(parsed.pieceLength, {"decimalPlaces": 1, "unitSeparator": " "}) + ' pieces (last piece ' + bytes.format(parsed.lastPieceLength, {"decimalPlaces": 1, "unitSeparator": " "}) + ')' : '';

  announce.innerHTML = '';
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
      tracker.setAttribute('aria-label', 'Tracker URL #' + i);
      tracker.addEventListener('input', propertyChange);
      row.appendChild(tracker);
      let remove = document.createElement('a');
      remove.className = 'remove';
      remove.dataset.index = i;
      remove.innerHTML = '<span class="far fa-trash"></span>';
      remove.addEventListener('click', removeRow);
      row.appendChild(remove);
      announce.appendChild(row);
    }
  // } else {
  //   announce.innerHTML = '<em>No trackers specified in the URL/File provided</em>';
  }

  urlList.innerHTML = '';
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
      webseed.setAttribute('aria-label', 'Webseed URL #' + i);
      webseed.addEventListener('input', propertyChange);
      row.appendChild(webseed);
      let remove = document.createElement('a');
      remove.className = 'remove';
      remove.dataset.index = i;
      remove.innerHTML = '<span class="far fa-trash"></span>';
      remove.addEventListener('click', removeRow);
      row.appendChild(remove);
      urlList.appendChild(row);
    }
  // } else {
  //   urlList.innerHTML = '<em>No webseed URLs in the URL/File provided</em>';
  }

  files.innerHTML = '';
  if (parsed.files && parsed.files.length) {
    getFiles.style.display = 'none';
    if (parsed.files.length < 100) {
      for (let file of parsed.files) {
        let icon = getFontAwesomeIconForMimetype(mime.lookup(file.name));
        files.appendChild(createFileRow(icon, file.name, file.length));
      }
    } else {
      for (let i = 0; i < 100; i++) {
        let icon = getFontAwesomeIconForMimetype(mime.lookup(parsed.files[i].name));
        files.appendChild(createFileRow(icon, parsed.files[i].name, parsed.files[i].length));
      }
      files.appendChild(createFileRow('', '...and another ' + (parsed.files.length - 100) + ' more files', ''));
    }
    files.appendChild(createFileRow('folder-tree', '', parsed.length));
    downloadTorrentTooltip.setContent('Download Torrent file');
    downloadTorrent.addEventListener('click', saveTorrent);
    downloadTorrent.disabled = false;
  } else {
    if (client.torrents.length > 0) {
      getFiles.style.display = 'none';
      files.innerHTML = '<input type="text" placeholder="Attempting fetching of files from Webtorrent..." aria-label="Attempting fetching of files from Webtorrent..." disabled>';
    } else {
      getFiles.style.display = 'block';
      files.innerHTML = '<input type="text" placeholder="Not included in the URL/File provided" aria-label="Files information not included in the URL/File provided" disabled>';
    }
    downloadTorrentTooltip.setContent('Files metadata is required to generate a Torrent file. Try fetching files list from WebTorrent.');
    downloadTorrent.removeEventListener('click', saveTorrent);
    downloadTorrent.disabled = true;
  }

  copyURL.setAttribute('data-clipboard-text', window.location.origin + '#' + parser.toMagnetURI(parsed));
  copyMagnet.setAttribute('data-clipboard-text', parser.toMagnetURI(parsed));

  examples.style.display = 'none';
  properties.style.display = 'flex';

  window.location.hash = parser.toMagnetURI(parsed);

  if (parsed.name) {
    document.title = 'Torrent Parts | ' + parsed.name;
  } else {
    document.title = 'Torrent Parts | Inspect and edit what\'s in your Torrent file or Magnet link';
  }

  sourceTooltip.enable();

}

function createFileRow(icon, name, size) {
  let row = document.createElement('tr');
  let iconcell = document.createElement('td');
  if (icon) iconcell.innerHTML = '<span class="far fa-' + icon + '"></span>';
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
    case mimetype.includes('msword'):
    case mimetype.includes('wordprocessingml'):
    case mimetype.includes('opendocument.text'):
    case mimetype.includes('abiword'):
      return 'file-word';
    case mimetype.includes('ms-excel'):
    case mimetype.includes('spreadsheet'):
      return 'file-powerpoint';
    case mimetype.includes('powerpoint'):
    case mimetype.includes('presentation'):
        return 'file-powerpoint';
    case mimetype.includes('7z-'):
    case mimetype.includes('iso9660'):
    case mimetype.includes('zip'):
    case mimetype.includes('octet-stream'):
      return 'file-archive';
    case mimetype.includes('csv'):
      return 'file-csv';
    case mimetype.includes('pdf'):
      return 'file-pdf';
    case mimetype.includes('font'):
      return 'file-contract';
    case mimetype.includes('text'):
    case mimetype.includes('subrip'):
    case mimetype.includes('vtt'):
      return 'file-alt';
    case mimetype.includes('audio'):
      return 'file-audio';
    case mimetype.includes('image'):
      return 'file-image';
    case mimetype.includes('video'):
      return 'file-video';
    default:
      return 'file';
  }
}

function propertyChange(e) {
  if (this.dataset.group) {
    parsed[this.dataset.group][this.dataset.index] = this.value ? this.value : '';
  } else {
    parsed[this.id] = this.value ? this.value : '';
  }
  window.location.hash = parser.toMagnetURI(parsed);
  updateModified();
}

function resetProperties() {
  document.getElementById('magnet').value = '';
  document.getElementById('torrent').value = '';
  examples.style.display = 'flex';
  properties.style.display = 'none';
  name.value = '';
  created.value = '';
  createdBy.value = '';
  comment.value = '';
  hash.value = '';
  announce.innerHTML = '';
  urlList.innerHTML = '';
  client.torrents.forEach(torrent => torrent.destroy());
  getFiles.style.display = 'block';
  files.innerHTML = '';
  window.location.hash = '';
  copyURL.setAttribute('data-clipboard-text', '');
  copyMagnet.setAttribute('data-clipboard-text', '');
  document.title = 'Torrent Parts | Inspect and edit what\'s in your Torrent file or Magnet link';
  sourceTooltip.disable();
}

async function addCurrentTrackers() {
  addTrackers.className = 'disabled';
  addTrackers.innerHTML = 'Adding...';
  try {
    let response = await fetch('https://newtrackon.com/api/stable'); // get trackers with 95% uptime
    let trackers = await response.text();
    parsed.announce = parsed.announce.concat(trackers.split('\n\n'));
    parsed.announce.push('http://bt1.archive.org:6969/announce');
    parsed.announce.push('http://bt2.archive.org:6969/announce');
    parsed.announce = parsed.announce.filter((v,i) => v && parsed.announce.indexOf(v) === i); // remove duplicates and empties
    notyf.success('Added known working trackers from newTrackon');
    updateModified();
  }
  catch(e) {
    notyf.error('Problem fetching trackers from newTrackon');
    console.warn(e);
  }
  addTrackers.className = '';
  addTrackers.innerHTML = 'Add Known Working Trackers';
  display();
}

function addRow() {
  parsed[this.dataset.type].unshift('');
  display();
}

function removeRow() {
  parsed[this.parentElement.className].splice(this.parentElement.dataset.index, 1);
  display();
}

function removeAllRows(type) {
  parsed[type] = [];
  updateModified();
  display();
}

function updateModified() {
  parsed.created = new Date();
  parsed.createdBy = 'Torrent Parts <https://torrent.parts/>';
  if (parsed.created) {
    created.value = parsed.created.toISOString().slice(0, 19);
    created.type = 'datetime-local';
  } else {
    created.type = 'text';
  }
  createdBy.value = parsed.createdBy ? ' by ' + parsed.createdBy : '';
}

function getFilesFromPeers() {
  console.info('Attempting fetching files from Webtorrent...');
  getFiles.style.display = 'none';
  parsed.announce.push('wss://tracker.webtorrent.io');
  parsed.announce.push('wss://tracker.openwebtorrent.com');
  parsed.announce.push('wss://tracker.btorrent.xyz');
  parsed.announce.push('wss://tracker.fastcast.nz');
  parsed.announce = parsed.announce.filter((v,i) => v && parsed.announce.indexOf(v) === i); // remove duplicates and empties
  client.add(parser.toMagnetURI(parsed), (torrent) => {
    parsed.info = Object.assign({}, torrent.info); // clone object
    parsed.files = torrent.files;
    parsed.infoBuffer = torrent.infoBuffer;
    parsed.length = torrent.length;
    parsed.lastPieceLength = torrent.lastPieceLength;
    updateModified();
    display();
    notyf.success('Fetched file details from Webtorrent peers');
    torrent.destroy();
  });
  display();
}

// https://stackoverflow.com/a/36899900/2700296
function saveTorrent() {
  let data = parser.toTorrentFile(parsed);
  if (data !== null && navigator.msSaveBlob)
    return navigator.msSaveBlob(new Blob([data], { "type": "application/x-bittorrent" }), parsed.name + '.torrent');
  let a = document.createElement('a');
  a.style.display = 'none';
  let url = window.URL.createObjectURL(new Blob([data], { "type": "application/x-bittorrent" }));
  a.setAttribute('href', url);
  a.setAttribute('download', parsed.name + '.torrent');
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  a.remove();
}