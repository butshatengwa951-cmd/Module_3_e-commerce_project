import rice from "../assets/tastic-rice.png";
import whiteStar from "../assets/white-star.png";
import beans from "../assets/beans.png";
import cornflakes from "../assets/cornflakes.png";
import curryPowder from "../assets/curry-powder.png";
import hulets from "../assets/hulets.png";
import instant from "../assets/instant.png";
import maizeMeal from "../assets/maize-meal.png";
import mayonnaise from "../assets/mayonnaise.png";
import ricoffy from "../assets/ricoffy.png";
import sunfoil from "../assets/sunfoil.png";
import tomatoSauce from "../assets/tomato-sauce.png";

const fallback = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=700&h=700&fit=crop";

export function getProductImage(product) {
  const name = String(product?.product_name || product?.name || "").toLowerCase();
  if (name.includes("white star")) return whiteStar;
  if (name.includes("tastic rice")) return rice;
  if (name.includes("sunfoil")) return sunfoil;
  if (name.includes("iwisa")) return maizeMeal;
  if (name.includes("all gold")) return tomatoSauce;
  if (name.includes("koo")) return beans;
  if (name.includes("pakco")) return curryPowder;
  if (name.includes("ace")) return instant;
  if (name.includes("crosse")) return mayonnaise;
  if (name.includes("huletts")) return hulets;
  if (name.includes("ricoffy")) return ricoffy;
  if (name.includes("kellogg")) return cornflakes;
  return product?.image_url || fallback;
}
