const parser = require('parse-torrent');
const Buffer = require('Buffer');
const size = require('filesize');

var name = document.getElementById('name');
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
  console.info(toLoad);
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
  name.value = parsed.name;
}