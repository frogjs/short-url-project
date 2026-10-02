import { customAlphabet } from 'nanoid';

const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const createCode = customAlphabet(alphabet, 7);

export const generateShortCode = () => createCode();
