// src/components/Flag.js
import countryCodes from "@/lib/countryCodes";

const Flag = ({ country, size = 24 }) => {
  const code = countryCodes[country];
  if (!code) {
    return (
      <span className="inline-block w-8 h-6 bg-gray-700 text-xs text-white flex items-center justify-center">
        ?
      </span>
    );
  }

  return (
    <img
      src={`https://flagcdn.com/w${size}/${code}.png`}
      alt={country}
      className="inline-block rounded-sm"
      width={size}
      height={(size * 3) / 4} // karogi 4:3 proporcijā
    />
  );
};

export default Flag;
