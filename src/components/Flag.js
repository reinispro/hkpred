import countryCodes from "@/lib/countryCodes";

export default function Flag({ country, size = 40 }) {
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
      className="inline-block w-8 h-6 object-cover rounded-sm"
    />
  );
}
