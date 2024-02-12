import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import { ObjectId } from 'mongodb';
import { v4 as uuid } from 'uuid';
import { join } from 'path';
import { mkdir, writeFile, stat, existsSync, realpath } from 'fs';
import { promisify } from 'util';
import path from 'path';
import Db from 'mongodb/lib/db';

const mkdirAsync = promisify(mkdir);
const writeFileASync = promisify(writeFile);
const statAsync = promisify(stat);
const existAsync = promisify(existsSync);
const MIMES = ['folder, file,image'];
const INITIA_PARENT_VALUE = 0;
export default class FilesHandler {
  static async postUpload(req, res) {
    const xToken = req.headers['x-token'];
    const name = req.body.name;
    const parentId = req.body.parentId || INITIA_PARENT_VALUE;
    const isPublic = req.body.isPublic || false;
    const type = req.body.type;
    const data = req.body.data;

    if (!xToken) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!name) {
      res.status(400).json({ error: 'Missing name' });
      return;
    }
    if (!type) {
      res.status(400).json({ error: 'Missing type ' });
      return;
    }

    if (parentId) {
      const filesCollection = await dbClient.filesCollection();
      const parent = await filesCollection()
        .find({ _id: new ObjectId(parentId) })
        .toArray();
      if (!parent) {
        res.status(400).json({ error: 'Parent not found' });
        return;
      }
      if (parent) {
        if (parent[0].type !== 'folder') {
          res.status(400).json('Parent is not a folder');
        }
      }
    }
    if (!data && type != 'folder') {
      res.status(400).json({ error: 'Missing data' });
    }

    const redisUserId = await redisClient.get(`auth_${xToken}`);
    try {
      let FOLDER_PATH = process.env.FOLDER_PATH;

      const collection = await dbClient.usersCollection();
      const user = await collection
        .find({ _id: new ObjectId(redisUserId) })
        .toArray();
      if (!FOLDER_PATH || folder === '') {
        FOLDER_PATH = '/tmp/files_manager';
      }
      //FROM HERE I AM CONFUSED
      //I CAN CREATE FILE IN DB
      //BUT HANDLING LOCATION ON DISK STORAGE IS NOT EASY WITH ME
      if (!data && type !== MIMES[0]) {
        await mkdirAsync(FOLDER_PATH, { recursive: true });
        // when type is not folder
        const file_name = join(FOLDER_PATH, uuid());
        console.log(file_name);
        await writeFileASync(file_name, Buffer.from(data, 'base64'));
      }
      if (type === 'folder') {
        if (!existAsync(`${FOLDER_PATH}/${name}`)) {
          await mkdirAsync(`${FOLDER_PATH}/${name}`);
        }
      }
      //UP TO HERE

      const filesCollection = await dbClient.filesCollection();
      const insertedFile = await filesCollection.insertOne({
        userId: user[0]._id,
        name,
        type,
        isPublic,
        parentId,
        localPath: FOLDER_PATH,
      });

      res.status(201).json({
        id: insertedFile.insertedId.toString(),
        userId: user[0]._id,
        name,
        type,
        isPublic,
        parentId,
      });
    } catch (error) {
      console.log(error);
      res.status(401).json({ error: 'Unauthorized' });
    }
  }
}
