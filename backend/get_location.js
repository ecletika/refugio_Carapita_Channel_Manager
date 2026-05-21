const https = require('https');
const fs = require('fs');

https.get('https://maps.app.goo.gl/vfbginGV6Fjjp7YH9', (res) => {
    fs.writeFileSync('backend/location.txt', res.headers.location);
});
