import 'famous/core/famous.css'
import '../../styles/app.css'

import Surface from 'famous/core/Surface'
import Scrollview from 'famous/views/Scrollview'

import Plane from 'infamous/Plane'
import PushMenuLayout from 'infamous/PushMenuLayout'
import {contextWithPerspective} from 'infamous/utils'

import hljs from 'highlight.js'

var ctx = contextWithPerspective(1000)

/*
 * Make the things
 */
var content = new Plane({
    properties: {
        backfaceVisibility: 'visible',
        background: 'white',
        padding: '20px',
        overflow: 'auto'
    }
})

var menu = new Plane({
    content: 'To Menu, or not to menu. ;)',
    //size: [undefined, 60],

    // TODO: Use jss here.
    properties: {
        padding: '20px',
        background: 'white'
    }
})

//var menu2 = new Plane({
    //content: 'Very very soon. ;)',
    //size: [undefined, 60],

    //// TODO: Use jss here.
    //properties: {
        //padding: '20px',
        //background: 'white'
    //}
//})

//var menuScrollView = new Scrollview()

var layout = new PushMenuLayout({
    menuSide: 'left',
    menuWidth: 300,
    menuHintSize: 0,
    //animationType: 'moveBack',
    animationType: 'foldDown',

    //fadeStartColor: 'rgba(255,255,255,0.4)',
    //fadeEndColor: 'rgba(255,255,255,1)'

    fadeStartColor: 'rgba(30,30,30,0)',
    fadeEndColor: 'rgba(30,30,30,0.8)'
})

window.layout = layout

/*
 * Put them together.
 */
//menuScrollView.sequenceFrom([
    //menu.surface,
    //menu2.surface
//])

//menuScrollView.sequenceFrom([
    //new Surface({
        //content: 'Very very soon. ;)',
        //size: [undefined, 60],

        //// TODO: Use jss here.
        //properties: {
            //padding: '20px',
            //background: 'white'
        //}
    //})
    ////new Surface({
        ////content: 'Oh yes. ;)',
        ////size: [undefined, 60],

        ////// TODO: Use jss here.
        ////properties: {
            ////padding: '20px',
            ////background: 'white'
        ////}
    ////})
//])

layout.setContent(content)
layout.setMenu(menu)

// TODO: Fix/remove when infamous v0.1.0 PushMenuLayout.setMenu accepts vanilla famous renderables. {{
//menu.pipe(layout.touchSync)
//menu.on('mouseenter', function() {
    //if (!layout.isOpening) {
        //layout.openMenu();
    //}
//})
//menu.on('mouseleave', function() {
    //if (!layout.isClosing) {
        //layout.closeMenu();
    //}
//})
//menu2.pipe(layout.touchSync)
//menu2.on('mouseenter', function() {
    //if (!layout.isOpening) {
        //layout.openMenu();
    //}
//})
//menu2.on('mouseleave', function() {
    //if (!layout.isClosing) {
        //layout.closeMenu();
    //}
//})
// }}

content.setContent(document.getElementById('content').innerText)

ctx.add(layout)

/*
 * Do stuff when the things are ready.
 */
content.on('deploy', function() {
    var codes = document.querySelectorAll('pre code')

    Array.prototype.forEach.call(codes, function(el) {
        hljs.highlightBlock(el)
    })
})


console.log('dox:', dox)
