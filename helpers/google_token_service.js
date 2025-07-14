const { GoogleAuth } = require('google-auth-library');

// Path to your service account JSON file
const SERVICE_ACCOUNT_KEY_FILE =  "service_account.json";

async function getAccessToken() {
    const auth = new GoogleAuth({
        keyFile: SERVICE_ACCOUNT_KEY_FILE,
        scopes: ['https://www.googleapis.com/auth/firebase.messaging'],  // Change scope as needed
    });

    const client = await auth.getClient();
    const accessTokenResponse = await client.getAccessToken();
    return accessTokenResponse.token;
}

module.exports = {
    getAccessToken
};
