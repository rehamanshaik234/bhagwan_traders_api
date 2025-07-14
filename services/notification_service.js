const router = express.Router();
const { response } = require("express");
const authenticateToken = require("../helpers/authtoken.js");
const { default: axios } = require("axios");
const { getAccessToken } = require("../helpers/google_token_service.js");


router.post("/sendNotification", [authenticateToken.validJWTNeeded, sendNotification]);

async function sendNotification(req, res) { 
    try {
        const token = await getAccessToken();
        if(token === undefined || token === null) {
        const response = await axios.post("https://fcm.googleapis.com/fcm/send", req.body, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `key=${token}`
            }
        });
        if (response.status === 200) {
            res.status(200).send("Notification sent successfully");
        } else {
           return res.status(200).send("Error sending notification");
            }
        }else{
           return res.status(401).send("Error retrieving access token");
        }
    } catch (error) {
        return res.status(200).send("Error sending notification: " + error.message);
    }
}
