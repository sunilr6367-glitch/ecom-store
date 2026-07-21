import { countries } from './src/config/countries.js';
function getCountryName(code) {
  const country = countries.find((c) => c.code === code);
  return country?.name || code;
}
console.log('--- COUNTRY NAME FOR IN ---');
console.log(getCountryName('IN'));
