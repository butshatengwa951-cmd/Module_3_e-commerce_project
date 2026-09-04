<script setup>
import { onMounted } from "vue";
import { getStokvels } from "./services/api.js";
onMounted(async () => {
  try {
    const data = await getStokvels();
    console.log("Stokvel API response:");
    console.log(data);
  } catch (error) {
    console.error("Failed to fetch stokvels:");
    console.error(error);
  }
});
</script>
<template><h1>StockWell Frontend API Test</h1></template>
