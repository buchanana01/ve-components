<template>
    <div id="datavis" :style="containerStyle"></div>
</template>

<script>

/* global d3plus */

// Uses https://d3plus.org/

const dependencies = [
    'https://fonts.googleapis.com/css?family=Roboto',
    'https://d3plus.org/css/styles.css?v=3',
    'https://d3plus.org/js/d3.min.js',
    'https://d3plus.org/js/d3plus.min.js',
    'https://d3plus.org/js/d3plus-network.v0.6.full.min.js'
]

module.exports = {
    name: 'D3PlusRingNetwork',
    props: {
      items: Array,
      width: Number,
      height: Number
    },
    computed: {
      containerStyle() { return { width: `${this.width}px`, height: `${this.height}px`, overflowY: 'auto !important', marginLeft: '24px' } },
    },
    mounted() {
        console.log(this.$options.name, this.items)
        if (typeof d3plus === 'object') {
            this.init()
        } else {
            this.loadDependencies(dependencies, 0, this.init)
        }
    },
    methods: {
        init() {
            fetch(this.items[0].url).then(resp => resp.text())
            .then(delimitedDataString => {
                let links = this.delimitedStringToObjArray(delimitedDataString)
                    .map(item => { return { source: item.source.label, target: item.target.label } })
                new d3plus.Rings() // eslint-disable-line no-undef
                    .select('#datavis')
                    .links(links)
                    .label(d => d.id)
                    .center("Anna Maria Luisa de' Medici")
                    .render()
            })
        }
    }
  }
</script>