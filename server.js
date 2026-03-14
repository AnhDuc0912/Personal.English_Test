require('dotenv').config();

const express = require('express');
const path = require('path');
const { engine } = require('express-handlebars');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const connectDatabase = require('./src/config/db');
const webRoutes = require('./src/routes/web');

const app = express();
const port = process.env.PORT || 3000;

connectDatabase();

app.engine(
  'hbs',
  engine({
    extname: '.hbs',
    defaultLayout: 'main',
    helpers: {
      eq: (left, right) => left === right,
      addOne: (value) => Number(value) + 1
    }
  })
);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-session-secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: 'sessions'
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 8,
      httpOnly: true
    }
  })
);

app.use((req, res, next) => {
  res.locals.currentUser = req.session?.user || null;
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', webRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('result', {
    pageTitle: 'Thong bao loi',
    exam: null,
    summary: null,
    errorMessage: 'Da co loi xay ra. Vui long thu lai sau.'
  });
});

app.listen(port, () => {
  console.log(`Server dang chay tai http://localhost:${port}`);
});