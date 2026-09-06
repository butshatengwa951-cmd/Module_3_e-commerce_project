<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { resetPassword, verifyResetToken } from "../services/api.js";

const route = useRoute();
const router = useRouter();

const token = ref(route.query.token || "");

const password = ref("");
const confirmPassword = ref("");

const message = ref("");
const error = ref("");
const loading = ref(false);

const verifying = ref(true);
const tokenValid = ref(false);

const handleResetPassword = async () => {
  message.value = "";
  error.value = "";

  if (!tokenValid.value) {
    error.value = "This password reset link is invalid or has expired.";
    return;
  }

  if (!password.value || !confirmPassword.value) {
    error.value = "Please enter and confirm your new password.";
    return;
  }

  if (password.value.length < 8) {
    error.value = "Password must be at least 8 characters long.";
    return;
  }

  if (password.value !== confirmPassword.value) {
    error.value = "Passwords do not match.";
    return;
  }

  loading.value = true;

  try {
    const response = await resetPassword({
      token: token.value,
      password: password.value,
      confirm_password: confirmPassword.value,
    });

    if (response.success) {
      message.value = response.message;

      password.value = "";
      confirmPassword.value = "";

      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } else {
      error.value = response.message;
    }
  } catch (err) {
    console.error("Reset password error:", err);

    if (err.response?.data?.message) {
      error.value = err.response.data.message;
    } else {
      error.value = "Unable to connect to the server.";
    }
  } finally {
    loading.value = false;
  }
};

const verifyToken = async () => {
  if (!token.value) {
    error.value = "This password reset link is invalid or has expired.";

    verifying.value = false;
    return;
  }

  try {
    const response = await verifyResetToken(token.value);

    if (response.success) {
      tokenValid.value = true;
    } else {
      error.value = response.message;
    }
  } catch (err) {
    console.error("Token verification error:", err);

    if (err.response?.data?.message) {
      error.value = err.response.data.message;
    } else {
      error.value = "This password reset link is invalid or has expired.";
    }
  } finally {
    verifying.value = false;
  }
};

onMounted(() => {
  verifyToken();
});
</script>

<template>
  <main>
    <h1>Reset Password</h1>

    <p v-if="verifying">
      Checking password reset link...
    </p>

    <div v-else-if="tokenValid">
      <form @submit.prevent="handleResetPassword">
        <div>
          <label for="password">
            New Password
          </label>

          <input
            id="password"
            v-model="password"
            type="password"
            minlength="8"
            required
          />
        </div>

        <div>
          <label for="confirmPassword">
            Confirm New Password
          </label>

          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            minlength="8"
            required
          />
        </div>

        <button
          type="submit"
          :disabled="loading"
        >
          {{
            loading
              ? "Resetting..."
              : "Reset Password"
          }}
        </button>
      </form>
    </div>

    <p v-if="message">
      {{ message }}
    </p>

    <p v-if="error">
      {{ error }}
    </p>

    <p>
      <router-link to="/login">
        Back to Login
      </router-link>
    </p>
  </main>
</template>