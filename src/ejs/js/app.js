import '../../styles/app.css'
import {useDefaultNames} from 'infamous/html'
import hljs from 'highlight.js'

useDefaultNames()

var codes = document.querySelectorAll('pre code')

Array.prototype.forEach.call(codes, function(el) {
    hljs.highlightBlock(el)
})

console.log('dox:', dox)
