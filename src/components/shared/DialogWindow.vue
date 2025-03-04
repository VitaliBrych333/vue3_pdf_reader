<script lang="ts">
export default {
  props: ['modelValue', 'title', 'name', 'text', 'actionNameOk', 'close'],

  emits: ['cancel', 'ok'],

  data() {
    return {
      docName: this.name ?? '',
      docText: this.text ?? '',
    }
  },
}
</script>

<template>
  <v-dialog :model-value="modelValue" persistent>
    <v-card class="mx-auto pa-12 pb-8" elevation="8" width="500" rounded="lg" :title="title">
      <div class="text-subtitle-1 text-medium-emphasis">Name Document</div>
      <!-- v-model.trim="docName" -->
      <!-- :model-value="docName" -->
      <v-text-field
        v-model.trim="docName"
        density="compact"
        placeholder="Name Document"
        prepend-inner-icon="mdi-account-badge-outline"
        variant="outlined"
      ></v-text-field>

      <div class="text-subtitle-1 text-medium-emphasis">Text</div>
      <!-- v-model.trim="docText" -->
      <!-- :model-value="docText" -->
      <v-text-field
        v-model.trim="docText"
        density="compact"
        placeholder="Text"
        prepend-inner-icon="mdi-account-badge-outline"
        variant="outlined"
      ></v-text-field>

      <v-btn class="mb-8" color="blue" size="large" variant="tonal" block @click="$emit('cancel')">
        Cancel
      </v-btn>

      <v-btn
        class="mb-8"
        color="blue"
        size="large"
        variant="tonal"
        block
        @click="$emit('ok', { actionNameOk, docName, docText })"
      >
        {{ actionNameOk }}
      </v-btn>
    </v-card>
    <!-- <v-card
      max-width="400"
      prepend-icon="mdi-update"
      :text="text"
      :title="title"
    >
      <template v-slot:actions>
        <v-btn
          class="ms-auto"
          text="Ok"
          @click="close"
        ></v-btn>
      </template>
    </v-card> -->
  </v-dialog>
</template>

<style scoped>
.form {
  width: 400px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
