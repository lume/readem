import 'famous/core/famous.css'

import Plane from 'infamous/Plane'
import {contextWithPerspective} from 'infamous/utils'

var ctx = contextWithPerspective(1000)
var square = new Plane({
    size: [200,200],
    content: JSON.stringify(window.dox),
    properties: {
        backfaceVisibility: 'visible',
        background: 'pink',
        padding: '5px'
    }
})

ctx.add(square)
square.transform.setRotate([0,2*Math.PI,0], {duration: 5000, curve: 'easeInOut'})
