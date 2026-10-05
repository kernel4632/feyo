<!-- Real Vue consumers exercise v-model, legacy title attrs, scoped slots and styles. -->
<script setup>
import { ref } from "vue";
import Button from "../src/components/button/button.ce.vue";
import Select from "../src/components/select/select.ce.vue";
import Notification from "../src/components/notification/notification.ce.vue";
import Table from "../src/components/table/table.ce.vue";
import EmptyState from "../src/components/empty-state/empty-state.ce.vue";

const clicks = ref(0);
const choice = ref(null);
const selected = ref([]);
const open = ref(true);
const title = ref("Legacy title");
const options = [{ value: 1, label: "One" }, { value: 2, label: "Two" }];
</script>

<template>
  <Button id="vue-button" @click="clicks++">Save</Button>
  <output id="vue-clicks">{{ clicks }}</output>
  <Select id="vue-select" v-model="choice" :items="options" label="Number" />
  <output id="vue-choice">{{ choice }}</output>
  <Table id="vue-table" v-model="selected" :rows="[{ id: 'a', name: 'Alice' }]" :columns="[{ key: 'name', label: 'Name' }]" selectable>
    <template #cell-name="{ value }"><button type="button">{{ value }}</button></template>
  </Table>
  <output id="vue-selected">{{ selected.join(',') }}</output>
  <EmptyState id="vue-empty" title="No results"><template #action><button type="button">Create</button></template></EmptyState>
  <Notification id="vue-notification" v-model:open="open" :title="title" :duration="0" position="bottom-right" />
  <button id="vue-title" type="button" @click="title = 'Updated title'">Rename</button>
  <output id="vue-open">{{ open }}</output>
</template>
