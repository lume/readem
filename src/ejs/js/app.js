import 'famous/core/famous.css'

import Plane from 'infamous/Plane'
import PushMenuLayout from 'infamous/PushMenuLayout'
import {contextWithPerspective} from 'infamous/utils'

// TODO, use jss.
document.body.style.background = '#222'
document.body.style.padding = '0'
document.body.style.margin = '0'

var ctx = contextWithPerspective(1000)
var square = new Plane({
    content: JSON.stringify(window.dox),
    properties: {
        backfaceVisibility: 'visible',
        background: 'pink',
        padding: '5px',
        overflow: 'scroll'
    }
})

var layout = new PushMenuLayout()

layout.setContent(square)
layout.setMenu(new Plane({
    content: 'Hello menu!',
    properties: {
        padding: '10px',
        background: '#444',
        color: '#71BF52'
    }
}))

ctx.add(layout)
