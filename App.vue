<template>
    <v-app>
        <div id="menu" ref="menu">
            <ul>
                <li v-for="(item, componentName) in configs" :key="componentName" @click="component=componentName">{{componentName}}</li>
            </ul>
        </div>
        <div id="app" :style="containerStyle">
            <component v-bind:is="component" :items="configs[component]" :width="width" :height="height" />
        </div>
    </v-app>
</template>

<script>
  /* global _ */
  import D3Network from './components/D3Network.vue'
  import D3PlusNetwork from './components/D3PlusNetwork.vue'
  import D3PlusRingNetwork from './components/D3PlusRingNetwork.vue'
  import IIIFSideBySide from './components/IIIFSideBySide.vue'
  import VisNetwork from './components/VisNetwork.vue'
  import StoriiiesViewer from './components/StoriiiesViewer.vue'
  import LeafletMap from './components/LeafletMap.vue'
  import ImageViewer from './components/ImageViewer/index.vue'
  import OpenSeadragonViewer from './components/ImageViewer/OpenSeadragonViewer.vue'
  import MiradorViewer from './components/ImageViewer/MiradorViewer.vue'
  import StaticImageViewer from './components/ImageViewer/StaticImageViewer.vue'
  import VideoPlayer from './components/VideoPlayer.vue'
  import PlantSpecimenViewer from './components/PlantSpecimenViewer.vue'

  const configs = {
    IIIFSideBySide: [{ 
        id: 'item-0',
        url1: 'https://iiif.visual-essays.app/images/88b53551f91eaeea450ff6c196b4fd5f9fd6955b356d616543af591f/info.json',
        url2: 'https://iiif.visual-essays.app/images/a58d7d72db0b59290c54d57e414d88d892efee1b88cc639ee0f6dc3f/info.json'
    }],
    D3Network: [{ id: 'item-0', url: 'data/miserables-1.json' }],
    D3PlusNetwork: [{ id: 'item-0', url: 'data/medici.tsv' }],
    D3PlusRingNetwork: [{ id: 'item-0', url: 'data/medici.tsv' }],
    // VisNetwork: [{ id: 'item-0', file: 'data/medici.tsv', layout: 'network', arrows: 'to'  }],
    VisNetwork: [{ id: 'item-0', file: 'https://raw.githubusercontent.com/JSTOR-Labs/plant-humanities/master/graphs/watermelon.csv', layout: 'network', arrows: 'to'  }],
    StoriiiesViewer: [{ id: '3f1du' }],
    VideoPlayer: [{ id: 'EvUK6ANy5II' }],
    LeafletMap: [{ 
        id: 'map-0',
        // center: [38.88, -77.03],
        center: [0, 50],
        zoom: 2,
        'hide-labels': 'true',
        'time-selector': '0:2020',
        layers: [
            // { id: 'map-layer-1', type: 'mapwarper', 'mapwarper-id': '37798', title: 'Cherry festival map', active: true },
            // { id: 'map-layer-2', type: 'geojson', url: 'https://data.whosonfirst.org/859/317/79/85931779.geojson' , title: 'Washington DC', active: true },
            { id: 'map-layer-3', type: 'geojson', url: 'data/cities.json' , 'date-field': 'inception', title: 'Cities', active: true },
       ]
    }],
    ImageViewer: [{ 
        id: 'item-0',
        static: 'true',
        url: 'https://iiif.visual-essays.app/images/2fbba2fdf4e34c1e6b4441db6a7addc7c511059b175cff68eaee0e6d/full/,1000/0/default.png',
        'iiif-url': 'https://iiif.visual-essays.app/images/2fbba2fdf4e34c1e6b4441db6a7addc7c511059b175cff68eaee0e6d'}],
    OpenSeadragonViewer: [{ id: 'item-0', 'iiif-url': 'https://iiif.visual-essays.app/images/44605f0600bc7a3c264abf650f3c7eb785fffec8b3eb10cf30d37a39' }],
    MiradorViewer: [{ id: 'item-0', manifest: 'https://iiif.visual-essays.app/presentation/0c5b8a7a5ac54eb61cf94c3ade84b6016ef432ccbff9987012d3432e/manifest' }],
    StaticImageViewer: [
        { id: 'item-0', url: 'https://upload.wikimedia.org/wikipedia/commons/0/02/Ann_Arbor_Art_Fair%2C_2019.jpg', title: 'Ann Arbor Art Fair' },
        { id: 'item-1', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Michigan_Theater%2C_Ann_Arbor_2020-05-05.jpg/1024px-Michigan_Theater%2C_Ann_Arbor_2020-05-05.jpg' }
    ],
    PlantSpecimenViewer: [{ id: 'item-0', eid: 'Q165321', max: 1 }]
}

  const component = window.location.search.split('component=').pop() || 'D3PlusNetwork'

  export default {
    name: 'App',
    components: {
      D3Network,
      D3PlusNetwork,
      D3PlusRingNetwork,
      IIIFSideBySide,
      VisNetwork,
      StoriiiesViewer,
      LeafletMap,
      ImageViewer,
      OpenSeadragonViewer,
      MiradorViewer,
      StaticImageViewer,
      VideoPlayer,
      PlantSpecimenViewer
    },
    data: () => ({
      component,
      configs,
      height: 0,
      width: 0
    }),
    computed: {
        containerStyle() { return { width: `${this.width}px`, height: `${this.height}px` } }
    },
    created() {
    },
    mounted() {
        this.height = Math.ceil(Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0) * 0.8) - this.$refs.menu.clientHeight
        this.width = Math.ceil(Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0) * 0.8)
        window.addEventListener('resize', this.windowResize)
    },
    methods: {
        windowResize: _.debounce(function (e) {
            this.height = Math.ceil(e.target.innerHeight * 0.8) - this.$refs.menu.clientHeight
            this.width = Math.ceil(e.target.innerWidth * 0.8)
        }, 100)
    },
    watch: {
        height: {
            handler: function () {
                console.log(`window.resize width=${this.width} height=${this.height}`)
            },
            immediate: true
        }
    }
  }
</script>

<style scoped>

    #app {
        border: 1px solid black;
    }

    #menu ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }
    #menu li {
        cursor: pointer;
    }

</style>
