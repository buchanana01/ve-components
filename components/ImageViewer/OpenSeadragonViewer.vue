<template>
  <div class="main">
    <div id="top-overlay" class="overlay">
      <template v-if="currentItem.annotations">
        <img src="images/next_rest.png" style="float:right;" @click="viewNextAnnotation">
        <img src="images/previous_rest.png" style="float:right;" @click="viewPreviousAnnotation">
      </template>
      <div v-html="title" style="float:left;"></div>
    </div>
    <div id="osd" :style="containerStyle"></div>
    <div id="bottom-overlay" class="overlay" @click="copyTextToClipboard"></div>
  </div>
</template>

<script>
/* global OpenSeadragon, _ */

const dependencies = [
    // 'https://cdn.jsdelivr.net/npm/openseadragon@2.4.2/build/openseadragon/openseadragon.min.js',
    'https://cdn.jsdelivr.net/npm/openseadragon@2.4/build/openseadragon/openseadragon.min.js',
    'https://recogito.github.io/js/openseadragon-annotorious.min.js'
    // 'https://cdn.jsdelivr.net/npm/@recogito/annotorious-openseadragon@2.0.6/dist/openseadragon-annotorious.min.js'
]

module.exports = {
  name: 'OpenSeadragonViewer',
  props: {
    active: String,
    items: Array,
    width: Number,
    height: Number,
    defaultFit: {type: String, default: 'cover'},
    selected: String
  },
  data: () => ({
    viewer: undefined,
    annotorious: undefined,
    fit: 'cover',
    currentRegion: undefined,
    containerOrientation: 'portrait',
    imageOrientation: 'portrait',
    center: undefined,
    zoom: undefined,
    drag: false,
    annoCursor: 0,
    currentItem: undefined
  }),
  computed: {
    containerStyle() { return { position: 'relative', width: `${this.width}px`, height: `${this.height}px`, overflowY: 'auto !important' } },
    title() { return this.annoCursor > 0 
      ? this.currentItem.annotations[this.annoCursor - 1].text
      : this.currentItem.label || this.currentItem.title
    },
    target() { return this.currentItem.source }
  },
  created() {
      this.currentItem = this.items[0]
  },
  mounted() {
    console.log(this.$options.name, this.items, this.active, this.width, this.height, this.defaultFit, this.selected)
    this.loadDependencies(dependencies, 0, this.init)
  },
  methods: {
    init() {
      this.fit = (this.currentItem.fit || this.defaultFit) === 'cover' ? 'cover' : 'contain'
      console.log('OpenSeadragonImageViewer.init', this.width, this.height, this.containerOrientation, this.fit, this.items)
      this.containerOrientation = this.width > this.height ? 'landscape' : 'portrait'
      this.initViewer()
      this.initAnnos()
    },
    initViewer() {
      if (this.viewer) this.viewer.destroy()
      this.viewer = OpenSeadragon({
        id: 'osd',
        tileSources: this.currentItem['iiif-url'] + '/info.json',
        showNavigationControl: true,
        minZoomImageRatio: 0.2,
        maxZoomPixelRatio: 5,
        degrees: parseInt(this.currentItem.rotate || '0'),
        // animationTime: 100,
        homeFillsViewer: this.fit === 'cover',
        showFullPageControl: false
      })
      this.viewer.addHandler('open', () => {
        let customButton = new OpenSeadragon.Button({
          tooltip: 'Custom',
          srcRest: `/images/flip_rest.png`,
          srcGroup: `/images/flip_rest.png`,
          srcHover: `/images/flip_rest.png`,
          srcDown: `/images/flip_rest.png`,
          onClick: this.onCustomButtonClick
        })
        // this.viewer.addControl(customButton.element, { anchor: OpenSeadragon.ControlAnchor.TOP_LEFT })
        this.viewer.buttons.buttons.push(customButton)
        this.viewer.buttons.element.appendChild(customButton.element)
        console.log(this.viewer)

        this.currentRegion = this.currentItem.region ? this.parseRegionString(this.currentItem.region) : null
        if (this.currentRegion) this.positionImage()
        document.querySelector('#bottom-overlay').innerHTML = this.imageViewportCoords()
      })

      this.viewer.world.addHandler('add-item', () => {
        const size = this.viewer.world.getItemAt(0).getContentSize()
        this.imageOrientation = size.x > size.y ? 'landscape' : 'portrait'
        console.log(`width=${size.x} height=${size.y} imageOrientation=${this.imageOrientation}`)
      })

      this.viewer.addHandler('canvas-drag-end', () => { this.drag = true })
      this.viewer.addHandler('canvas-click', (e) => {
        e.preventDefaultAction = true
        if (this.drag) {
          this.drag = false
        } else {
          if (this.currentItem.manifest) {
            this.$store.dispatch('setSelectedImageID', this.currentItem.id)
            this.$modal.show('image-viewer-modal')
            this.positionImage()
          }
        }
      })
      this.viewer.addHandler('viewport-change', this.viewportChange)
      this.viewer.addHandler('home', () => { this.annoCursor = 0 })
    },
    initAnnos() {
      this.annotorious = OpenSeadragon.Annotorious(this.viewer, { readOnly: false })
      this.currentItem.annotations = []
      fetch(`https://annotations.visual-essays.app/ve/?target=${encodeURIComponent(this.currentItem.source)}`).then(resp => resp.json())
      .then(data => {
        if (data.first) {
          const annotations = data.first.items.map(anno => {
            this.annotorious.addAnnotation(anno)
            return {
              id: anno.id.split('/').pop(),
              region: anno.target.selector.value.split('=')[1],
              text: anno.body[0].value
            }
          })
          if (annotations.length > 0) {
            this.currentItem = { ...this.currentItem, ...{ annotations } }
          }
        }
        console.log(this.currentItem)
      })
      this.annotorious.on('createAnnotation', (anno) => {
        anno.seq = this.currentItem.annotations.length
        anno.target.id = this.currentItem.source
        fetch('https://annotations.visual-essays.app/ve/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/ld+json; profile="http://www.w3.org/ns/anno.jsonld"', 
            Accept: 'application/ld+json; profile="http://www.w3.org/ns/anno.jsonld"' },
            body: JSON.stringify(anno)
          }).then(resp => resp.json())
          .then(createdAnno => {
            console.log(createdAnno)
            this.currentItem.annotations.push({
              id: createdAnno.id.split('/').pop(),
              region: createdAnno.target.selector.value.split('=')[1],
              text: createdAnno.body[0].value
            })  
          })
      })
      this.annotorious.on('selectAnnotation', (anno) => {
        console.log('selectAnnotation', anno, anno.id.split('/').pop())
        document.querySelector('#bottom-overlay').innerHTML = anno.id.split('/').pop()
        // this.annotorious.fitBounds(anno)
      })
      this.annotorious.on('updateAnnotation', (anno) => {
        console.log('updateAnnotation', anno)
        const _id = anno.id.split('/').pop()
        console.log(`https://annotations.visual-essays.app/ve/${_id}`, JSON.stringify(anno, null, 2))
        fetch(`https://annotations.visual-essays.app/ve/${_id}`, { 
          method: 'PUT',
          headers: {
            'Content-Type': 'application/ld+json; profile="http://www.w3.org/ns/anno.jsonld"', 
            Accept: 'application/ld+json; profile="http://www.w3.org/ns/anno.jsonld"' },
            body: JSON.stringify(anno)
        })
      })
      this.annotorious.on('deleteAnnotation', (anno) => {
        console.log('deleteAnnotation', anno)
        const _id = anno.id.split('/').pop()
        fetch(`https://annotations.visual-essays.app/ve/${_id}`, { method: 'DELETE' })
      })
    },
    onCustomButtonClick(e) {
      console.log('onCustomButtonClick', e)
    },
    viewNextAnnotation() {
      this.annoCursor = this.annoCursor < this.currentItem.annotations.length ? this.annoCursor + 1 : 1
      this.gotoAnnotation(this.currentItem.annotations[this.annoCursor - 1])
    },
    viewPreviousAnnotation() {
      this.annoCursor = this.annoCursor > 1 ? this.annoCursor - 1 : this.currentItem.annotations.length
      this.gotoAnnotation(this.currentItem.annotations[this.annoCursor - 1])
    },
    parseRegionString(region) {
      const s1 = region.split(':')
      let ints = s1[s1.length-1].split(',').map(v => parseInt(v))
      if (ints.length === 4) {
        if (s1.length === 1 || (s1.length === 2 && (s1[0] === 'px' || s1[0] === 'pixel'))) {
          return this.viewer.viewport.imageToViewportRectangle(new OpenSeadragon.Rect(...ints))
        } else if (s1.length === 2 && (s1[0] === 'pct' || s1[0] === 'percent')) {
          const size = this.viewer.world.getItemAt(0).getContentSize()
          if (size.x > 0 && size.y > 0) {
            return this.viewer.viewport.imageToViewportRectangle(
              Math.round(size.x * ints[0]/100),
              Math.round(size.y * ints[1]/100),
              Math.round(size.x * ints[2]/100), 
              Math.round(size.y * ints[3]/100)
            )
          }
        }
      }
    },
    positionImage() {
      console.log(`positionImage: reqion=${this.currentRegion} fit=${this.fit} imageOrientation=${this.imageOrientation}`)
      if (this.currentRegion) {
        this.viewer.viewport.fitBounds(this.currentRegion, true)
      } else if (this.fit === 'cover') {
        if (this.imageOrientation === 'portrait') {
          this.viewer.viewport.fitHorizontally()
        } else {
          this.viewer.viewport.fitVertically()
        }
      } else {
        if (this.imageOrientation === 'portrait') {
          this.viewer.viewport.fitVertically()
        } else {
          this.viewer.viewport.fitHorizontally()
        }
      }
    },
    imageViewportCoords() {
      const viewportBounds = this.viewer.viewport.getBounds()
      const tiledImage = this.viewer.world.getItemAt(0)
      const imageBounds = tiledImage.viewportToImageRectangle(viewportBounds)
      return `${Math.ceil(imageBounds.x)},${Math.ceil(imageBounds.y)},${Math.ceil(imageBounds.width)},${Math.ceil(imageBounds.height)}`
    },
    viewportChange: _.debounce(function () {
      document.querySelector('#bottom-overlay').innerHTML = this.imageViewportCoords()
    }, 100),
    gotoAnnotation(anno) {
      this.annoCursor = this.currentItem.annotations.indexOf(anno) +1
      this.currentRegion = this.parseRegionString(anno.region)
      // this.viewer.viewport.panTo(this.currentRegion.getCenter(), true).zoomTo(2)
      // this.positionImage()
      console.log(this.currentRegion)
      this.viewer.viewport.zoomSpring.animationTime = 2
      /*
      this.viewer.viewport.zoomSpring.springStiffness = 1
      this.viewer.viewport.centerSpringX.animationTime = 50
      this.viewer.viewport.centerSpringX.springStiffness = 0
      this.viewer.viewport.centerSpringY.animationTime = 50
      this.viewer.viewport.centerSpringY.springStiffness = 0
      */
      this.viewer.viewport.fitBounds(this.currentRegion)
      this.viewer.viewport.zoomSpring.animationTime = 1.2
      // document.getElementById('top-overlay').innerHTML = anno.text
    },
    onClick(e) {
      e.stopPropagation()
      for (let i = 0; i < e.target.attributes.length; i++) {
        const attr = e.target.attributes.item(i)
        if (attr.name.indexOf('data-click-') === 0) {
          const action = attr.name.split('-')[2]
          const value = attr.value
          console.log(`onClick action=${action} value=${value}`)
          if (action === 'annotation') {
            const anno = this.currentItem.annotations.find(anno => anno.id === value)
            if (anno) this.gotoAnnotation(anno)
          }
        }
      }
    },
    addHandlers(elemId) {
      console.log('addHandlers')
      Array.from (document.querySelectorAll(`#${elemId} span`))
        .filter(elem => elem.dataset)
        .forEach(elem => {
          for (let i = 0; i < elem.attributes.length; i++) {
            const attr = elem.attributes.item(i)
            if (attr.name.indexOf('data-') === 0) {
              const event = attr.name.split('-')[1]
              if (event === 'click') elem.addEventListener(event, this.onClick)
            }
          }
        })
    },
    removeHandlers(elemId) {
      console.log('removeHandlers')
      Array.from (document.querySelectorAll(`#${elemId} span`))
        .filter(elem => elem.dataset)
        .forEach(elem => {
          for (let i = 0; i < elem.attributes.length; i++) {
            const attr = elem.attributes.item(i)
            if (attr.name.indexOf('data-') === 0) {
              const event = attr.name.split('-')[1]
              if (event === 'click') elem.removeEventListener(event, this.onClick)
            }
          }
        })
    },
    copyTextToClipboard(e) {
      if (navigator.clipboard) navigator.clipboard.writeText(e.target.textContent)
    }
  },
  watch: {
    height: {
      handler: function () {
        this.positionImage()
      },
      immediate: false
    },
    active: {
      handler: function (current, prior) {
        console.log(`${this.$options.name} active=${this.active}`)
        if (prior) this.removeHandlers(prior)
        this.addHandlers(current)
      },
      immediate: true
    },
    selected: {
      handler: function (current, prior) {
        console.log(`${this.$options.name} selected=${current}`)
        if (prior && current === 'imageViewer') {
          this.positionImage()
        }
      },
      immediate: false
    },
    items: {
      handler: function (current, prior) {
        console.log('OpenSeadragonImageViewer.items', current, prior)
        if (!prior || prior[0]['iiif-url'] !== current[0]['iiif-url']) this.init()
        // if (JSON.stringify(current) !== JSON.stringify(prior)) this.init()
      },
      immediate: false
    }
  }
}
</script>

<style>

#top-overlay {
  width: 300px;
  height: 100px;
  padding: 6px;
  margin-top: 32px;
  font-size: 1.1em;
}
#bottom-overlay {
  bottom: 0;
  right: 0;
  width: 150px;
  height: 24px;
  color: white;
  font-size: 10pt;
  padding: 2px;
  text-align: center;
  background-color: rgba(0, 0, 0, 0.5);
  cursor: pointer;
}

.main .overlay {
  background-color: rgba(255, 255, 255, 0.7);
  visibility: hidden;
  opacity: 0;
  transition: all 1s ease-out;
  position: absolute;
  z-index: 2;
}

.main:hover .overlay {
  visibility: visible;
  opacity: 1;
  transition: all 1s ease-in;
}

.a9s-annotationlayer {
  visibility: hidden;
  opacity: 0;
  transition: all 1s ease-out;
}
.main:hover .a9s-annotationlayer {
  visibility: visible;
  opacity: 1;
  transition: all 1s ease-in;
}

.linked-anno {
  border-bottom: 2px solid #A9AC00;
  cursor: pointer;
  z-index: 10;
}

.linked-anno:hover {
  background: #EBECBB !important;
}

</style>