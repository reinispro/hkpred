import React from "react";
import countryCodes from "@/lib/countryCodes";

export default function Flag({ country, size = 24 }) {
  const code = countryCodes[country];
  
  if (!code) {
    return React.createElement('span', {
      className: "inline-block w-8 h-6 bg-gray-700 text-xs text-white flex items-center justify-center"
    }, '?');
  }
  
  return React.createElement('img', {
    src: `https://flagcdn.com/w${size}/${code}.png`,
    alt: "",
    className: "inline-block rounded-sm object-cover",
    width: size,
    height: Math.floor((size * 3) / 4)
  });
}