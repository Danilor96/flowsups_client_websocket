import { uploadImageForSms } from './uploadImage.services';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

export async function incomingFileSave(mediaUrl: string, mediaType: string, customerId: string) {
  try {
    // Obtener la URL autenticada
    const authenticatedUrl = mediaUrl;

    // Descargar el archivo usando fetch
    const response = await fetch(authenticatedUrl, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Error al descargar el archivo: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();

    const imageBuffer = Buffer.from(arrayBuffer);

    const downloadUrl = await uploadImageForSms(customerId, imageBuffer, mediaType);

    return downloadUrl;
  } catch (error) {
    console.log(error);
  }
}
