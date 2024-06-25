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

export const voiceResponse = () => {
    
    return (
      `<Response>
        <Dial callerId="+12243134447">        
          <Client>
            FlowsupsClientDetail
          </Client>
        </Dial>
      </Response>`
    )
    
}
