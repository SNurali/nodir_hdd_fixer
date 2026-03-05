const axios = require('axios');
async function run() {
  try {
    const login = await axios.post('http://localhost:3002/v1/auth/login', {
      login: 'admin@test.uz',
      password: 'admin123'
    });
    console.log("Login success! Token:", login.data.access_token ? "Exists" : "Missing");
  } catch(e) {
    console.log("Error logic:");
    console.log(e.response ? JSON.stringify(e.response.data, null, 2) : e.message);
  }
}
run();
