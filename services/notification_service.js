const express = require("express");
const router = express.Router();
const { response } = require("express");
const authenticateToken = require("../helpers/authtoken.js");
const { default: axios } = require("axios");
const { getAccessToken } = require("../helpers/google_token_service.js");


router.post("/sendNotification", [authenticateToken.validJWTNeeded, sendNotification]);

async function sendNotification(req, res) { 
    try {
        const token = await getAccessToken();
        if(token != undefined || token != null) {
        const response = await axios.post("https://fcm.googleapis.com/v1/projects/bhagwan-traders/messages:send", req.body, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });
        if (response.status === 200) {
            res.status(200).send({message : "Notification sent successfully", status: true});
        } else {
           return res.status(200).send({error:"Error sending notification"});
            }
        }else{
           return res.status(401).send({error:"Error retrieving access token"});
        }
    } catch (error) {
        console.error("Error sending notification:", error);
        return res.status(200).send({error:"Error sending notification: " + error.message});
    }
}

module.exports = router;