import crypto from "crypto";
import dns from "dns/promises";
import axios from "axios";

const encodePayfastValue = (value) => encodeURIComponent(String(value).trim()).replace(/%20/g, "+").replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
export const isPayfastConfigured=()=>Boolean(process.env.PAYFAST_MERCHANT_ID&&process.env.PAYFAST_MERCHANT_KEY&&process.env.PAYFAST_NOTIFY_URL&&process.env.PAYFAST_RETURN_URL&&process.env.PAYFAST_CANCEL_URL);
export const isPayfastSandbox=()=>String(process.env.PAYFAST_SANDBOX||"true").toLowerCase()!=="false";
export const payfastProcessUrl=()=>isPayfastSandbox()?"https://sandbox.payfast.co.za/eng/process":"https://www.payfast.co.za/eng/process";
export const payfastValidateUrl=()=>isPayfastSandbox()?"https://sandbox.payfast.co.za/eng/query/validate":"https://www.payfast.co.za/eng/query/validate";
export const generatePayfastSignature=(data,passphrase=null)=>{const parts=[];for(const [key,value] of Object.entries(data)){if(value!==undefined&&value!==null&&String(value)!=="")parts.push(`${key}=${encodePayfastValue(value)}`)}if(passphrase)parts.push(`passphrase=${encodePayfastValue(passphrase)}`);return crypto.createHash("md5").update(parts.join("&")).digest("hex")};
const stockwellReturnUrl=(configuredUrl,paymentId,status)=>{const url=new URL(String(configuredUrl));url.pathname="/";url.search="";url.searchParams.set("status",status);if(paymentId)url.searchParams.set("payment_id",String(paymentId));return url.toString()};
export const createPayfastCheckout=({paymentId,amount,user,itemName})=>{if(!isPayfastConfigured()){const e=new Error("PayFast is not configured. Set the PayFast merchant credentials and public return/cancel/notify URLs in the backend environment.");e.statusCode=503;throw e}const firstName=String(user.full_name||"Member").trim().split(/\s+/)[0];const lastName=String(user.full_name||"Member").trim().split(/\s+/).slice(1).join(" ");const fields={merchant_id:String(process.env.PAYFAST_MERCHANT_ID),merchant_key:String(process.env.PAYFAST_MERCHANT_KEY),return_url:stockwellReturnUrl(process.env.PAYFAST_RETURN_URL,paymentId,"success"),cancel_url:stockwellReturnUrl(process.env.PAYFAST_CANCEL_URL,paymentId,"cancelled"),notify_url:String(process.env.PAYFAST_NOTIFY_URL),name_first:firstName,name_last:lastName,email_address:user.email,...(user.phone_number?{cell_number:user.phone_number}:{}),m_payment_id:String(paymentId),amount:Number(amount).toFixed(2),item_name:itemName};return{action:payfastProcessUrl(),mode:isPayfastSandbox()?"sandbox":"live",fields:{...fields,signature:generatePayfastSignature(fields,process.env.PAYFAST_PASSPHRASE||null)}}};
export const verifyPayfastSignature=(data)=>{const signature=data.signature;if(!signature)return false;const withoutSignature={...data};delete withoutSignature.signature;const expected=generatePayfastSignature(withoutSignature,process.env.PAYFAST_PASSPHRASE||null);return Buffer.byteLength(String(signature))===Buffer.byteLength(expected)&&crypto.timingSafeEqual(Buffer.from(String(signature)),Buffer.from(expected))};
const normaliseIp=(ip)=>{if(!ip)return"";const value=String(ip).trim();if(value.startsWith("::ffff:"))return value.slice(7);if(value==="::1")return"127.0.0.1";return value};
const ipv4ToInt=(ip)=>{const parts=String(ip).split(".");if(parts.length!==4||parts.some((part)=>!/^\d+$/.test(part)||Number(part)>255))return null;return parts.reduce((value,part)=>((value<<8)+Number(part))>>>0,0)};
const isIpv4InCidr=(ip,cidr)=>{const [base,prefixValue]=String(cidr).split("/");const address=ipv4ToInt(ip);const network=ipv4ToInt(base);const prefix=Number(prefixValue);if(address===null||network===null||!Number.isInteger(prefix)||prefix<0||prefix>32)return false;if(prefix===0)return true;const mask=(0xffffffff << (32-prefix))>>>0;return (address & mask)===(network & mask)};
const PAYFAST_SOURCE_CIDRS=[
  "197.97.145.144/28",
  "41.74.179.192/27",
  "102.216.36.0/28",
  "102.216.36.128/28",
  "144.126.193.139/32",
];
const PAYFAST_SOURCE_HOSTS=["www.payfast.co.za","api.payfast.co.za","ips.payfast.co.za","w1w.payfast.co.za","w2w.payfast.co.za"];
export const isPayfastSourceIp=async(ip)=>{const candidate=normaliseIp(ip);if(!candidate)return false;if(PAYFAST_SOURCE_CIDRS.some((cidr)=>isIpv4InCidr(candidate,cidr)))return true;const addresses=new Set();for(const host of PAYFAST_SOURCE_HOSTS){try{for(const item of await dns.lookup(host,{all:true}))addresses.add(normaliseIp(item.address))}catch(error){console.error(`PayFast DNS lookup failed for ${host}:`,error.message)}}return addresses.has(candidate)};
export const validatePayfastNotification=async(data)=>{const body=Object.entries(data).map(([key,value])=>`${encodePayfastValue(key)}=${encodePayfastValue(value)}`).join("&");const response=await axios.post(payfastValidateUrl(),body,{headers:{"Content-Type":"application/x-www-form-urlencoded"},timeout:10000,validateStatus:()=>true});return String(response.data||"").trim().toUpperCase()==="VALID"};
