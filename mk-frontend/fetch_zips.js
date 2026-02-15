const fs = require('fs');
const https = require('https');

const targetZips = new Set(['75069', '75070', '75071', '75072']);
const url = 'https://raw.githubusercontent.com/OpenDataDE/State-zip-code-GeoJSON/master/tx_texas_zip_codes_geo.min.json';

console.log('Downloading Texas Zip Codes...');

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            console.log('Download complete. Parsing...');
            const json = JSON.parse(data);

            if (json && json.features) {
                const filteredFeatures = json.features.filter(f => {
                    // The property name for zip code might vary, usually ZCTA5CE10 or similar in TIGER data
                    // Let's check common properties
                    const props = f.properties;
                    const zip = props.ZCTA5CE10 || props.zip || props.ZIP || props.postalCode;
                    return targetZips.has(zip);
                });

                // Normalize properties to match user expectation (ZIP_NO)
                const normalizedFeatures = filteredFeatures.map(f => ({
                    type: 'Feature',
                    properties: {
                        ZIP_NO: f.properties.ZCTA5CE10 || f.properties.zip || f.properties.ZIP
                    },
                    geometry: f.geometry
                }));

                if (normalizedFeatures.length > 0) {
                    const featureCollection = {
                        type: 'FeatureCollection',
                        features: normalizedFeatures
                    };
                    fs.writeFileSync('public/data/Zip_Codes.json', JSON.stringify(featureCollection));
                    console.log(`Saved public/data/Zip_Codes.json with ${normalizedFeatures.length} zip codes.`);
                } else {
                    console.error('No matching zip codes found in the dataset.');
                    // Log a few properties to help debug
                    if (json.features.length > 0) {
                        console.log('Sample properties:', json.features[0].properties);
                    }
                }
            } else {
                console.error('Invalid GeoJSON format.');
            }
        } catch (e) {
            console.error('Error parsing JSON', e);
        }
    });
}).on('error', (err) => {
    console.error('Error downloading file: ' + err.message);
});
