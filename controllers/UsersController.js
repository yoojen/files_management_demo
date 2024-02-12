import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import sha1 from 'sha1';
import { ObjectId } from 'mongodb';

export default class UsersController {
  static async postNew(req, res) {
    const email = req.body ? req.body.email : null;
    const password = req.body ? req.body.password : null;
    if (!email) {
      res.status(400).json({ error: 'Missing email' });
      return;
    }
    if (!password) {
      res.status(400).json({ error: 'Missing password' });
      return;
    }

    const user = await (await dbClient.usersCollection()).findOne({ email });
    if (user) {
      res.status(400).json({ error: 'Already exist' });
      return;
    } else {
      const insertInfo = await (
        await dbClient.usersCollection()
      ).insertOne({ email, password: sha1(password) });
      res.status(201).json({ email, id: insertInfo.insertedId.toString() });
    }
  }

  static async getMe(req, res) {
    const xToken = req.headers['x-token'];
    if (!xToken) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const redisUserId = await redisClient.get(`auth_${xToken}`);
    try {
      const collection = await dbClient.usersCollection();
      const user = await collection
        .find({ _id: new ObjectId(redisUserId) })
        .toArray();
      res.status(200).json({ email: user[0].email, id: user[0]._id });
    } catch (error) {
      res.status(401).json({ error: 'Unauthorized' });
    }
  }
}
