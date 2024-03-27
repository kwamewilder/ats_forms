const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const bcrypt = require('bcrypt');
const ejs = require('ejs');
const axios = require('axios');
const flash = require('express-flash');




const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Express session middleware
app.use(session({
  secret: 'your_secret_key', 
  resave: false,
  saveUninitialized: false
}));

// Setup flash middleware
app.use(flash());

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
};



// MySQL Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
  ssl: {
    ca: fs.readFileSync(path.join(__dirname, 'ca.pem')),
  },
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL');
});

// Passport local strategy
passport.use(new LocalStrategy(
  (username, password, done) => {
      // Find user in the database by username
      db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
          if (err) {
              return done(err);
          }
          if (!results.length) {
              return done(null, false, { message: 'Incorrect username.' });
          }
          const user = results[0];
          // Compare hashed password
          bcrypt.compare(password, user.password, (err, isMatch) => {
              if (err) {
                  return done(err);
              }
              if (isMatch) {
                  // Passwords match, authentication successful
                  return done(null, user);
              } else {
                  // Passwords do not match
                  return done(null, false, { message: 'Incorrect password.' });
              }
          });
      });
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  const sql = 'SELECT * FROM users WHERE id = ?';
  db.query(sql, [id], (err, results) => {
    if (err || !results || results.length === 0) {
      return done(err, null);
    }
    const user = results[0];
    return done(null, user);
  });
});

// Routes

// Display registration form
app.get('/register', (req, res) => {
  res.sendFile(__dirname + '/registration.html');
});

// Handle registration form submission
app.post('/register', (req, res) => {
  const { username, password } = req.body;

  // Hash the password
  bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
          console.error('Error hashing password:', err);
          res.status(500).send('Internal Server Error');
          return;
      }

      // Insert user into the database
      const sql = 'INSERT INTO users (username, password) VALUES (?, ?)';
      const values = [username, hashedPassword];

      db.query(sql, values, (err, result) => {
          if (err) {
              console.error('Error inserting user into database:', err);
              res.status(500).send('Internal Server Error');
              return;
          }

          console.log('User registered successfully!');
          res.send('User registered successfully!');
      });
  });
});

// Route to handle user login
app.post('/login', passport.authenticate('local', {
  successRedirect: '/report-management', // Redirect to report management page upon successful login
  failureRedirect: '/login', // Redirect back to login page upon failed login
  failureFlash: true
}));

// Route to render login form
app.get('/login', (req, res) => {
  res.render('login', { message: req.flash('error') });
});

// Route to handle user logout
app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/login');
});

// Protected route (requires authentication)
app.get('/report-management', isAuthenticated, (req, res) => {
  // Render the report management page
  res.render('report-management');
});


// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve the homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle form submission for hazard-report
app.post('/submit-hazard-report', (req, res) => {
  // Extract data from the form submission
  const yourName = req.body.yourName || 'Anonymous'; // Default to 'Anonymous' if not provided
  const department = req.body.department;
  const description = req.body.description;
  const observationDetails = req.body.observationDetails;
  const recommendation = req.body.recommendation;

  // Insert the data into the MySQL database
  const sql = 'INSERT INTO hazard_reports(your_name, department, description, observation_details, recommendation) VALUES (?, ?, ?, ?, ?)';
  const values = [yourName, department, description, observationDetails, recommendation];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error inserting data into MySQL:', err);
      res.status(500).send('Internal Server Error');
      return;
    }

    console.log('Report submitted successfully!');
    res.send('Report submitted successfully!');
  });
});

// Route to fetch hazard reports
app.get('/fetch-hazard-reports', (req, res) => {
  const sql = 'SELECT * FROM hazard_reports ORDER BY id DESC';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching hazard reports:', err);
      res.status(500).send('Internal Server Error');
      return;
    }
    res.json({ hazardReports: results });
  });
});

/// Handle form submission for ATS Report A
app.post('/submit-ats-report-a', (req, res) => {
 // Extract data from the form submission
const refNo = req.body.refNo;
const aircraftCallSign = req.body.aircraftCallSign;
const aircraftType = req.body.aircraftType;
const operator = req.body.operator;
const phaseOfFlightTaxiing = req.body.phaseOfFlightTaxiing ? 'Taxiing' : '';
const phaseOfFlightLanding = req.body.phaseOfFlightLanding ? 'Landing' : '';
const phaseOfFlightRolling = req.body.phaseOfFlightRolling ? 'Rolling' : '';
const phaseOfFlightStationary = req.body.phaseOfFlightStationary ? 'Stationary' : '';
const phaseOfFlight = [phaseOfFlightTaxiing, phaseOfFlightLanding, phaseOfFlightRolling, phaseOfFlightStationary].filter(Boolean).join(', '); // Join the array into a comma-separated string
const dateOfIncident = req.body.dateOfIncident;
const timeOfIncident = req.body.timeOfIncident;
const placeOfIncident = req.body.placeOfIncident;
const detailedDescription = req.body.detailedDescription;
const controllerName = req.body.controllerName;
const controllerSignature = req.body.controllerSignature;


// Insert the data into the MySQL database
const sql = `
  INSERT INTO ats_report_a 
  (ref_no, aircraft_call_sign, aircraft_type, operator, phase_of_flight, date_of_incident, time_of_incident, place_of_incident, detailed_description, controller_name, controller_signature, ) 
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,)
`;
const values = [
  refNo,
  aircraftCallSign,
  aircraftType,
  operator,
  phaseOfFlight,
  dateOfIncident,
  timeOfIncident,
  placeOfIncident,
  detailedDescription,
  controllerName,
  controllerSignature
];

db.query(sql, values, (err, result) => {
  if (err) {
    console.error('Error inserting data into MySQL:', err);
    res.status(500).send('Internal Server Error: ' + err.message); // Send detailed error message
    return;
  }

  console.log('ATS Report A submitted successfully!');
  res.send('ATS Report A submitted successfully!');
});

});

// Route to fetch ATS Report A
app.get('/fetch-ats-report-a', (req, res) => {
  const sql = 'SELECT * FROM ats_report_a ORDER BY id DESC';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching ATS Report A:', err);
      res.status(500).send('Internal Server Error');
      return;
    }
    res.json({ atsReportA: results });
  });
});


// Handle form submission for ATS Report B
app.post('/submit-ats-report-b', (req, res) => {
  // Extract data from the form submission
  const refNo = req.body.refNo;
  const aircraftCallSign = req.body.aircraftCallSign;
  const aircraftType = req.body.aircraftType;
  const aircraftRegistration = req.body.registration;
  const operator = req.body.operator;
  const placeOfDeparture = req.body.placeOfDeparture;
  const timeOfDeparture = req.body.timeOfDeparture;
  const destination = req.body.destination;
  const eta = req.body.eta;
  const route = req.body.route;
  const phaseOfFlightClimbing = req.body.phaseOfFlightClimbing ? 'Climbing' : '';
  const phaseOfFlightDescending = req.body.phaseOfFlightDescending ? 'Descending' : '';
  const phaseOfFlightCruising = req.body.phaseOfFlightCruising ? 'Cruising' : '';
  const phaseOfFlight = [phaseOfFlightClimbing, phaseOfFlightDescending, phaseOfFlightCruising].filter(Boolean);
  const dateOfIncident = req.body.dateOfIncident;
  const timeOfIncident = req.body.timeOfIncident;
  const placeOfIncident = req.body.placeOfIncident;
  const statusOfFacilities = req.body.statusOfFacilities;
  const detailedDescription = req.body.detailedDescription;
  const controllerName = req.body.controllerName;
  const controllerSignature = req.body.controllerSignature;
  const reportDate = req.body.reportDate;
  const reportTime = req.body.reportTime;

  // Insert the data into the MySQL database
  const sql = `
    INSERT INTO ats_report_b 
    (ref_no, aircraft_call_sign, aircraft_type, aircraft_registration, operator_name, place_of_departure, departure_time, destination, eta, route, phase_of_flight, incident_date, incident_time, incident_location, facilities_status, detailed_description, controller_name, controller_signature, report_date, report_time) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    refNo,
    aircraftCallSign,
    aircraftType,
    aircraftRegistration,
    operator,
    placeOfDeparture,
    timeOfDeparture,
    destination,
    eta,
    route,
    phaseOfFlight.join(', '), // Convert array to comma-separated string
    dateOfIncident,
    timeOfIncident,
    placeOfIncident,
    statusOfFacilities,
    detailedDescription,
    controllerName,
    controllerSignature,
    reportDate,
    reportTime
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error inserting data into MySQL:', err);
      res.status(500).send('Internal Server Error: ' + err.message); // Send detailed error message
      return;
    }

    console.log('ATS Report B submitted successfully!');
    res.send('ATS Report B submitted successfully!');
  });
});

// Route to fetch ATS Report B
app.get('/fetch-ats-report-b', (req, res) => {
  const sql = 'SELECT * FROM ats_report_b ORDER BY id DESC';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching ATS Report B:', err);
      res.status(500).send('Internal Server Error');
      return;
    }
    res.json({ atsReportB: results });
  });
});


// Handle ATS Report C form submission
app.post('/submit-ats-report-c', (req, res) => {
  // Extract data from the form submission
  const refNo = req.body.refNo;
  const date = req.body.date;
  const time = req.body.time;
  const facilityEquipment = req.body.facilityEquipment;
  const occurrence = req.body.occurrence;
  const controllerName = req.body.controllerName;
  const controllerSignature = req.body.controllerSignature;

  // Insert the data into the MySQL database
  const sql = 'INSERT INTO ats_report_c (ref_no, date, time, facility_equipment, occurrence, controller_name, controller_signature) VALUES (?, ?, ?, ?, ?, ?, ?)';
  const values = [refNo, date, time, facilityEquipment, occurrence, controllerName, controllerSignature];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error inserting data into MySQL:', err);
      res.status(500).send('Internal Server Error');
      return;
    }

    console.log('ATS Report C submitted successfully!');
    res.send('ATS Report C submitted successfully!');
  });
});

// Route to fetch ATS Report C
app.get('/fetch-ats-report-c', (req, res) => {
  const sql = 'SELECT * FROM ats_report_c ORDER BY id DESC';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching ATS Report C:', err);
      res.status(500).send('Internal Server Error');
      return;
    }
    res.json({ atsReportC: results });
  });
});

// Handle Voluntary Report form submission
app.post('/submit-voluntary-report', (req, res) => {
  // Extract data from the form submission
  const refNo = req.body.refNo;

  // A. Aircraft Related Events
  const aircraftCallSign = req.body.aircraftCallSign;
  // Add similar lines for other Aircraft Related Events fields

  // B. Other Events
  const otherEvents = req.body.events; // This will be an array
  // Add similar lines for other Other Events fields

  // C. The Occurrence
  const dateOfOccurrence = req.body.dateOfOccurrence;
  const timeOfOccurrence = req.body.timeOfOccurrence;
  const placeOfOccurrence = req.body.placeOfOccurrence;
  // Add similar lines for other Occurrence fields

  // Insert the data into the MySQL database
  const sql = 'INSERT INTO voluntary_report (ref_no, aircraft_call_sign, other_events, date_of_occurrence, time_of_occurrence, place_of_occurrence) VALUES (?, ?, ?, ?, ?, ?)';
  const values = [refNo, aircraftCallSign, JSON.stringify(otherEvents), dateOfOccurrence, timeOfOccurrence, placeOfOccurrence];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error inserting data into MySQL:', err);
      res.status(500).send('Internal Server Error');
      return;
    }

    console.log('Voluntary Report submitted successfully!');
    res.send('Voluntary Report submitted successfully!');
  });
});

// Route to fetch voluntary reports
app.get('/fetch-voluntary-reports', (req, res) => {
  const sql = 'SELECT * FROM voluntary_report ORDER BY id DESC';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching voluntary reports:', err);
      res.status(500).send('Internal Server Error');
      return;
    }
    res.json({ voluntaryReports: results });
  });
});

// Group entries by table
app.get('/group-entries-by-table', (req, res) => {
  const tables = ['hazard_reports', 'ats_report_a', 'ats_report_b', 'ats_report_c', 'voluntary_report'];
  const groupedEntries = {};

  const fetchAndGroupEntries = (tableName) => {
    return new Promise((resolve, reject) => {
      let fields = 'id'; // Common field for all tables
      if (tableName !== 'hazard_reports') {
        fields += ', ref_no'; // Additional field for tables other than hazard_reports
      }
      const sql = `SELECT ${fields} FROM ${tableName} ORDER BY id DESC`;
      db.query(sql, (err, results) => {
        if (err) {
          console.error(`Error fetching ${tableName}:`, err);
          reject(err);
        } else {
          groupedEntries[tableName] = results;
          resolve();
        }
      });
    });
  };

  const promises = tables.map((table) => fetchAndGroupEntries(table));

  Promise.all(promises)
    .then(() => {
      res.json(groupedEntries);
    })
    .catch((error) => {
      res.status(500).send('Internal Server Error');
    });
});

// Route to render report-management.ejs and pass grouped entries and tables
app.get('/report-management', (req, res) => {
  // Define the tables array
  const tables = ['hazard_reports', 'ats_report_a', 'ats_report_b', 'ats_report_c', 'voluntary_report'];

  // Make a GET request to fetch grouped entries from the server
  axios.get('http://localhost:3000/group-entries-by-table') // Assuming your server is running locally on port 3000
    .then(response => {
      // Pass the grouped entries and tables array to the report-management.ejs template
      res.render('report-management', { groupedEntries: response.data, tables: tables });
    })
    .catch(error => {
      console.error('Error fetching grouped entries:', error);
      res.status(500).send('Internal Server Error');
    });
});





app.set('view engine', 'ejs');

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
