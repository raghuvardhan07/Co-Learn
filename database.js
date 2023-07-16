import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config();

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
let db;

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log('Connected to MongoDB database');
    db = client.db();
  } catch (err) {
    console.error('Error connecting to MongoDB', err);
  }
}

export async function getUsers() {
  const users = db.collection('users');
  return users.find().toArray();
}

export async function getUsersExcept(uname) {
    const users = db.collection('users').find({'username': {$ne: uname}});
    return users.toArray();
  }

export async function getUser(id) {
  const users = db.collection('users');
  return users.findOne({ _id: id });
}

export async function getUserName(username) {
  const users = db.collection('users');
  return users.findOne({ username: username });
}

export async function createUser(name, gender, native, email, number, rating, username, password) {
  const users = db.collection('users');

  const newUser = {
    name: name,
    gender: gender, 
    native: native,
    email: email,
    number: number,
    rating: rating,
    username: username,
    password: password
  };

  const result = await users.insertOne(newUser);
  const insertedId = result.insertedId;

  return getUser(insertedId);
}

export async function checkUser(username, password) {
  const users = db.collection('users');
  const user = await users.findOne({ username: username, password: password });

  return !!user; // Return true if user is found, false otherwise
}

export async function getSameLang(username, learning) {
  const users = db.collection('users');
  const userList = await users.find({ learning: learning, username: { $ne: username } });

  return userList.toArray(); 
}


