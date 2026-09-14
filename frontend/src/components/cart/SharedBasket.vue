<script>
import { useCartStore } from '../../stores/cart'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const cartStore = useCartStore()
const route = useRoute()
</script>

<template>
  <div v-if="loading">Loading from MySQL...</div>
  <table v-else class="w-full">
    <thead><tr><th>Product</th><th>Supplier</th><th>Unit Price</th><th>Qty</th><th>Subtotal</th></tr></thead>
    <tr v-for="item in items" :key="item.order_item_id">
      <td>{{ item.product_name }}</td> <!-- products table -->
      <td><span class="badge">{{ item.supplier_name }}</span></td> <!-- supplier_prices -->
      <td>R{{ item.unit_price }}</td>
      <td>
        <button @click="$emit('updateQty', item.order_item_id, item.quantity -1)">-</button>
        {{ item.quantity }}
        <button @click="$emit('updateQty', item.order_item_id, item.quantity +1)">+</button>
      </td>
      <td>R{{ item.subtotal }}</td>
    </tr>
  </table>
</template>