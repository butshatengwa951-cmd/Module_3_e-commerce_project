<script setup>
import { ref } from "vue";
import { forgotPassword } from "../services/api.js";

const email = ref("");

const message = ref("");
const error = ref("");
const loading = ref(false);

const handleForgotPassword = async () => {
  message.value = "";
  error.value = "";

  if (!email.value) {
    error.value = "Email is required.";
    return;
  }

  loading.value = true;

  try {
    const response = await forgotPassword(
      email.value
    );

    if (response.success) {
      message.value = response.message;
    } else {
      error.value = response.message;
    }

  } catch (err) {
    console.error(
      "Forgot password error:",
      err
    );

    if (err.response?.data?.message) {
      error.value =
        err.response.data.message;
    } else {
      error.value =
        "Unable to connect to the server.";
    }

  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <main>
    <h1>Forgot Password</h1>

    <p>
      Enter the email address associated with
      your StockWell account.
    </p>

    <form
      @submit.prevent="handleForgotPassword"
    >
      <div>
        <label for="email">
          Email
        </label>

        <input
          id="email"
          v-model="email"
          type="email"
          placeholder="Enter your email"
          required
        />
      </div>

      <button
        type="submit"
        :disabled="loading"
      >
        {{
          loading
            ? "Sending..."
            : "Send Reset Link"
        }}
      </button>
    </form>

    <p v-if="message">
      {{ message }}
    </p>

    <p v-if="error">
      {{ error }}
    </p>

    <p>
      Remember your password?
      <router-link to="/login">
        Login
      </router-link>
    </p>
  </main>
</template>