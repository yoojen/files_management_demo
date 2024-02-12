export default class Auth {
  static async decodedInput(input) {
    const decodedBuffer = Buffer.from(input, 'base64');
    const decodedString = decodedBuffer.toString('utf-8');
    return decodedString;
  }
}
