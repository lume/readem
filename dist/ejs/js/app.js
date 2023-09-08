import 'famous/core/famous.css';
import '../../styles/app.css';
import 'famous/core/Surface';
import 'famous/views/Scrollview';
import Plane from 'lume/Plane';
import PushMenuLayout from 'lume/PushMenuLayout';
import { contextWithPerspective } from 'lume/utils';
import hljs from 'highlight.js';
var ctx = contextWithPerspective(1000);
var content = new Plane({
    properties: {
        backfaceVisibility: 'visible',
        background: 'white',
        padding: '20px',
        overflow: 'auto',
    },
});
var menu = new Plane({
    content: 'To Menu, or not to menu. ;)',
    properties: {
        padding: '20px',
        background: 'white',
    },
});
var layout = new PushMenuLayout({
    menuSide: 'left',
    menuWidth: 300,
    menuHintSize: 0,
    animationType: 'foldDown',
    fadeStartColor: 'rgba(30,30,30,0)',
    fadeEndColor: 'rgba(30,30,30,0.8)',
});
window.layout = layout;
layout.setContent(content);
layout.setMenu(menu);
content.setContent(document.getElementById('content').innerText);
ctx.add(layout);
content.on('deploy', function () {
    var codes = document.querySelectorAll('pre code');
    Array.prototype.forEach.call(codes, function (el) {
        hljs.highlightBlock(el);
    });
});
console.log('dox:', dox);
//# sourceMappingURL=app.js.map