import 'famous/core/famous.css'
import '../../styles/default.css'

import Plane from 'infamous/Plane'
import PushMenuLayout from 'infamous/PushMenuLayout'
import {contextWithPerspective} from 'infamous/utils'

import hljs from 'highlight.js'

// TODO, use jss.
document.body.style.background = 'white'
document.body.style.padding = '0'
document.body.style.margin = '0'
document.body.style.fontFamily = 'sans-serif'

var ctx = contextWithPerspective(1000)

var content = new Plane({
    properties: {
        backfaceVisibility: 'visible',
        background: 'white',
        padding: '20px',
        overflow: 'auto'
    }
})

var menu = new Plane({
    content: 'Hello menu!',
    properties: {
        padding: '20px',
        background: 'white'
    }
})

var layout = new PushMenuLayout({
    menuSide: 'left',
    menuWidth: 300,
    menuHintSize: 0,
    animationType: 'foldDown',
    fadeStartColor: 'rgba(255,255,255,0)',
    fadeEndColor: 'rgba(255,255,255,0.8)'
})

layout.setContent(content)
layout.setMenu(menu)

ctx.add(layout)

content.on('deploy', function() {
    var codes = document.querySelectorAll('code')

    Array.prototype.forEach.call(codes, function(el) {
        hljs.highlightBlock(el)
    })
});

content.setContent(document.getElementById('content').innerText)
