// server.js

const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
const JSONStream = require('JSONStream'); 

const app = express();
app.use(bodyParser.json());
app.use(cors());

const port = 3000;

// Function to construct the prompt
function constructPrompt(userPreferences) {
  return `
Your job is to respond to the JSON data below with three of the most relevent car suggestions.
Your entire job is to just give car recommendations in the form of standardized JSON data. DO NOT respond with ANY text other than the properly formatted
standardzed JSON data. An end user has selected some preferences on what kind of car they want.
Each JSON user entry I provide you should be equally weighted in terms of importance.
Please make exactly THREE relevent recommendations that best overall match the user's given preferences.

Here is the data they have provided about their preferences in JSON format:

  ${JSON.stringify(userPreferences)}

You response data should be formatted EXACTLY in the following manner. DO NOT includeanything other than data formatted in this way. Please put your responses in the
relevant quotations ("") in the JSON data. Remember, your response should ALWAYS match this exact format and should be your top 3 recommendations based on the end user's
given preferences. It is VITAL that it matches this exact format because this data will be going straight into a SQL insert statement and put into a database.

Please do your best to ensure ALL PROVIDED DATA is accurate. End users will be making purchase decisions based on this information, so it should be true to the absolute BEST of your knowledge.
[
    {
    "carMake": "",
    "carModel": "",
    "carYear": "",
    "carMSRP": "",
    "carMPG": "",
    "carTowingCapacity": "",
    "carDrivetrain": "",
    "carEngineType": "",
    "carFuelType": "",
    "carEngineCylinders": "",
    "carType": "",
    "carSeatingCapacity": "",
    "carTransmissionType": ""
  },
    {
    "carMake": "",
    "carModel": "",
    "carYear": "",
    "carMSRP": "",
    "carMPG": "",
    "carTowingCapacity": "",
    "carDrivetrain": "",
    "carEngineType": "",
    "carFuelType": "",
    "carEngineCylinders": "",
    "carType": "",
    "carSeatingCapacity": "",
    "carTransmissionType": ""
  },
    {
    "carMake": "",
    "carModel": "",
    "carYear": "",
    "carMSRP": "",
    "carMPG": "",
    "carTowingCapacity": "",
    "carDrivetrain": "",
    "carEngineType": "",
    "carFuelType": "",
    "carEngineCylinders": "",
    "carType": "",
    "carSeatingCapacity": "",
    "carTransmissionType": ""
  }
]

  ENSURE THAT THE ONLY THING YOU ARE RETURNING IS VALID JSON DATA MATCHING THIS PROMPT. THERE SHOULD BE NO OTHER TEXT OR DATA. 

  The JSON data should contain the corresponding info. I will provide some examples as well. 
  carMake: Make of the car
  carModel: Model of the car
  carYear: Year of the car
  carMSRP: MSRP of the car. PLEASE MAKE SURE THIS IS CORRECT!!!
  carMPG: MPG of the car.
  carTowingCapacity: Towing capacity of the car (if applicable). If the car does not have a towing capacity, it is acceptable to return a value of N/A
  carDrivetrain: Drivetrain of the car. (ex: Front Wheel Drive, Rear Wheel Drive, All Wheel Drive, Four Wheel Drive)
  carEngineType: Type of engine. (ex: 4-cylinder, V6, V8)
  carFuelType: Fuel type of car. (ex: Unleaded, Diesel, Electric)
  carEngineCylinders: Number of engine cylinders. This should be based off of the engine type. For example, a 4-cylinder should ALWAYS have a value of 4, V6 ALWAYS has a value of 6, V8 ALWAYS has a value of 8, etc. Please make sure this is accurate!!
  carType: Body type of the car (ex: Sedan, SUV, etc.)
  carSeatingCapacity: Seating capacity of the car. 
  carTransmissionType: Transmission type of the car (ex: automatic, manual, CVT). 
  `;
}

app.post('/api/getCarRecommendations', async (req, res) => {
  const userPreferences = req.body;
  const prompt = constructPrompt(userPreferences);

  try {
    // Send the prompt to the Ollama model with responseType 'stream'
    const response = await axios.post(
      'http://localhost:11434/api/generate',
      {
        model: 'gemma2:latest', // Ensure this matches running model name
        prompt: prompt,
      },
      {
        responseType: 'stream',
      }
    );
//    const aiResponse = response.data.response;

  //  console.log('AI Response:', aiResponse);

    // Initialize a variable to hold the generated text
    let generatedText = '';

    // Handle streaming data
    response.data.on('data', (chunk) => {
      // Process each chunk of data
      const chunkStr = chunk.toString();
      const lines = chunkStr.split('\n').filter(Boolean);

      lines.forEach((line) => {
        try {
          const json = JSON.parse(line);

          if (json.response) {
            generatedText += json.response;
          }
        } catch (err) {
          console.error('Error parsing JSON line:', err);
        }

        
      });
    });

    // Listen for the end event to send the complete text back to the frontend
    response.data.on('end', () => {
      // After assembling the generated text, attempt to parse it as JSON
      try {
        const recommendationsJSON = JSON.parse(generatedText);
        res.json({ recommendations: recommendationsJSON });
      } catch (err) {
        console.error('Error parsing generated text as JSON:', err);
        res.status(500).json({ error: 'Failed to parse recommendations' });
      }
    });

    // Handle errors in the streaming response
    response.data.on('error', (error) => {
      console.error('Error processing Ollama response:', error);
      res.status(500).json({ error: 'Error generating recommendations' });
    });
  } catch (error) {
    console.error('Error communicating with Ollama:', error.message);
    res.status(500).json({ error: 'Error generating recommendations' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
