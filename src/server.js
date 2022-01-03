import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import path from 'path';

const app = express();
const __dirname = path.resolve();

app.use(express.static(path.join(__dirname, '/build')));
app.use(bodyParser.json());

const withDB = async (operations, res) =>{
    try{
        const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true });
        const db = client.db('mylib');
        await operations(db);
        client.close();
    }catch ( error ) {
        res.status(500).json({ message: 'Error connecting to db', error });
    }
};

app.get('/api/articles/:name', async (req,res) => {
    withDB( async (db) => {
        const articleName = req.params.name;
        const articleInfo = await db.collection('articles').findOne( {name: articleName} );
        res.status(200).json(articleInfo);
    }, res);
});

app.post('/api/articles/:name/upvote', async (req, res) => {
    withDB( async (db) =>{
        const articleName = req.params.name;
        const updatedUpVote = await db.collection('articles').updateOne( {name: articleName }, {$inc: { upvotes : 1}} ); 
        const articleInfo = await db.collection('articles').findOne( {name: articleName} );
        res.status(200).json(articleInfo);
    }, res); 
});

app.post('/api/articles/:name/add-comment', (req, res) => {
    withDB( async (db) => {
        const { username, text } = req.body;
        const articleName = req.params.name;
        const test = await db.collection('articles').updateOne({name:articleName},{$push:{comments:{username,text}}});
        // articlesInfo[articleName].comments.push({ username, text }); TODO: make the above line of code work.
        const articleInfo = await db.collection('articles').findOne({name:articleName});
        res.status(200).json({articleInfo})
    },res);
    
});

app.get('*', (req,res) => {
    res.sendFile(path.resolve(__dirname + '/src/build/index.html'));
    // C:\Users\isaia\Documents\LearningReact\my-blog-backend\src\build\index.html
});

app.listen(8000, () => console.log('Listening on port 8000'));