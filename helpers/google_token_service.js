const fs = require('fs');
const path = require('path');
const { GoogleAuth } = require('google-auth-library');

const SERVICE_ACCOUNT_KEY_FILE = path.resolve(__dirname, '..', 'service_account.json');

function getServiceAccountCredentials() {
    const rawCredentials = fs.readFileSync(SERVICE_ACCOUNT_KEY_FILE, 'utf8');
    const credentials = JSON.parse(rawCredentials);

    if (typeof credentials.private_key === 'string') {
        credentials.private_key = credentials.private_key.replace(/\\n/g, '\n').trim();
    }

    return credentials;
}

async function getAccessToken() {
    try {
        const auth = new GoogleAuth({
            credentials: getServiceAccountCredentials(),
            scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
        });

        const client = await auth.getClient();
        const accessTokenResponse = await client.getAccessToken();
        return accessTokenResponse.token;
    } catch (error) {
        if (error?.response?.data?.error === 'invalid_grant') {
            throw new Error('Invalid Firebase service account credentials. Replace service_account.json with a fresh key from Google Cloud or Firebase.');
        }
        throw error;
    }
}

module.exports = {
    getAccessToken
};
