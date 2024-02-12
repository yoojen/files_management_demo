import express from 'express';
import bodyParser from 'body-parser';
import router from './routes/index';
const PORT = process.env.PORT || 5000;

const app = express();
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(router);

app.listen(PORT, () => {
  console.log(`server listening on port ${PORT}`);
});
