import twilio from 'twilio';

const VoiceResponse = twilio.twiml.VoiceResponse
const AccessToken = twilio.jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant

let identity

export const tokenGenerator = () => {

    identity = 'FlowsupsClientDetail'

    const accessToken = new AccessToken(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_API_KEY,
        process.env.TWILIO_API_SECRET,
        { identity: identity}
    )

    const grant = new VoiceGrant({ outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID ,incomingAllow: true })

    accessToken.addGrant(grant)

    return {
        identity: identity,
        token: accessToken.toJwt()
    }

} 

export const voiceResponse = (requestBody) => {

    const toNumberOrClientName = requestBody.To
    const callerId = process.env.TWILIO_PHONE_NUMBER.toString()
    let twiml = new VoiceResponse()

    if (toNumberOrClientName == callerId) {
       
        let dial = twiml.dial();
    
        dial.client(identity);
    
    } else if (requestBody.To) {        
        
        let dial = twiml.dial({ callerId });
        
        const attr = isAValidPhoneNumber(toNumberOrClientName)
            ? "number"
            : "client";
        dial[attr]({}, toNumberOrClientName);

    } else {

        twiml.say("Thanks for calling!");

    }

    return twiml.toString()
    
}

function isAValidPhoneNumber(number) {
    return /^[\d\+\-\(\) ]+$/.test(number);
  }