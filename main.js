import 'lodash'
import Vue from 'vue'
import Vuetify from 'vuetify'
import App from './App.vue'
import httpVueLoader from 'http-vue-loader'
import VueSlider from 'vue-slider-component'
import Lingallery from './public/js/lingallery.umd.min.js'
import VueYoutube from 'vue-youtube'
 
import 'vuetify/dist/vuetify.min.css'
import 'vue-slider-component/theme/antd.css'

Vue.use(Vuetify)
Vue.use(httpVueLoader)
Vue.use(VueYoutube)

Vue.component('VueSlider', VueSlider)
Vue.component('lingallery', Lingallery)

Vue.config.productionTip = false

Vue.mixin({
    methods: { 
        load(url, callback) {
            let e
            const extension = url.split('.').pop()
            if (extension === 'js') {
                e = document.createElement('script')
                e.src = url
                e.type='text/javascript'
            } else {
                e = document.createElement('link')
                e.href = url
                e.rel='stylesheet'
            }
            if (e) {
                e.addEventListener('load', callback)
                document.getElementsByTagName('head')[0].appendChild(e)
            }
        },
        loadDependencies(dependencies, i, callback) {
            if (dependencies.length > 0) {
                this.load(dependencies[i], () => {
                    if (i < dependencies.length-1) {
                        this.loadDependencies(dependencies, i+1, callback) 
                    } else {
                        callback()
                    }
                })
            }
        },
        delimitedStringToObjArray(delimitedData, delimiter) {
            delimiter = delimiter || `\t`
            const objArray = []
            const lines = delimitedData.split('\n').filter(line => line.trim() !== '')
            if (lines.length > 1) {
                const keys = lines[0].split(delimiter).map(key => key.trim())
                lines.slice(1).forEach(line => {
                let obj = {}
                line.split(delimiter)
                .map(value => value.trim())
                .forEach((value, i) => {
                    let rawKey = keys[i].split('.')
                    let key = rawKey[0]
                    let prop = rawKey.length === 2 ? rawKey[1] : 'id'
                    if (!obj[key]) obj[key] = {}
                    if (value || prop === 'id') {
                    obj[key][prop] = value
                    }
                })      
                objArray.push(obj)
                })
                let assignedId = 0
                let labels = {}
                objArray.forEach(obj => {
                Object.values(obj).forEach(child => {
                    if (child.id === '' && child.label) {
                    if (!labels[child.label]) labels[child.label] = ++assignedId
                    child.id = labels[child.label]
                    }
                })
                })
            }
            return objArray
        },
        eqSet(as, bs) {
            if (as.size !== bs.size) return false
            for (var a of as) if (!bs.has(a)) return false
            return true
        }
    }
})

new Vue({
    render: h => h(App),
    vuetify: new Vuetify()
}).$mount('#app')