<script setup>
import {
  onBeforeUnmount,
  onMounted,
  ref,
} from "vue";

import {
  useRoute,
  useRouter,
} from "vue-router";

import GlassCard from "../components/GlassCard.vue";
import PageBackground from "../components/PageBackground.vue";

import {
  resetPassword,
  verifyResetToken,
} from "../services/api.js";

import {
  useTheme,
} from "../composables/useTheme.js";

const route = useRoute();
const router = useRouter();

const { isDark } = useTheme();

const token = ref(
  route.query.token || ""
);

const password = ref("");
const confirmPassword = ref("");

const showPassword = ref(false);
const showConfirmPassword =
  ref(false);

const loading = ref(false);
const verifying = ref(true);

const tokenValid = ref(false);

const leaving = ref(false);

const notification = ref({
  visible: false,
  type: "",
  title: "",
  message: "",
});

let notificationTimer = null;

let redirectTimer = null;

const showNotification = (
  type,
  title,
  message
) => {
  if (notificationTimer) {
    clearTimeout(notificationTimer);
  }

  notification.value = {
    visible: true,
    type,
    title,
    message,
  };

  notificationTimer = setTimeout(() => {
    closeNotification();
  }, 4500);
};

const closeNotification = () => {
  if (notificationTimer) {
    clearTimeout(notificationTimer);

    notificationTimer = null;
  }

  notification.value.visible = false;
};

const handleResetPassword =
  async () => {
    closeNotification();

    if (!tokenValid.value) {
      showNotification(
        "error",
        "Reset unsuccessful",
        "This password reset link is invalid or has expired."
      );

      return;
    }

    if (
      !password.value ||
      !confirmPassword.value
    ) {
      showNotification(
        "error",
        "Reset unsuccessful",
        "Please enter and confirm your new password."
      );

      return;
    }

    if (
      password.value.length < 8
    ) {
      showNotification(
        "error",
        "Reset unsuccessful",
        "Password must be at least 8 characters long."
      );

      return;
    }

    if (
      password.value !==
      confirmPassword.value
    ) {
      showNotification(
        "error",
        "Reset unsuccessful",
        "Passwords do not match."
      );

      return;
    }

    loading.value = true;

    try {
      const response =
        await resetPassword({
          token: token.value,

          password:
            password.value,

          confirm_password:
            confirmPassword.value,
        });

      if (response.success) {
        password.value = "";
        confirmPassword.value = "";

        showPassword.value =
          false;

        showConfirmPassword.value =
          false;

        showNotification(
          "success",
          "Password reset successful",
          response.message ||
            "Your password has been updated successfully."
        );

        redirectTimer = setTimeout(
          () => {
            router.push("/login");
          },
          1800
        );
      } else {
        showNotification(
          "error",
          "Reset unsuccessful",
          response.message ||
            "Unable to reset your password."
        );
      }
    } catch (err) {
      console.error(
        "Reset password error:",
        err
      );

      if (
        err.response?.data?.message
      ) {
        showNotification(
          "error",
          "Reset unsuccessful",
          err.response.data.message
        );
      } else {
        showNotification(
          "error",
          "Connection error",
          "Unable to connect to the server."
        );
      }
    } finally {
      loading.value = false;
    }
  };

const verifyToken = async () => {
  closeNotification();

  if (!token.value) {
    tokenValid.value =
      false;

    verifying.value =
      false;

    return;
  }

  try {
    const response =
      await verifyResetToken(
        token.value
      );

    if (response.success) {
      tokenValid.value =
        true;
    } else {
      tokenValid.value =
        false;
    }
  } catch (err) {
    console.error(
      "Token verification error:",
      err
    );

    tokenValid.value =
      false;
  } finally {
    verifying.value =
      false;
  }
};

const goBackToLogin = () => {
  if (leaving.value) {
    return;
  }

  leaving.value = true;

  setTimeout(() => {
    router.push("/login");
  }, 450);
};

onMounted(() => {
  verifyToken();
});

onBeforeUnmount(() => {
  if (notificationTimer) {
    clearTimeout(
      notificationTimer
    );
  }

  if (redirectTimer) {
    clearTimeout(
      redirectTimer
    );
  }
});
</script>

<template>
  <main
    class="reset-password-page"
    :class="{
      'is-leaving': leaving,
    }"
  >

    <PageBackground />


    <!-- ==================================================
         GLASS NOTIFICATION
         ================================================== -->

    <Transition name="notification">

      <div
        v-if="notification.visible"
        class="notification"
        :class="[
          `notification-${notification.type}`,
          {
            'notification-dark':
              isDark,
          },
        ]"
        role="alert"
        aria-live="polite"
      >

        <div
          class="notification-icon"
        >

          <svg
            v-if="
              notification.type ===
              'success'
            "
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
            />

            <path
              d="M7.5 12.5l3 3 6-6"
            />
          </svg>

          <svg
            v-else
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
            />

            <path
              d="M12 8v5"
            />

            <circle
              cx="12"
              cy="16.5"
              r="0.8"
              fill="currentColor"
              stroke="none"
            />
          </svg>

        </div>


        <div
          class="notification-content"
        >

          <strong>
            {{ notification.title }}
          </strong>

          <span>
            {{ notification.message }}
          </span>

        </div>


        <button
          type="button"
          class="notification-close"
          aria-label="Close notification"
          title="Close notification"
          @click="
            closeNotification
          "
        >
          ×
        </button>

      </div>

    </Transition>


    <!-- ==================================================
         BACK TO LOGIN
         ================================================== -->

    <button
      type="button"
      class="back-auth-button"
      :disabled="leaving"
      aria-label="Return to login"
      @click="goBackToLogin"
    >

      <span
        class="back-arrow"
        aria-hidden="true"
      >
        ←
      </span>

      <span>
        Back to Login
      </span>

    </button>


    <!-- ==================================================
         BRANDING
         ================================================== -->

    <header class="page-brand">

      <div class="brand-mark">

        <span
          class="brand-handshake"
          aria-hidden="true"
        >
          🤝
        </span>

      </div>

      <span>
        RESET PASSWORD · StockWell
      </span>

    </header>


    <!-- ==================================================
         GLASS CARD
         ================================================== -->

    <GlassCard
      :variant="
        isDark
          ? 'dark'
          : 'light'
      "
    >

      <div
        class="reset-password-content"
      >

        <span class="eyebrow">
          Account recovery
        </span>


        <!-- VERIFYING -->

        <template
          v-if="verifying"
        >

          <h1>
            Checking Link
          </h1>

          <p class="intro">
            Please wait while we verify
            your password reset link.
          </p>

          <div
            class="loading-state"
          >
            <span
              class="loading-dot"
            ></span>

            <span>
              Verifying reset link...
            </span>
          </div>

        </template>


        <!-- VERIFIED / INVALID -->

        <template v-else>

          <template
            v-if="tokenValid"
          >

            <h1>
              Reset Password
            </h1>

            <p class="intro">
              Create a new password
              for your StockWell account.
            </p>


            <form
              @submit.prevent="
                handleResetPassword
              "
            >

              <!-- NEW PASSWORD -->

              <div
                class="field"
              >

                <label
                  for="password"
                >
                  New Password
                </label>

                <div
                  class="password-input-wrapper"
                >

                  <input
                    id="password"
                    v-model="
                      password
                    "
                    :type="
                      showPassword
                        ? 'text'
                        : 'password'
                    "
                    placeholder="Enter your new password"
                    autocomplete="new-password"
                    minlength="8"
                    required
                  />

                  <button
                    type="button"
                    class="password-toggle"
                    :aria-label="
                      showPassword
                        ? 'Hide password'
                        : 'Show password'
                    "
                    :title="
                      showPassword
                        ? 'Hide password'
                        : 'Show password'
                    "
                    @click="
                      showPassword =
                        !showPassword
                    "
                  >

                    <!-- CLOSED -->

                    <svg
                      v-if="
                        !showPassword
                      "
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >

                      <path
                        d="
                          M2 12
                          C4.5 8
                          8 6
                          12 6
                          C16 6
                          19.5 8
                          22 12
                          C19.5 16
                          16 18
                          12 18
                          C8 18
                          4.5 16
                          2 12
                          Z
                        "
                      />

                      <circle
                        cx="12"
                        cy="12"
                        r="2.5"
                      />

                    </svg>


                    <!-- OPEN -->

                    <svg
                      v-else
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >

                      <path
                        d="M3 3l18 18"
                      />

                      <path
                        d="
                          M10.6 6.2
                          C11.05 6.07
                          11.52 6
                          12 6
                          C16 6
                          19.5 8
                          22 12
                          C21.25 13.2
                          20.35 14.25
                          19.25 15.15
                        "
                      />

                      <path
                        d="
                          M6.1 6.1
                          C3.7 7.6
                          2.5 9.7
                          2 12
                          C4.5 16
                          8 18
                          12 18
                          C13.65 18
                          15.2 17.6
                          16.6 17
                        "
                      />

                      <path
                        d="
                          M9.9 9.9
                          C8.75 11.05
                          8.75 12.95
                          9.9 14.1
                          C11.05 15.25
                          12.95 15.25
                          14.1 14.1
                        "
                      />

                    </svg>

                  </button>

                </div>

              </div>


              <!-- CONFIRM PASSWORD -->

              <div
                class="field"
              >

                <label
                  for="confirmPassword"
                >
                  Confirm Password
                </label>

                <div
                  class="password-input-wrapper"
                >

                  <input
                    id="confirmPassword"
                    v-model="
                      confirmPassword
                    "
                    :type="
                      showConfirmPassword
                        ? 'text'
                        : 'password'
                    "
                    placeholder="Confirm your new password"
                    autocomplete="new-password"
                    minlength="8"
                    required
                  />

                  <button
                    type="button"
                    class="password-toggle"
                    :aria-label="
                      showConfirmPassword
                        ? 'Hide password'
                        : 'Show password'
                    "
                    :title="
                      showConfirmPassword
                        ? 'Hide password'
                        : 'Show password'
                    "
                    @click="
                      showConfirmPassword =
                        !showConfirmPassword
                    "
                  >

                    <!-- CLOSED -->

                    <svg
                      v-if="
                        !showConfirmPassword
                      "
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >

                      <path
                        d="
                          M2 12
                          C4.5 8
                          8 6
                          12 6
                          C16 6
                          19.5 8
                          22 12
                          C19.5 16
                          16 18
                          12 18
                          C8 18
                          4.5 16
                          2 12
                          Z
                        "
                      />

                      <circle
                        cx="12"
                        cy="12"
                        r="2.5"
                      />

                    </svg>


                    <!-- OPEN -->

                    <svg
                      v-else
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >

                      <path
                        d="M3 3l18 18"
                      />

                      <path
                        d="
                          M10.6 6.2
                          C11.05 6.07
                          11.52 6
                          12 6
                          C16 6
                          19.5 8
                          22 12
                          C21.25 13.2
                          20.35 14.25
                          19.25 15.15
                        "
                      />

                      <path
                        d="
                          M6.1 6.1
                          C3.7 7.6
                          2.5 9.7
                          2 12
                          C4.5 16
                          8 18
                          12 18
                          C13.65 18
                          15.2 17.6
                          16.6 17
                        "
                      />

                      <path
                        d="
                          M9.9 9.9
                          C8.75 11.05
                          8.75 12.95
                          9.9 14.1
                          C11.05 15.25
                          12.95 15.25
                          14.1 14.1
                        "
                      />

                    </svg>

                  </button>

                </div>

              </div>


              <p
                class="password-hint"
              >
                Password must be at least
                8 characters long.
              </p>


              <button
                type="submit"
                class="reset-submit"
                :disabled="loading"
              >
                <span
                  v-if="!loading"
                >
                  Reset Password
                </span>

                <span v-else>
                  Resetting...
                </span>
              </button>

            </form>

          </template>


          <!-- INVALID -->

          <div
            v-else
            class="invalid-state"
          >

            <div
              class="invalid-icon"
              aria-hidden="true"
            >
              !
            </div>

            <h2>
              Link Unavailable
            </h2>

            <p>
              This password reset link
              is invalid or has expired.
            </p>

            <router-link
              class="recovery-link"
              to="/forgot-password"
            >
              Request a new reset link
            </router-link>

          </div>

        </template>


        <!-- BOTTOM LOGIN -->

        <div
          class="bottom-link"
        >

          <span>
            Remember your password?
          </span>

          <router-link
            to="/login"
          >
            Login
          </router-link>

        </div>

      </div>

    </GlassCard>


    <!-- ==================================================
         FOOTER
         ================================================== -->

    <footer>
      Save · Grow · Together
    </footer>

  </main>
</template>


<style scoped>
/* =========================================================
   PAGE
   ========================================================= */

.reset-password-page {
  position:
    relative;

  min-height:
    100vh;

  overflow:
    hidden;

  display:
    flex;

  align-items:
    center;

  justify-content:
    center;

  padding:
    var(--sw-space-14)
    var(--sw-space-7);

  background:
    var(--sw-page-gradient);

  color:
    var(--sw-white);

  font-family:
    var(--sw-font-body);

  box-sizing:
    border-box;

  transition:
    opacity
    450ms
    ease,

    transform
    450ms
    cubic-bezier(
      0.22,
      1,
      0.36,
      1
    ),

    filter
    450ms
    ease;
}

.reset-password-page.is-leaving {
  opacity:
    0;

  transform:
    translateY(24px)
    scale(0.98);

  filter:
    blur(8px);

  pointer-events:
    none;
}


/* =========================================================
   NOTIFICATION
   ========================================================= */

.notification {
  position:
    fixed;

  top:
    82px;

  left:
    32px;

  z-index:
    100;

  width:
    min(
      360px,
      calc(
        100vw - 64px
      )
    );

  display:
    flex;

  align-items:
    flex-start;

  gap:
    14px;

  padding:
    16px
    18px;

  border:
    1px
    solid
    rgba(
      255,
      255,
      255,
      0.35
    );

  border-radius:
    20px;

  background:
    rgba(
      255,
      255,
      255,
      0.14
    );

  box-shadow:
    0
    18px
    55px
    rgba(
      49,
      43,
      80,
      0.24
    ),

    inset
    0
    1px
    1px
    rgba(
      255,
      255,
      255,
      0.35
    );

  backdrop-filter:
    blur(
      24px
    )
    saturate(
      145%
    );

  -webkit-backdrop-filter:
    blur(
      24px
    )
    saturate(
      145%
    );

  color:
    var(--sw-white);
}

.notification-success {
  box-shadow:
    0
    18px
    55px
    rgba(
      49,
      43,
      80,
      0.2
    ),

    inset
    0
    1px
    1px
    rgba(
      255,
      255,
      255,
      0.35
    );
}

.notification-error {
  box-shadow:
    0
    18px
    55px
    rgba(
      163,
      60,
      45,
      0.25
    ),

    inset
    0
    1px
    1px
    rgba(
      255,
      255,
      255,
      0.35
    );
}

.notification-icon {
  width:
    38px;

  height:
    38px;

  flex:
    0 0
    38px;

  display:
    flex;

  align-items:
    center;

  justify-content:
    center;

  border-radius:
    13px;

  background:
    rgba(
      255,
      255,
      255,
      0.15
    );
}

.notification-success
.notification-icon {
  color:
    var(--sw-gold-500);
}

.notification-error
.notification-icon {
  color:
    #ffb3a6;
}

.notification-icon svg {
  width:
    21px;

  height:
    21px;

  fill:
    none;

  stroke:
    currentColor;

  stroke-width:
    1.8;

  stroke-linecap:
    round;

  stroke-linejoin:
    round;
}

.notification-content {
  min-width:
    0;

  flex:
    1;

  display:
    flex;

  flex-direction:
    column;

  gap:
    4px;

  padding-top:
    1px;
}

.notification-content strong {
  font-size:
    0.9rem;

  font-weight:
    800;

  letter-spacing:
    0.02em;
}

.notification-content span {
  font-size:
    0.78rem;

  line-height:
    1.5;

  opacity:
    0.82;

  overflow-wrap:
    anywhere;
}

.notification-close {
  flex:
    0 0
    28px;

  width:
    28px;

  height:
    28px;

  display:
    flex;

  align-items:
    center;

  justify-content:
    center;

  padding:
    0;

  border:
    none;

  border-radius:
    50%;

  background:
    transparent;

  color:
    currentColor;

  font-size:
    1.35rem;

  line-height:
    1;

  cursor:
    pointer;

  opacity:
    0.65;

  transition:
    transform
    200ms
    ease,

    opacity
    200ms
    ease,

    background
    200ms
    ease;
}

.notification-close:hover {
  opacity:
    1;

  background:
    rgba(
      255,
      255,
      255,
      0.1
    );

  transform:
    scale(
      1.06
    );
}

.notification-close:active {
  transform:
    scale(
      0.92
    );
}

.notification-close:focus-visible {
  outline:
    2px
    solid
    currentColor;

  outline-offset:
    2px;
}


/* =========================================================
   TRANSITION
   ========================================================= */

.notification-enter-active,
.notification-leave-active {
  transition:
    opacity
    450ms
    ease,

    transform
    550ms
    cubic-bezier(
      0.16,
      1,
      0.3,
      1
    ),

    filter
    450ms
    ease;
}

.notification-enter-from,
.notification-leave-to {
  opacity:
    0;

  transform:
    translate3d(
      -28px,
      -10px,
      0
    )
    scale(
      0.96
    );

  filter:
    blur(
      8px
    );
}


/* =========================================================
   BACK TO LOGIN
   ========================================================= */

.back-auth-button {
  position:
    absolute;

  right:
    var(--sw-space-11);

  bottom:
    var(--sw-space-6);

  z-index:
    30;

  display:
    inline-flex;

  align-items:
    center;

  gap:
    var(--sw-space-2);

  padding:
    var(--sw-space-3)
    var(--sw-space-5);

  border:
    1px
    solid
    var(--sw-glass-light-border);

  border-radius:
    var(--sw-radius-pill);

  background:
    var(--sw-glass-light);

  color:
    var(--sw-white);

  box-shadow:
    var(--sw-glass-shadow-light);

  backdrop-filter:
    blur(
      var(--sw-glass-blur)
    )
    saturate(
      var(--sw-glass-saturation)
    );

  -webkit-backdrop-filter:
    blur(
      var(--sw-glass-blur)
    )
    saturate(
      var(--sw-glass-saturation)
    );

  font-family:
    inherit;

  font-size:
    var(--sw-text-sm);

  font-weight:
    700;

  letter-spacing:
    0.04em;

  cursor:
    pointer;

  transition:
    transform
    300ms
    ease,

    background
    300ms
    ease,

    box-shadow
    300ms
    ease,

    opacity
    300ms
    ease;
}

.back-auth-button:hover:not(:disabled) {
  transform:
    translateY(-3px);

  box-shadow:
    var(--sw-glass-shadow-light-hover);
}

.back-auth-button:active:not(:disabled) {
  transform:
    translateY(0);
}

.back-auth-button:disabled {
  cursor:
    default;

  opacity:
    0.55;
}

.back-arrow {
  font-size:
    1rem;

  transition:
    transform
    300ms
    ease;
}

.back-auth-button:hover:not(:disabled)
.back-arrow {
  transform:
    translateX(-3px);
}


/* =========================================================
   BRAND
   ========================================================= */

.page-brand {
  position:
    absolute;

  top:
    var(--sw-space-9);

  left:
    var(--sw-space-11);

  z-index:
    20;

  display:
    flex;

  align-items:
    center;

  gap:
    var(--sw-space-3);

  font-weight:
    700;

  font-size:
    var(--sw-text-xl);

  letter-spacing:
    0.02em;
}

.brand-mark {
  width:
    30px;

  height:
    30px;

  display:
    flex;

  align-items:
    center;

  justify-content:
    center;
}

.brand-handshake {
  display:
    inline-flex;

  align-items:
    center;

  justify-content:
    center;

  width:
    100%;

  height:
    100%;

  font-size:
    1.55rem;

  line-height:
    1;

  transition:
    transform
    300ms
    ease,

    filter
    300ms
    ease;
}

.brand-mark:hover
.brand-handshake {
  transform:
    scale(
      1.08
    )
    rotate(
      -3deg
    );

  filter:
    drop-shadow(
      0
      3px
      5px
      rgba(
        49,
        43,
        80,
        0.18
      )
    );
}


/* =========================================================
   CONTENT
   ========================================================= */

.reset-password-content {
  display:
    flex;

  flex-direction:
    column;

  align-items:
    stretch;
}

.eyebrow {
  margin:
    0 0
    var(--sw-space-3);

  font-size:
    var(--sw-text-sm);

  letter-spacing:
    0.18em;

  text-transform:
    uppercase;

  color:
    var(--sw-page-text-muted);
}

h1 {
  margin:
    0;

  font-size:
    var(--sw-heading-xl);

  line-height:
    1;

  letter-spacing:
    -0.06em;

  color:
    var(--sw-page-text);
}

.intro {
  margin:
    var(--sw-space-3)
    0
    var(--sw-space-12);

  color:
    var(--sw-page-text-soft);

  font-size:
    var(--sw-text-lg);

  line-height:
    1.7;
}


/* =========================================================
   LOADING
   ========================================================= */

.loading-state {
  display:
    flex;

  align-items:
    center;

  justify-content:
    center;

  gap:
    var(--sw-space-3);

  padding:
    var(--sw-space-6)
    0;

  color:
    var(--sw-page-text-muted);

  font-size:
    var(--sw-text-md);
}

.loading-dot {
  width:
    10px;

  height:
    10px;

  border-radius:
    50%;

  background:
    var(--sw-orange-600);

  animation:
    loadingPulse
    1.2s
    ease-in-out
    infinite;
}


/* =========================================================
   FIELDS
   ========================================================= */

.field {
  margin-bottom:
    var(--sw-space-7);
}

.field label {
  display:
    block;

  margin-bottom:
    var(--sw-space-2);

  font-size:
    var(--sw-text-md);

  font-weight:
    700;

  letter-spacing:
    0.08em;

  color:
    var(--sw-page-text);
}

.field input {
  width:
    100%;

  box-sizing:
    border-box;

  padding:
    var(--sw-space-4)
    var(--sw-space-5);

  border:
    1px
    solid
    var(--sw-input-border);

  border-radius:
    var(--sw-radius-md);

  outline:
    none;

  background:
    var(--sw-input-background);

  color:
    var(--sw-input-text);

  font-family:
    inherit;

  font-size:
    var(--sw-text-base);

  transition:
    border-color
    var(--sw-transition),

    background
    var(--sw-transition),

    box-shadow
    var(--sw-transition),

    transform
    var(--sw-transition);
}

.field input::placeholder {
  color:
    var(--sw-placeholder);
}

.field input:focus {
  border-color:
    var(--sw-focus);

  background:
    var(--sw-input-background-focus);

  box-shadow:
    0
    0
    0
    4px
    var(--sw-focus-ring);

  transform:
    translateY(-1px);
}


/* =========================================================
   PASSWORD INPUT
   ========================================================= */

.password-input-wrapper {
  position:
    relative;

  width:
    100%;
}

.password-input-wrapper input {
  padding-right:
    56px;
}

.password-toggle {
  position:
    absolute;

  top:
    50%;

  right:
    12px;

  width:
    34px;

  height:
    34px;

  display:
    flex;

  align-items:
    center;

  justify-content:
    center;

  padding:
    0;

  border:
    none;

  border-radius:
    50%;

  background:
    transparent;

  color:
    var(--sw-page-text-muted);

  transform:
    translateY(-50%);

  cursor:
    pointer;

  transition:
    background
    200ms
    ease,

    color
    200ms
    ease,

    transform
    200ms
    ease;
}

.password-toggle:hover {
  background:
    rgba(
      121,
      93,
      137,
      0.08
    );

  color:
    var(--sw-page-text);

  transform:
    translateY(-50%)
    scale(
      1.06
    );
}

.password-toggle:active {
  transform:
    translateY(-50%)
    scale(
      0.94
    );
}

.password-toggle:focus-visible {
  outline:
    2px
    solid
    var(--sw-focus);

  outline-offset:
    2px;
}

.password-toggle svg {
  width:
    19px;

  height:
    19px;

  fill:
    none;

  stroke:
    currentColor;

  stroke-width:
    1.8;

  stroke-linecap:
    round;

  stroke-linejoin:
    round;
}


/* =========================================================
   HINT
   ========================================================= */

.password-hint {
  margin:
    calc(
      var(--sw-space-4) * -1
    )
    0
    var(--sw-space-8);

  color:
    var(--sw-page-text-muted);

  font-size:
    var(--sw-text-sm);

  line-height:
    1.6;
}


/* =========================================================
   SUBMIT
   ========================================================= */

.reset-submit {
  width:
    100%;

  padding:
    15px;

  border:
    none;

  border-radius:
    var(--sw-radius-pill);

  background:
    var(--sw-button-gradient);

  color:
    var(--sw-white);

  font-family:
    inherit;

  font-size:
    var(--sw-text-base);

  font-weight:
    700;

  letter-spacing:
    0.05em;

  cursor:
    pointer;

  transition:
    transform
    var(--sw-transition),

    box-shadow
    var(--sw-transition),

    opacity
    var(--sw-transition);
}

.reset-submit:hover:not(:disabled) {
  transform:
    translateY(-2px);

  box-shadow:
    var(--sw-button-shadow);
}

.reset-submit:active:not(:disabled) {
  transform:
    translateY(0);
}

.reset-submit:disabled {
  opacity:
    0.6;

  cursor:
    not-allowed;
}


/* =========================================================
   INVALID STATE
   ========================================================= */

.invalid-state {
  padding:
    0
    var(--sw-space-2);

  text-align:
    center;
}

.invalid-icon {
  width:
    50px;

  height:
    50px;

  margin:
    0
    auto
    var(--sw-space-5);

  display:
    flex;

  align-items:
    center;

  justify-content:
    center;

  border:
    2px
    solid
    var(--sw-red-600);

  border-radius:
    50%;

  color:
    var(--sw-red-600);

  font-size:
    1.5rem;

  font-weight:
    700;
}

.invalid-state h2 {
  margin:
    0
    0
    var(--sw-space-3);

  color:
    var(--sw-page-text);

  font-size:
    var(--sw-heading-md);
}

.invalid-state p {
  margin:
    0
    0
    var(--sw-space-5);

  color:
    var(--sw-page-text-soft);

  line-height:
    1.7;
}

.recovery-link {
  color:
    var(--sw-purple-700);

  font-size:
    var(--sw-text-sm);

  font-weight:
    700;

  text-decoration:
    none;
}

.recovery-link:hover {
  text-decoration:
    underline;
}


/* =========================================================
   BOTTOM LINK
   ========================================================= */

.bottom-link {
  margin:
    var(--sw-space-10)
    0
    0;

  text-align:
    center;

  font-size:
    var(--sw-text-md);

  color:
    var(--sw-page-text-muted);
}

.bottom-link a {
  margin-left:
    var(--sw-space-1);

  color:
    var(--sw-page-text);

  font-weight:
    700;

  text-decoration:
    none;
}

.bottom-link a:hover {
  text-decoration:
    underline;
}


/* =========================================================
   FOOTER
   ========================================================= */

footer {
  position:
    absolute;

  left:
    var(--sw-space-11);

  bottom:
    var(--sw-space-6);

  color:
    var(--sw-white);

  font-size:
    var(--sw-text-xs);

  letter-spacing:
    0.12em;

  opacity:
    0.55;
}


/* =========================================================
   DARK MODE
   ========================================================= */

:global(html.dark-mode)
.back-auth-button {
  border-color:
    var(--sw-glass-dark-border);

  background:
    var(--sw-glass-dark);

  color:
    var(--sw-glass-dark-text);

  box-shadow:
    var(--sw-glass-shadow-dark);
}

:global(html.dark-mode)
.back-auth-button:hover:not(:disabled) {
  box-shadow:
    var(--sw-glass-shadow-dark-hover);
}

:global(html.dark-mode)
.notification {
  border-color:
    rgba(
      255,
      255,
      255,
      0.16
    );

  background:
    rgba(
      28,
      23,
      38,
      0.58
    );

  color:
    var(--sw-off-white);

  box-shadow:
    0
    18px
    55px
    rgba(
      0,
      0,
      0,
      0.42
    ),

    inset
    0
    1px
    1px
    rgba(
      255,
      255,
      255,
      0.1
    );
}

:global(html.dark-mode)
.brand-handshake {
  filter:
    drop-shadow(
      0
      2px
      5px
      rgba(
        255,
        255,
        255,
        0.08
      )
    );
}


/* =========================================================
   MOBILE
   ========================================================= */

@media (max-width: 768px) {

  .reset-password-page {
    padding:
      var(--sw-space-14)
      var(--sw-space-5);
  }

  .page-brand {
    top:
      var(--sw-space-7);

    left:
      var(--sw-space-7);

    font-size:
      var(--sw-text-lg);
  }

  .back-auth-button {
    right:
      var(--sw-space-7);

    bottom:
      var(--sw-space-6);

    padding:
      var(--sw-space-2)
      var(--sw-space-4);

    font-size:
      0.62rem;
  }

  .notification {
    top:
      78px;

    left:
      18px;

    right:
      18px;

    width:
      auto;

    max-width:
      360px;

    padding:
      14px
      15px;

    border-radius:
      18px;
  }

  h1 {
    font-size:
      clamp(
        2.4rem,
        11vw,
        var(--sw-heading-xl)
      );
  }

  .intro {
    font-size:
      var(--sw-text-base);
  }

  footer {
    left:
      var(--sw-space-7);

    bottom:
      var(--sw-space-6);
  }
}


/* =========================================================
   REDUCED MOTION
   ========================================================= */

@media (prefers-reduced-motion: reduce) {

  .reset-password-page,
  .back-auth-button,
  .back-arrow,
  .brand-handshake,
  .password-toggle,
  .notification,
  .notification-enter-active,
  .notification-leave-active {
    transition:
      none !important;
  }

  .loading-dot {
    animation:
      none !important;
  }
}


/* =========================================================
   LOADING ANIMATION
   ========================================================= */

@keyframes loadingPulse {

  0%,
  100% {
    opacity:
      0.35;

    transform:
      scale(
        0.8
      );
  }

  50% {
    opacity:
      1;

    transform:
      scale(
        1
      );
  }
}
</style>