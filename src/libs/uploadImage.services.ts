import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { getSmsImageStorageRef } from '../firebase/firebase.config';
import crypto from 'crypto';

export async function uploadImageForSms(
  customerId: string,
  imageBuffer: Buffer | Uint8Array,
  contentType: string,
): Promise<string> {
  const smsImageStorageRef = getSmsImageStorageRef();

  if (smsImageStorageRef) {
    const uuid = crypto.randomUUID();
    const filePath = `/${customerId}/${uuid}`;
    const newImageRef = ref(smsImageStorageRef, filePath);

    await uploadBytesResumable(newImageRef, imageBuffer, {
      contentType: contentType,
    });

    return await getDownloadURL(newImageRef);
  } else {
    return '';
  }
}
