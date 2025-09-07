
const crypto = require('crypto');

const key = crypto.randomBytes(32).toString('hex');
console.log("Your random AUTH_KEY:", key);
