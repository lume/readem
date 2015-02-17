require('famous/core/famous.css')
require('highlight.js/styles/solarized_light.css')

var Plane                  = require('infamous/Plane').default
var PushMenuLayout         = require('infamous/PushMenuLayout').default
var contextWithPerspective = require('infamous/utils').contextWithPerspective

var hljs = require('highlight.js')

// TODO, use jss.
document.body.style.background = 'white'
document.body.style.padding = '0'
document.body.style.margin = '0'
document.body.style.fontFamily = 'sans-serif'

var ctx = contextWithPerspective(1001)

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

function escapeHTML(html) {
    var el = document.createElement('textarea')
    el.innerHTML = html
    return el.innerHTML
}

function unescapeHTML(html) {
    var el = document.createElement('textarea')
    el.innerHTML = html
    return el.value
}

content.setContent(document.getElementById('content').innerText)
setTimeout(function() {

    var pres = document.querySelectorAll('code')
    console.log(pres)

    Array.prototype.forEach.call(pres, function(el) {
        console.log(el)
        //hljs.highlightBlock(el)
    })
}, 2000)
