<script lang='ts'>
export default {
  data() {
    return {
      drawer: false,
      group: null,
      items: [
        {
          title: 'Foo',
          value: 'foo',
        },
        {
          title: 'Bar',
          value: 'bar',
        },
        {
          title: 'Fizz',
          value: 'fizz',
        },
        {
          title: 'Buzz',
          value: 'buzz',
        },
      ],
    }
  },

  watch: {
    group () {
      this.drawer = false
    },
  },
}
</script>
<template>
  <div class="wrapper-panel">
  </div>
</template>

<style scoped>
.wrapper-panel {
  height: calc(100vh - 64px);
  /* width: 400px; */
  background-color: red;
}
</style>
