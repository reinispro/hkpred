// src/components/Flag.js
import countryCodes from "@/lib/countryCodes";

const Flag = ({ country, size = 24 }) => {
  const code = countryCodes[country];
  
  if (!code) {
    const fallbackContent = "?";
    return (
      <span className="inline-block w-8 h-6 bg-gray-700 text-xs text-white flex items-center justify-center">
        {fallbackContent}
      </span>
    );
  }
  
  const flagHeight = (size * 3) / 4;
  
  return (
    <img
      src={`https://flagcdn.com/w${size}/${code}.png`}
      alt={country}
      className="inline-block rounded-sm"
      width={size}
      height={flagHeight}
    />
  );
};

export default Flag;