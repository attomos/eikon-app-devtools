require('babel-polyfill');
require('./style.scss');

import $ from 'jquery';
window.$ = $;
window.jQuery = $;
require('../bower_components/AdminLTE/bootstrap/js/bootstrap.js');
require('../bower_components/AdminLTE/dist/js/app.js');
require('../bower_components/file-saver/FileSaver.js');

const socket = require('socket.io-client')('http://localhost:3000');

import route from './route';
import quotes from './quotes';
import feed from './feed';
import udf from './sections/udf';
import proxy from './proxy';

JET.init({ ID: 'a' });

route.init();
quotes.init(socket);
feed.init(socket);
udf.init(socket);
proxy.init(socket);

socket.on('context-change', (context) => {
  JET.contextChange(context);
});

socket.on('navigate', (obj) => {
  JET.navigate(obj);
});

socket.on('download', (filename, data) => {
  saveAs(new Blob([new Buffer(data, 'base64')], { type: 'application/octet-stream' }), filename);
});

$('#site').text(require('../modules/env'));
$('#feedback').click(() => {
  let to = 'pirasis.leelatanon@thomsonreuters.com';
  let subject = 'Feedback on Eikon App Devtools';
  window.location.href = `mailto:${to}?Subject=${subject}`;
});
