import crypto from "crypto";
import dns from "dns/promises";
import axios from "axios";

const encodePayfastValue = (value) =>
  encodeURIComponent(String(value).trim())
    .replace(/%20/g, "+")
    .replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);

export const isPayfastConfigured = () =>
  Boolean(process.env.PAYFAST_MERCHANT_ID && process.env.PAYFAST_MERCHANT_KEY);

export const isPayfastSandbox = () =>
  String(process.env.PAYFAST_SANDBOX || "true").toLowerCase() !== "false";

export const payfastProcessUrl = () =>
  isPayfastSandbox()
    ? "https://sandbox.payfast.co.za/eng/process"
    : "https://www.payfast.co.za/eng/process";

export const payfastValidateUrl = () =>
  isPayfastSandbox()
    ? "https://sandbox.payfast.co.za/eng/query/validate"
    : "https://www.payfast.co.za/eng/query/validate";

export const generatePayfastSignature = (data, passphrase = null) => {
  const parts = [];

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null && String(value) !== "") {
      parts.push(`${key}=${encodePayfastValue(value)}`);
    }
  }

  if (passphrase) {
    parts.push(`passphrase=${encodePayfastValue(passphrase)}`);
  }

  return crypto.createHash("md5").update(parts.join("&")).digest("hex");
};

export const createPayfastCheckout = ({
  paymentId,
  amount,
  user,
  itemName,
}) => {
  if (!isPayfastConfigured()) {
    const error = new Error(
      "PayFast is not configured. Set PAYFAST_MERCHANT_ID and PAYFAST_MERCHANT_KEY in the backend environment."
    );
    error.statusCode = 503;
    throw error;
  }

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const notifyUrl = process.env.PAYFAST_NOTIFY_URL;

  if (!notifyUrl) {
    const error = new Error(
      "PAYFAST_NOTIFY_URL must be configured so PayFast can confirm payments."
    );
    error.statusCode = 503;
    throw error;
  }

  const firstName = String(user.full_name || "Member").trim().split(/\s+/)[0];
  const lastName = String(user.full_name || "Member").trim().split(/\s+/).slice(1).join(" ");

  const fields = {
    merchant_id: String(process.env.PAYFAST_MERCHANT_ID),
    merchant_key: String(process.env.PAYFAST_MERCHANT_KEY),
    return_url:
      process.env.PAYFAST_RETURN_URL || `${frontendUrl}/payment?status=success`,
    cancel_url:
      process.env.PAYFAST_CANCEL_URL || `${frontendUrl}/payment?status=cancelled`,
    notify_url: notifyUrl,
    name_first: firstName,
    name_last: lastName,
    email_address: user.email,
    ...(user.phone_number ? { cell_number: user.phone_number } : {}),
    m_payment_id: String(paymentId),
    amount: Number(amount).toFixed(2),
    item_name: itemName,
  };

  return {
    action: payfastProcessUrl(),
    fields: {
      ...fields,
      signature: generatePayfastSignature(fields, process.env.PAYFAST_PASSPHRASE || null),
    },
  };
};

export const verifyPayfastSignature = (data) => {
  const signature = data.signature;
  if (!signature) return false;

  const withoutSignature = { ...data };
  delete withoutSignature.signature;

  const expected = generatePayfastSignature(
    withoutSignature,
    process.env.PAYFAST_PASSPHRASE || null
  );

  return crypto.timingSafeEqual(
    Buffer.from(String(signature)),
    Buffer.from(expected)
  );
};

const normaliseIp = (ip) => {
  if (!ip) return "";
  if (ip.startsWith("::ffff:")) return ip.slice(7);
  if (ip === "::1") return "127.0.0.1";
  return ip;
};

export const isPayfastSourceIp = async (ip) => {
  const candidate = normaliseIp(ip);
  if (!candidate) return false;

  const validHosts = [
    "www.payfast.co.za",
    "sandbox.payfast.co.za",
    "w1w.payfast.co.za",
    "w2w.payfast.co.za",
  ];

  const addresses = new Set();
  for (const host of validHosts) {
    try {
      const resolved = await dns.lookup(host, { all: true });
      for (const item of resolved) addresses.add(item.address);
    } catch (error) {
      console.error(`PayFast DNS lookup failed for ${host}:`, error.message);
    }
  }

  return addresses.has(candidate);
};

export const validatePayfastNotification = async (data) => {
  const body = Object.entries(data)
    .map(([key, value]) => `${encodePayfastValue(key)}=${encodePayfastValue(value)}`)
    .join("&");

  const response = await axios.post(payfastValidateUrl(), body, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    timeout: 10000,
    validateStatus: () => true,
  });

  return String(response.data || "").trim().toUpperCase() === "VALID";
};
