const express = require('express');
const bodyParser = require('body-parser');
const path = require('path'); // Add this line to use the 'path' module
const mysql = require('mysql2');
const fs = require('fs');
const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MySQL Connection
const db = mysql.createConnection({
  host: 'mysql-form-a-form-a.a.aivencloud.com',
  user: 'avnadmin',
  password: 'AVNS_futcysUyq8Mu3YZhr4U',
  database: 'defaultdb',
  port: 27132,
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

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve the homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve other pages similarly

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


// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
