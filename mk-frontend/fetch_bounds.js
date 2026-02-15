const fs = require('fs');
const https = require('https');

const url = 'https://nominatim.openstreetmap.org/search?q=McKinney+TX&format=json&polygon_geojson=1';

https.get(url, { headers: { 'User-Agent': 'MkWeatherApp/1.0' } }, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json && json.length > 0 && json[0].geojson) {
                const bounds = json[0].geojson;
                fs.writeFileSync('public/McKinney_Bounds.json', JSON.stringify(bounds));
                console.log('Saved public/McKinney_Bounds.json');
            } else {
                console.error('Invalid response format', data.substring(0, 100));
            }
        } catch (e) {
            console.error('Error parsing JSON', e);
        }
    });
}).on('error', (err) => {
    console.error('Error: ' + err.message);
});
