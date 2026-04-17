const axios = require('axios');

async function fetchAllData(name) {
  const [genderRes, ageRes, nationRes] = await Promise.all([
    axios.get(`https://api.genderize.io?name=${name}`),
    axios.get(`https://api.agify.io?name=${name}`),
    axios.get(`https://api.nationalize.io?name=${name}`)
  ]);

  const g = genderRes.data;
  const a = ageRes.data;
  const n = nationRes.data;

  if (!g.gender || g.count === 0)
    throw { code: 502, api: 'Genderize' };
  if (!a.age)
    throw { code: 502, api: 'Agify' };
  if (!n.country || n.country.length === 0)
    throw { code: 502, api: 'Nationalize' };

  const age = a.age;
  let age_group;
  if (age <= 12) age_group = 'child';
  else if (age <= 19) age_group = 'teenager';
  else if (age <= 59) age_group = 'adult';
  else age_group = 'senior';

  const topCountry = n.country.reduce((a, b) =>
    a.probability > b.probability ? a : b
  );

  return {
    gender: g.gender,
    gender_probability: g.probability,
    sample_size: g.count,
    age,
    age_group,
    country_id: topCountry.country_id,
    country_probability: topCountry.probability
  };
}

module.exports = { fetchAllData };