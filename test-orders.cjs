const axios = require('axios');
async function run() {
  try {
    const login = await axios.post('http://localhost:3002/v1/auth/login', {
      login: 'admin@test.uz',
      password: 'admin123'
    });
    const token = login.data.access_token;
    
    const res = await axios.get('http://localhost:3002/v1/orders', { headers: { Authorization: `Bearer ${token}` }});
    console.log(JSON.stringify(res.data.data.slice(0, 2), null, 2));
  } catch(e) {
    console.log("Error logic:");
    console.log(e.response ? JSON.stringify(e.response.data, null, 2) : e.message);
  }
}
run();
