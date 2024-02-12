import { v4 as uuidv4 } from 'uuid';
import redisClient from '../utils/redis';
import { Buffer } from 'buffer';
import dbClient from '../utils/db';
import Auth from '../utils/auth';

export default class AuthController {
  static async getConnect(req, res) {
    const authHeader = req.get('authorization').split(' ')[1];
    if (!authHeader) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const decodedString = await Auth.decodedInput(authHeader);
    const email = decodedString.split(':')[0];
    try {
      const collection = await dbClient.usersCollection();
      const user = await collection.find({ email }).toArray();
      const userToken = uuidv4();
      const duration = 24 * 60 * 60;

      await redisClient.set(
        `auth_${userToken}`,
        user[0]._id.toString(),
        duration
      );

      res.status(200).json({ token: userToken });
    } catch (error) {
      console.log(error);
      res.status(401).json({ error: 'Unauthorized' });
    }
  }
  static async getDisconnect(req, res) {
    const xToken = req.headers['x-token'];
    if (!xToken) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      await redisClient.del(`auth_${xToken}`);
      res.status(204).json({});
    } catch (error) {
      res.status(401).json({ error: 'Unauthorized' });
    }
  }
}
