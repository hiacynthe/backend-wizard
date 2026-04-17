const axios = require('axios');

module.exports = async (req, res) => {
  const { name } = req.query;

  if (!name || name.trim() === '') {
    return res.status(400).json({
      status: 'error',
      message: 'Missing or empty name parameter'
    });
  }

  if (typeof name !== 'string') {
    return res.status(422).json({
      status: 'error',
      message: 'name must be a string'
    });
  }

  try {
    const response = await axios.get(`https://api.genderize.io/?name=${name}`);
    const genderData = response.data;

    if (!genderData.gender || genderData.count === 0) {
      return res.status(200).json({
        status: 'error',
        message: 'No prediction available for the provided name'
      });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        name: name.toLowerCase(),
        gender: genderData.gender,
        probability: genderData.probability,
        sample_size: genderData.count,
        is_confident: genderData.probability >= 0.7 && genderData.count >= 100,
        processed_at: new Date().toISOString()
      }
    });

  } catch (error) {
    if (error.response) {
      return res.status(502).json({ status: 'error', message: 'Upstream API error' });
    }
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};