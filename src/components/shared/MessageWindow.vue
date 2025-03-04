<script lang='ts'>
export default {
  props: ['showMessage', 'title', 'text'],
  emits: ['closeMessage'],
}
</script>

<template>
  <v-dialog
    :model-value="showMessage"
    width="auto"
  >
    <v-card
      max-width="400"
      prepend-icon="mdi-update"
      :text="text"
      :title="title"
    >
      <template v-slot:actions>
        <v-btn
          class="ms-auto"
          text="Ok"
          @click="$emit('closeMessage')"
        ></v-btn>
      </template>
    </v-card>
  </v-dialog>
</template>

