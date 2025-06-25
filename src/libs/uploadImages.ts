import { getImageComplements } from '../firebase/firebase.config';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';

export async function uploadImageForSms(userId: string, image: File) {
  const { smsImageStorageRef } = getImageComplements();

  const uuid = crypto.randomUUID();
  const filePath = `/${userId}/${uuid}$`;
  const newImageRef = ref(smsImageStorageRef, filePath);
  await uploadBytesResumable(newImageRef, image);

  return await getDownloadURL(newImageRef);
}

export async function uploadDepositScanned(file: File) {
  const { scannedDepositReceiptStorageRef } = getImageComplements();

  const uuid = crypto.randomUUID();
  const filePath = `/${uuid}$/`;
  const newfileRef = ref(scannedDepositReceiptStorageRef, filePath);
  await uploadBytesResumable(newfileRef, file);

  return await getDownloadURL(newfileRef);
}
